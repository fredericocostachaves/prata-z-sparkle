import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  gallery: string[];
  description: string | null;
  category: string;
}

const CATEGORY_SLUGS = [
  "colares",
  "brincos",
  "aneis",
  "pulseiras",
  "pingentes",
  "berloques",
  "piercings",
  "tornozeleiras",
  "cuidados",
] as const;

export const listCategoryProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.enum(CATEGORY_SLUGS) }).parse(d))
  .handler(async ({ data }): Promise<CatalogProduct[]> => {
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
      console.error("[Catálogo] Erro ao listar produtos:", error.message);
      return [];
    }

    // Atualiza o estoque com o saldo em tempo real do Bling, quando disponível.
    const { getBlingStockBySku } = await import("./catalog.server");
    const blingStock = await getBlingStockBySku();

    return (rows ?? [])
      .map((r) => {
        const live = blingStock?.get((r.sku ?? "").trim());
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
  });
