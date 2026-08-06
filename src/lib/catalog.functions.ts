import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  CATEGORY_SLUGS,
  categorySearchKeywords,
  type CatalogProduct,
  type CatalogResult,
  type CatalogProductDetail,
  type CatalogDetailResult,
  type CatalogWarning,
  type BestSellersResult,
  slugifySku,
  formatProductTitle,
} from "./catalog.types";

/**
 * Cliente do catálogo. Usa service_role (somente no servidor) para ler a
 * tabela produtos: a role anon/publishable key não tem mais SELECT na tabela,
 * apenas na view pública restrita vw_catalogo_produtos. Retorna null quando as
 * variáveis de ambiente do Supabase não estão configuradas.
 */
async function getCatalogDb() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("[Catalogo] Debug env:", {
    hasKey: !!key,
    hasUrl: !!url,
    keyPrefix: key?.slice(0, 10),
    url,
  });
  if (!key || !url) {
    console.error("[Catalogo] Variáveis de ambiente do Supabase não configuradas");
    return null;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function fetchBlingStock(): Promise<{
  map: Map<string, number> | null;
  reason: CatalogWarning;
  detail?: string;
}> {
  try {
    const { getBlingStockBySku } = await import("./catalog.server");
    const res = await getBlingStockBySku();
    return { map: res.map, reason: res.reason, detail: res.detail };
  } catch (err) {
    console.warn("[Catalogo] Estoque Bling indisponível:", err);
    return {
      map: null,
      reason: "bling_indisponivel",
      detail: err instanceof Error ? err.message : "fetchBlingStock lançou",
    };
  }
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

interface BlingDetailResult {
  name: string | null;
  code: string | null;
  price: number | null;
  stock: number | null;
  description: string | null;
  descriptionLong: string | null;
  descriptionShort: string | null;
  images: string[];
  brand: string | null;
  weightG: number | null;
  dimensions: { height: number | null; width: number | null; length: number | null } | null;
  attributes: { label: string; value: string }[];
  variations: { id: string; name: string; sku: string; price: number; stock: number }[];
  reason: CatalogWarning;
}

function emptyDetail(reason: CatalogWarning): BlingDetailResult {
  return {
    name: null,
    code: null,
    price: null,
    stock: null,
    description: null,
    descriptionLong: null,
    descriptionShort: null,
    images: [],
    brand: null,
    weightG: null,
    dimensions: null,
    attributes: [],
    variations: [],
    reason,
  };
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
      const supabase = await getCatalogDb();
      if (!supabase) return { products: [], source: "fallback", warning: "catalogo_indisponivel" };

      console.log(`[Catalogo] Consultando categoria "${data.slug}"...`);
      const { data: firstRows, error } = await supabase
        .from("produtos")
        .select(
          "id, sku, nome, preco_venda, estoque_atual, imagem_url, galeria_urls, descricao, categoria",
        )
        .eq("categoria", data.slug)
        .eq("ativo", true)
        .gte("estoque_atual", 1)
        .order("nome");
      let rows = firstRows;

      if (error) {
        console.error(
          `[Catalogo] Erro ao listar produtos (categoria: ${data.slug}):`,
          error.message,
        );
        return { products: [], source: "fallback", warning: "catalogo_indisponivel" };
      }

      // Produtos ainda sem categoria preenchida (importados antes da classificação):
      // busca por palavra-chave no NOME para não deixar a vitrine vazia. A descrição
      // não entra aqui porque ela costuma citar outras categorias ("combine com
      // brincos e pulseiras"), o que poluiria o resultado.
      //
      // IMPORTANTE: descartamos no final qualquer produto que JÁ tenha categoria
      // preenchida. As palavras-chave são genéricas demais ("cuidados", "limpeza",
      // "polimento") e sem esse descarte itens já classificados em outra categoria
      // (ex.: 'colares') acabariam vazando para esta página no fallback.
      if ((rows?.length ?? 0) === 0) {
        const keywords = categorySearchKeywords(data.slug);
        if (keywords.length) {
          const orFilter = keywords.map((kw) => `nome.ilike.%${kw}%`).join(",");
          const res = await supabase
            .from("produtos")
            .select(
              "id, sku, nome, preco_venda, estoque_atual, imagem_url, galeria_urls, descricao, categoria",
            )
            .eq("ativo", true)
            .gte("estoque_atual", 1)
            .or(orFilter)
            .order("nome");
          if (res.error) {
            console.error(
              `[Catalogo] Erro na busca por palavra-chave (${data.slug}):`,
              res.error.message,
            );
          } else {
            rows = (res.data ?? []).filter((r) => !(r.categoria ?? "").trim());
            console.log(
              `[Catalogo] Categoria "${data.slug}" vazia; palavra-chave encontrou ${res.data?.length ?? 0} produto(s), mantidos ${rows.length} sem categoria`,
            );
          }
        }
      }

      console.log(`[Catalogo] Encontrados ${rows?.length ?? 0} produtos para "${data.slug}"`);

      // Se não houver produtos no banco, usar fallback
      if (!rows || rows.length === 0) {
        console.log(
          `[Catalogo] Nenhum produto encontrado para "${data.slug}" no banco, retornando fallback`,
        );
        return { products: [], source: "fallback", warning: null };
      }

      // Saldo em tempo real do Bling quando as credenciais estiverem configuradas
      const bling = await fetchBlingStock();

      const mapProduct = (r: (typeof rows)[number]): CatalogProduct => ({
        id: r.id,
        sku: r.sku,
        name: formatProductTitle(r.sku, r.nome),
        price: Number(r.preco_venda) || 0,
        stock: bling.map?.get((r.sku ?? "").trim()) ?? r.estoque_atual ?? 0,
        image: r.imagem_url,
        gallery: r.galeria_urls ?? [],
        description: r.descricao,
        category: r.categoria ?? data.slug,
      });

      let products: CatalogProduct[] = (rows ?? []).map(mapProduct).filter((p) => p.stock >= 1);

      // Se o saldo "em tempo real" do Bling zerou tudo (SKUs divergentes, token de
      // outra conta etc.), não esvaziamos a vitrine: usamos o saldo do banco.
      let warning = bling.reason;
      let debug = bling.detail;
      if (products.length === 0 && (rows ?? []).length > 0 && bling.map) {
        const dbOnly = (rows ?? [])
          .map((r) => ({ ...mapProduct(r), stock: r.estoque_atual ?? 0 }))
          .filter((p) => p.stock >= 1);
        if (dbOnly.length > 0) {
          products = dbOnly;
          warning = "bling_indisponivel";
          const dbSkus = (rows ?? []).map((r) => (r.sku ?? "").trim()).filter(Boolean);
          const matched = dbSkus.filter((s) => bling.map!.has(s));
          const matchedWithZero = matched.filter((s) => (bling.map!.get(s) ?? 0) <= 0);
          const sampleMapKeys = [...bling.map!.keys()].slice(0, 5);
          const sampleDbSkus = dbSkus.slice(0, 5);
          const zeroEs = (rows ?? []).filter((r) => (r.estoque_atual ?? 0) <= 0).length;
          const guardDebug = [
            `mapa do Bling sem saldo p/ "${data.slug}"`,
            `SKUs na cat: ${dbSkus.length}`,
            `presentes no mapa: ${matched.length}`,
            `dos quais zerados: ${matchedWithZero.length}`,
            `DB estoque<=0: ${zeroEs}/${dbSkus.length}`,
            `ex. mapa: [${sampleMapKeys.join(", ")}]`,
            `ex. DB: [${sampleDbSkus.join(", ")}]`,
          ].join(" | ");
          debug = debug ? `${guardDebug} || fetch: ${debug}` : guardDebug;
          console.warn(
            `[Catalogo] Bling zerou o estoque de "${data.slug}"; usando saldo do banco (${dbOnly.length} peças) — ${debug}`,
          );
        }
      }

      return {
        products,
        source: bling.map ? "bling" : "banco",
        warning,
        debug,
      };
    } catch (err) {
      console.error(
        "[Catalogo] Falha inesperada em listCategoryProducts:",
        err instanceof Error ? err.message : err,
        err instanceof Error ? err.stack : "",
      );
      return { products: [], source: "fallback", warning: "catalogo_indisponivel" };
    }
  });

