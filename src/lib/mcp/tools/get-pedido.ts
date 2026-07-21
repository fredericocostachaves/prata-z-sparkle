import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ensureStaff, errorResult, supabaseForCaller, textResult } from "../helpers";

export default defineTool({
  name: "get_pedido",
  title: "Detalhar pedido",
  description: "Retorna dados completos de um pedido, incluindo cliente e itens.",
  inputSchema: { id: z.string().uuid().describe("ID do pedido.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const sb = supabaseForCaller(ctx);
    const { ok } = await ensureStaff(ctx, sb);
    if (!ok) return errorResult("Acesso restrito ao backoffice.");
    const { data, error } = await sb.from("pedidos").select("*, clientes(*), itens_pedido(*, produtos(nome, sku))").eq("id", id).maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult("Pedido não encontrado.");
    return textResult(data);
  },
});
