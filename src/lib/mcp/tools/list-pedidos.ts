import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ensureStaff, errorResult, supabaseForCaller, textResult } from "../helpers";

export default defineTool({
  name: "list_pedidos",
  title: "Listar pedidos",
  description: "Lista os pedidos mais recentes da loja Prata Z (para admin/staff).",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional().describe("Quantidade máxima de pedidos (padrão 50)."),
    status_pagamento: z.enum(["pendente", "pago", "cancelado"]).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status_pagamento }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const sb = supabaseForCaller(ctx);
    const { ok } = await ensureStaff(ctx, sb);
    if (!ok) return errorResult("Acesso restrito ao backoffice.");
    let q = sb.from("pedidos").select("id, data_compra, valor_total, status_pagamento, status_logistica, metodo_pagamento, clientes(nome_completo, email)").order("data_compra", { ascending: false }).limit(limit ?? 50);
    if (status_pagamento) q = q.eq("status_pagamento", status_pagamento);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult(data);
  },
});
