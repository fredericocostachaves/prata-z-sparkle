import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { CATEGORY_SLUGS, type CatalogProduct, type CatalogResult } from "./catalog.types";

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