export const getProductDetail = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<CatalogDetailResult> => {
    try {
      const supabase = await getCatalogDb();
      if (!supabase) return { product: null, source: "fallback", warning: "catalogo_indisponivel" };

      const { data: rows, error } = await supabase
        .from("produtos")
        .select(
          "id, sku, nome, preco_venda, estoque_atual, imagem_url, galeria_urls, descricao, categoria, peso_g, altura_cm, largura_cm, comprimento_cm",
        )
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
        price: (live.price ?? Number(row.preco_venda)) || 0,
        stock: live.stock ?? row.estoque_atual ?? 0,
        image: gallery[0] ?? null,
        gallery,
        description: live.description ?? row.descricao ?? null,
        descriptionLong: live.descriptionLong ?? live.description ?? row.descricao ?? null,
        descriptionShort: live.descriptionShort ?? row.descricao ?? null,
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
      console.error(
        "[Catalogo] Falha inesperada em getProductDetail:",
        err instanceof Error ? err.message : err,
        err instanceof Error ? err.stack : "",
      );
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
      const supabase = await getCatalogDb();
      if (!supabase) return { groups: [], source: "fallback", warning: "catalogo_indisponivel" };

      const { data: rows, error } = await supabase
        .from("produtos")
        .select(
          "id, sku, nome, preco_venda, estoque_atual, imagem_url, galeria_urls, descricao, categoria",
        )
        .eq("ativo", true)
        .gt("estoque_atual", 1)
        .order("estoque_atual", { ascending: false });

      if (error) {
        console.error("[Catalogo] Erro em listBestSellersByCategory:", error.message);
        return { groups: [], source: "fallback", warning: "catalogo_indisponivel" };
      }

      const bling = await fetchBlingStock();

      const byCategory = new Map<string, CatalogProduct[]>();
      let zeroedByBling = false;
      for (const r of rows ?? []) {
        const slug = (r.categoria ?? "").trim();
        if (!(CATEGORY_SLUGS as readonly string[]).includes(slug)) continue;
        const live = bling.map?.get((r.sku ?? "").trim());
        const stock = live ?? r.estoque_atual ?? 0;
        if (live === 0 && (r.estoque_atual ?? 0) > 1) zeroedByBling = true;
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

      // Bling zerou o saldo de tudo: refaz com o saldo do banco para não esvaziar a vitrine.
      let warning = bling.reason;
      if (zeroedByBling && (rows ?? []).length > 0 && byCategory.size === 0) {
        for (const r of rows ?? []) {
          const slug = (r.categoria ?? "").trim();
          if (!(CATEGORY_SLUGS as readonly string[]).includes(slug)) continue;
          if ((r.estoque_atual ?? 0) <= 1) continue;
          const list = byCategory.get(slug) ?? [];
          list.push({
            id: r.id,
            sku: r.sku,
            name: formatProductTitle(r.sku, r.nome),
            price: Number(r.preco_venda) || 0,
            stock: r.estoque_atual ?? 0,
            image: r.imagem_url,
            gallery: r.galeria_urls ?? [],
            description: r.descricao,
            category: slug,
          });
          byCategory.set(slug, list);
        }
        warning = "bling_indisponivel";
        console.warn(`[Catalogo] Best sellers: Bling zerou o estoque; usando saldo do banco`);
      }

      const groups = CATEGORY_SLUGS.filter((s) => (byCategory.get(s)?.length ?? 0) > 0).map(
        (s) => ({
          slug: s,
          products: (byCategory.get(s) ?? []).slice(0, 12),
        }),
      );

      return { groups, source: bling.map ? "bling" : "banco", warning };
    } catch (err) {
      console.error("[Catalogo] Falha inesperada em listBestSellersByCategory:", err);
      return { groups: [], source: "fallback", warning: "catalogo_indisponivel" };
    }
  },
);
