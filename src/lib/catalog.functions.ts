import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { CATEGORY_SLUGS, type CatalogProduct, type CatalogResult, type CatalogProductDetail, type CatalogDetailResult, slugifySku } from "./catalog.types";

export const listCategoryProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.enum(CATEGORY_SLUGS) }).parse(d))
  .handler(async ({ data }): Promise<CatalogResult> => {
    try {
      const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
      const supabase = createClient<Database>(process.env.SUPABASE_URL!, key, {
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
        .eq("categoria", data.slug)
        .eq("ativo", true)
        .gte("estoque_atual", 1)
        .order("nome");

      if (error) {
        console.error("[Catalogo] Erro ao listar produtos:", error.message);
        return { products: [], source: "fallback", warning: "catalogo_indisponivel" };
      }

      // Saldo em tempo real do Bling quando as credenciais estiverem configuradas
      const { getBlingStockBySku } = await import("./catalog.server");
      const bling = await getBlingStockBySku();

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
      console.error("[Catalogo] Falha inesperada:", err);
      return { products: [], source: "fallback", warning: "catalogo_indisponivel" };
    }
  });

export const getProductDetail = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<CatalogDetailResult> => {
    try {
      const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
      const supabase = createClient<Database>(process.env.SUPABASE_URL!, key, {
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

      const { getBlingProductDetail } = await import("./catalog.server");
      const live = await getBlingProductDetail((row.sku ?? "").trim());

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
      console.error("[Catalogo] Falha ao carregar detalhe:", err);
      return { product: null, source: "fallback", warning: "catalogo_indisponivel" };
    }
  });
