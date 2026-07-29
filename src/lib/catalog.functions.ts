import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { CATEGORY_SLUGS, type CatalogProduct, type CatalogResult, type CatalogProductDetail, type CatalogDetailResult, type CatalogWarning, slugifySku } from "./catalog.types";
import { bling } from "./integrations/bling.server";

async function fetchBlingStock(): Promise<{ map: Map<string, number> | null; reason: CatalogWarning }> {
  const TTL = 5 * 60 * 1000;
  const cacheKey = "bling_stock_cache";
  const cached = (globalThis as any)[cacheKey] as { at: number; map: Map<string, number> } | undefined;
  if (cached && Date.now() - cached.at < TTL) return { map: cached.map, reason: null };

  if (!process.env.BLING_CLIENT_ID || !process.env.BLING_CLIENT_SECRET) {
    return { map: null, reason: "bling_nao_configurado" };
  }

  try {
    await bling.loadFromDb();
    if (!bling.hasTokens) return { map: null, reason: "bling_nao_configurado" };
    if (bling.isExpired) await bling.refreshTokens();

    const produtos = await bling.listAllProducts();
    if (!produtos.length) return { map: null, reason: "bling_indisponivel" };

    const stock = await bling.getStockBalances(produtos.map((p) => p.id));
    const map = new Map<string, number>();
    for (const p of produtos) {
      const sku = (p.codigo || String(p.id)).trim();
      if (!sku) continue;
      map.set(sku, stock.get(p.id) ?? 0);
    }

    (globalThis as any)[cacheKey] = { at: Date.now(), map };
    return { map, reason: null };
  } catch {
    return { map: null, reason: "bling_indisponivel" };
  }
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

interface BlingDetailResult {
  price: number | null;
  stock: number | null;
  description: string | null;
  images: string[];
  brand: string | null;
  weightG: number | null;
  dimensions: { height: number | null; width: number | null; length: number | null } | null;
  attributes: { label: string; value: string }[];
  variations: { id: string; name: string; sku: string; price: number; stock: number }[];
  reason: CatalogWarning;
}

function emptyDetail(reason: CatalogWarning): BlingDetailResult {
  return { price: null, stock: null, description: null, images: [], brand: null, weightG: null, dimensions: null, attributes: [], variations: [], reason };
}

async function fetchBlingDetail(sku: string): Promise<BlingDetailResult> {
  if (!sku) return emptyDetail("bling_indisponivel");
  if (!process.env.BLING_CLIENT_ID || !process.env.BLING_CLIENT_SECRET) return emptyDetail("bling_nao_configurado");

  try {
    await bling.loadFromDb();
    if (!bling.hasTokens) return emptyDetail("bling_nao_configurado");
    if (bling.isExpired) await bling.refreshTokens();

    const found = await bling.searchProduct(sku);
    if (!found) return emptyDetail("bling_indisponivel");

    const full = (await bling.getProductById(found.id)) ?? (found as unknown as Record<string, any>);
    const stockMap = await bling.getStockBalances([found.id]);

    const images: string[] = [];
    const midia = full?.midia?.imagens;
    for (const group of [midia?.internas, midia?.externas]) {
      for (const img of group ?? []) {
        const url = img?.link ?? img?.url;
        if (url) images.push(url);
      }
    }

    const attributes: { label: string; value: string }[] = [];
    const push = (label: string, value: unknown) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        attributes.push({ label, value: String(value) });
      }
    };
    push("Código (SKU)", full?.codigo);
    push("Marca", full?.marca);
    push("Unidade", full?.unidade);
    push("GTIN", full?.gtin);
    push("Condição", full?.condicao);
    push("Garantia (meses)", full?.garantia);
    push("Observações", full?.observacoes);
    for (const c of full?.camposCustomizados ?? []) {
      push(c?.campo?.nome ?? c?.nome ?? "Característica", c?.valor);
    }

    const variations = (full?.variacoes ?? []).map((v: any) => ({
      id: String(v?.id ?? v?.codigo ?? ""),
      name: String(v?.variacao?.nome ?? v?.nome ?? ""),
      sku: String(v?.codigo ?? ""),
      price: Number(v?.preco) || 0,
      stock: Number(v?.estoque?.saldoVirtualTotal ?? v?.estoque?.quantidade ?? 0) || 0,
    }));

    const dim = full?.dimensoes;

    return {
      price: num(full?.preco),
      stock: stockMap.get(found.id) ?? null,
      description: (full?.descricaoComplementar || full?.descricaoCurta || full?.descricao || null) ?? null,
      images,
      brand: full?.marca ?? null,
      weightG: num(full?.pesoBruto ? Number(full.pesoBruto) * 1000 : null),
      dimensions: dim ? { height: num(dim?.altura), width: num(dim?.largura), length: num(dim?.profundidade) } : null,
      attributes,
      variations,
      reason: null,
    };
  } catch {
    return emptyDetail("bling_indisponivel");
  }
}

