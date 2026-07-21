import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

export function supabaseForCaller(ctx: ToolContext): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ensureStaff(ctx: ToolContext, sb: SupabaseClient) {
  const userId = ctx.getUserId();
  const [{ data: isAdmin }, { data: isStaff }] = await Promise.all([
    sb.rpc("has_role", { _user_id: userId, _role: "admin" }),
    sb.rpc("has_role", { _user_id: userId, _role: "staff" }),
  ]);
  return { ok: !!isAdmin || !!isStaff, isAdmin: !!isAdmin };
}

export function textResult(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload) }] };
}

export function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}
