-- ============ BLING OAUTH TOKENS ============
create table public.bling_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.bling_tokens to authenticated;
grant all on public.bling_tokens to service_role;
alter table public.bling_tokens enable row level security;
create policy "bling tokens admin all" on public.bling_tokens for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger trg_bling_tokens_updated before update on public.bling_tokens for each row execute function public.set_updated_at();