export const listCategoryProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.enum(CATEGORY_SLUGS) }).parse(d))
  .handler(async ({ data }): Promise<CatalogResult> => {
    try {
      const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      if (!key || !url) {
        console.error("[Catalogo] Variáveis de ambiente do Supabase não configuradas");
        return { products: [], source: "fallback", warning: "catalogo_indisponivel" };
      }
      const supabase = createClient<Database>(url, key, {
        auth: { persistSession: false },
        global: {
          fetch: (input, init) => {
            const h = new Headers(init?.headers);
            if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
              h.delete("Authorization");
            }
            h.set("apikey", key);
            return fetch(input, { ...init, headers: h });
          },
        },
      });

      console.log(`[Catalogo] Consultando categoria "${data.slug}"...`);
      const { data: rows, error } = await supabase
        .from("produtos")
        .select("id, sku, nome, preco_venda, estoque_atual, imagem_url, galeria_urls, descricao, categoria")
        .eq("categoria", data.slug)
        .eq("ativo", true)
        .gte("estoque_atual", 1)
        .order("nome");

      if (error) {
        console.error(`[Catalogo] Erro ao listar produtos (categoria: ${data.slug}):`, error.message);
        return { products: [], source: "fallback", warning: "catalogo_indisponivel" };
      }

      console.log(`[Catalogo] Encontrados ${rows?.length ?? 0} produtos para "${data.slug}"`);

      // Se não houver produtos no banco, usar fallback
      if (!rows || rows.length === 0) {
        console.log(`[Catalogo] Nenhum produto encontrado para "${data.slug}" no banco, retornando fallback`);
        return { products: [], source: "fallback", warning: null };
      }

      // Saldo em tempo real do Bling quando as credenciais estiverem configuradas
      const bling = await fetchBlingStock();

      const products: CatalogProduct[] = (rows ?? [])
        .map((r) => {
          const live = bling.map?.get((r.sku ?? "").trim());
          return {
            id: r.id,
            sku: r.sku,
            name: r.nome,
            price: Number(r.preco_venda) || 0,
            stock: live ?? r.estoque_atual ?? 0,
            image: r.imagem_url,
            gallery: r.galeria_urls ?? [],
            description: r.descricao,
            category: r.categoria ?? data.slug,
          };
        })
        .filter((p) => p.stock >= 1);

      return {
        products,
        source: bling.map ? "bling" : "banco",
        warning: bling.reason,
      };
    } catch (err) {
      console.error("[Catalogo] Falha inesperada em listCategoryProducts:", err instanceof Error ? err.message : err, err instanceof Error ? err.stack : "");
      return { products: [], source: "fallback", warning: "catalogo_indisponivel" };
    }
  });

export const getProductDetail = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<CatalogDetailResult> => {
    try {
      const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      if (!key || !url) {
        console.error("[Catalogo] Variáveis de ambiente do Supabase não configuradas");
        return { product: null, source: "fallback", warning: "catalogo_indisponivel" };
      }
      const supabase = createClient<Database>(url, key, {
        auth: { persistSession: false },
        global: {
          fetch: (input, init) => {
            const h = new Headers(init?.headers);
            if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
              h.delete("Authorization");
            }
            h.set("apikey", key);
            return fetch(input, { ...init, headers: h });
          },
        },
      });

      const { data: rows, error } = await supabase
        .from("produtos")
        .select("id, sku, nome, preco_venda, estoque_atual, imagem_url, galeria_urls, descricao, categoria, peso_g, altura_cm, largura_cm, comprimento_cm")
        .eq("ativo", true);

      if (error) {
        console.error("[Catalogo] Erro ao buscar produto:", error.message);
        return { product: null, source: "fallback", warning: "catalogo_indisponivel" };
      }

      const row = (rows ?? []).find(
        (r) => r.id === data.slug || slugifySku(r.sku ?? "") === data.slug,
      );

      if (!row) {
        return { product: null, source: "banco", warning: "produto_nao_encontrado" };
      }

      const live = await fetchBlingDetail((row.sku ?? "").trim());

      const gallery = [
        ...live.images,
        ...(row.imagem_url ? [row.imagem_url] : []),
        ...(row.galeria_urls ?? []),
      ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i) as string[];

      const attributes = [...live.attributes];
      const dims = live.dimensions ?? {
        height: row.altura_cm ? Number(row.altura_cm) : null,
        width: row.largura_cm ? Number(row.largura_cm) : null,
        length: row.comprimento_cm ? Number(row.comprimento_cm) : null,
      };

      const product: CatalogProductDetail = {
        id: row.id,
        sku: row.sku,
        name: row.nome,
        price: live.price ?? Number(row.preco_venda) ?? 0,
        stock: live.stock ?? row.estoque_atual ?? 0,
        image: gallery[0] ?? null,
        gallery,
        description: live.description ?? row.descricao ?? null,
        category: row.categoria ?? "",
        brand: live.brand,
        weightG: live.weightG ?? (row.peso_g ? Number(row.peso_g) : null),
        dimensions: dims,
        attributes,
        variations: live.variations,
      };

      return {
        product,
        source: live.reason ? "banco" : "bling",
        warning: live.reason,
      };
    } catch (err) {
      console.error("[Catalogo] Falha inesperada em getProductDetail:", err instanceof Error ? err.message : err, err instanceof Error ? err.stack : "");
      return { product: null, source: "fallback", warning: "catalogo_indisponivel" };
    }
  });
