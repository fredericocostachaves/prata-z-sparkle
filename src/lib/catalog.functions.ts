import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { CATEGORY_SLUGS, type CatalogProduct, type CatalogResult, type CatalogProductDetail, type CatalogDetailResult, type CatalogWarning, type BestSellersResult, slugifySku } from "./catalog.types";

async function fetchBlingStock(): Promise<{ map: Map<string, number> | null; reason: CatalogWarning }> {
  try {
    const { getBlingStockBySku } = await import("./catalog.server");
    const res = await getBlingStockBySku();
    return { map: res.map, reason: res.reason };
  } catch (err) {
    console.warn("[Catalogo] Estoque Bling indisponível:", err);
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
  descriptionLong: string | null;
  images: string[];
  brand: string | null;
  weightG: number | null;
  dimensions: { height: number | null; width: number | null; length: number | null } | null;
  attributes: { label: string; value: string }[];
  variations: { id: string; name: string; sku: string; price: number; stock: number }[];
  reason: CatalogWarning;
}

function emptyDetail(reason: CatalogWarning): BlingDetailResult {
  return { price: null, stock: null, description: null, descriptionLong: null, images: [], brand: null, weightG: null, dimensions: null, attributes: [], variations: [], reason };
}

async function fetchBlingDetail(sku: string): Promise<BlingDetailResult> {
  if (!sku) return emptyDetail("bling_indisponivel");
  try {
    const { getBlingProductDetail } = await import("./catalog.server");
    return await getBlingProductDetail(sku);
  } catch (err) {
    console.warn("[Catalogo] Detalhe Bling indisponível:", err);
    return emptyDetail("bling_indisponivel");
  }
}


export const listCategoryProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.enum(CATEGORY_SLUGS) }).parse(d))
  .handler(async ({ data }): Promise<CatalogResult> => {
    try {
      const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      console.log("[Catalogo] Debug env:", { hasKey: !!key, hasUrl: !!url, keyPrefix: key?.slice(0, 10), url });
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

      console.log(`[Catalogo] Consultando categoria "${data.slug}"...`, { key: key?.slice(0, 10), url });
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
            name: formatProductTitle(r.sku, r.nome),
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
        name: formatProductTitle(live.code ?? row.sku, live.name ?? row.nome),
        price: live.price ?? Number(row.preco_venda) ?? 0,
        stock: live.stock ?? row.estoque_atual ?? 0,
        image: gallery[0] ?? null,
        gallery,
        description: live.description ?? row.descricao ?? null,
        descriptionLong: live.descriptionLong ?? live.description ?? row.descricao ?? null,
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

/**
 * Peças em destaque ("Top de vendas") agrupadas por categoria.
 * Só entram itens ativos com estoque acima de 1 unidade (mínimo 2).
 */
export const listBestSellersByCategory = createServerFn({ method: "GET" }).handler(
  async (): Promise<BestSellersResult> => {
    try {
      const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      if (!key || !url) return { groups: [], source: "fallback", warning: "catalogo_indisponivel" };

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
        .select("id, sku, nome, preco_venda, estoque_atual, imagem_url, galeria_urls, descricao, categoria")
        .eq("ativo", true)
        .gt("estoque_atual", 1)
        .order("estoque_atual", { ascending: false });

      if (error) {
        console.error("[Catalogo] Erro em listBestSellersByCategory:", error.message);
        return { groups: [], source: "fallback", warning: "catalogo_indisponivel" };
      }

      const bling = await fetchBlingStock();

      const byCategory = new Map<string, CatalogProduct[]>();
      for (const r of rows ?? []) {
        const slug = (r.categoria ?? "").trim();
        if (!(CATEGORY_SLUGS as readonly string[]).includes(slug)) continue;
        const live = bling.map?.get((r.sku ?? "").trim());
        const stock = live ?? r.estoque_atual ?? 0;
        if (stock <= 1) continue;
        const list = byCategory.get(slug) ?? [];
        list.push({
          id: r.id,
          sku: r.sku,
          name: formatProductTitle(r.sku, r.nome),
          price: Number(r.preco_venda) || 0,
          stock,
          image: r.imagem_url,
          gallery: r.galeria_urls ?? [],
          description: r.descricao,
          category: slug,
        });
        byCategory.set(slug, list);
      }

      const groups = CATEGORY_SLUGS.filter((s) => (byCategory.get(s)?.length ?? 0) > 0).map((s) => ({
        slug: s,
        products: (byCategory.get(s) ?? []).slice(0, 12),
      }));

      return { groups, source: bling.map ? "bling" : "banco", warning: bling.reason };
    } catch (err) {
      console.error("[Catalogo] Falha inesperada em listBestSellersByCategory:", err);
      return { groups: [], source: "fallback", warning: "catalogo_indisponivel" };
    }
  },
);
