import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ensureStaff, errorResult, supabaseForCaller, textResult } from "../helpers";

export default defineTool({
  name: "update_pedido_status",
  title: "Atualizar status de pedido",
  description: "Atualiza o status de pagamento e/ou logística de um pedido.",
  inputSchema: {
    id: z.string().uuid(),
    status_pagamento: z.enum(["pendente", "pago", "cancelado"]).optional(),
    status_logistica: z.enum(["aguardando_envio", "etiqueta_gerada", "enviado", "entregue"]).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ id, status_pagamento, status_logistica }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const sb = supabaseForCaller(ctx);
    const { ok } = await ensureStaff(ctx, sb);
    if (!ok) return errorResult("Acesso restrito ao backoffice.");
    const patch: Record<string, string> = {};
    if (status_pagamento) patch.status_pagamento = status_pagamento;
    if (status_logistica) patch.status_logistica = status_logistica;
    if (Object.keys(patch).length === 0) return errorResult("Informe status_pagamento e/ou status_logistica.");
    const { error } = await sb.from("pedidos").update(patch).eq("id", id);
    if (error) return errorResult(error.message);
    return textResult({ ok: true, id, ...patch });
  },
});
