import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ensureStaff, errorResult, supabaseForCaller, textResult } from "../helpers";

export default defineTool({
  name: "list_produtos",
  title: "Listar produtos",
  description: "Lista produtos do catálogo com estoque atual. Filtro opcional por texto (nome/SKU).",
  inputSchema: {
    query: z.string().optional().describe("Texto para filtrar por nome ou SKU."),
    only_low_stock: z.boolean().optional().describe("Se verdadeiro, retorna apenas itens abaixo do estoque mínimo."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, only_low_stock }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const sb = supabaseForCaller(ctx);
    const { ok } = await ensureStaff(ctx, sb);
    if (!ok) return errorResult("Acesso restrito ao backoffice.");
    let q = sb.from("produtos").select("id, sku, nome, preco_venda, estoque_atual, estoque_minimo").order("nome");
    if (query) q = q.or(`nome.ilike.%${query}%,sku.ilike.%${query}%`);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    const rows = only_low_stock ? (data ?? []).filter((p) => p.estoque_atual <= p.estoque_minimo) : data;
    return textResult(rows);
  },
});
