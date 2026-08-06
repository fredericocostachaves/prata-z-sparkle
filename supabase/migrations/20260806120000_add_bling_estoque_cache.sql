-- Cache compartilhado do estoque do Bling.
-- O Cloudflare Worker roda em vários isolates, cada um com sua própria memória:
-- sem esse cache, cada isolate puxa TODOS os produtos + saldos do Bling a cada
-- ~5 min, o que estoura o rate-limit da API e faz o saldo real-time vir sempre
-- zerado. Com uma única linha no banco, todos os isolates leem o mesmo mapa.
create table public.bling_estoque_cache (
  id smallint primary key default 1 check (id = 1),
  mapa jsonb not null,
  atualizado_em timestamptz not null default now()
);

grant select, insert, update, delete on public.bling_estoque_cache to service_role;
alter table public.bling_estoque_cache enable row level security;
