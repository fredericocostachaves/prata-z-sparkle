
alter function public.set_updated_at() set search_path = public;

-- Revoke public execute on SECURITY DEFINER functions
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.baixa_estoque_pedido_pago() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon;

-- has_role is called from RLS policies as the current user; keep authenticated execute
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
