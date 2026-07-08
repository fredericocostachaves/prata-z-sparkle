
-- ============ ROLES ============
create type public.app_role as enum ('admin', 'staff', 'cliente');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "admin manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles own" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'staff'));
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin all" on public.profiles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- On signup: create profile row + auto-grant admin to configured email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email));
  if lower(new.email) = 'contato@pratazjoias.com.br' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'cliente') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ TIMESTAMP HELPER ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ============ FORNECEDORES ============
create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  cnpj text,
  email text,
  telefone text,
  endereco text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.fornecedores to authenticated;
grant all on public.fornecedores to service_role;
alter table public.fornecedores enable row level security;
create policy "forn read staff" on public.fornecedores for select to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'staff'));
create policy "forn write admin" on public.fornecedores for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger trg_fornecedores_updated before update on public.fornecedores for each row execute function public.set_updated_at();

-- ============ PRODUTOS ============
create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  nome text not null,
  descricao text,
  preco_custo numeric(10,2) not null default 0,
  preco_venda numeric(10,2) not null default 0,
  estoque_atual integer not null default 0,
  estoque_minimo integer not null default 0,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  peso_g numeric(10,2),
  altura_cm numeric(10,2),
  largura_cm numeric(10,2),
  comprimento_cm numeric(10,2),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.produtos to authenticated;
grant all on public.produtos to service_role;
alter table public.produtos enable row level security;
create policy "prod read staff" on public.produtos for select to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'staff'));
create policy "prod write admin" on public.produtos for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger trg_produtos_updated before update on public.produtos for each row execute function public.set_updated_at();

-- ============ CLIENTES (CRM) ============
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  nome_completo text not null,
  cpf_cnpj text,
  email text,
  telefone text,
  cep text, rua text, numero text, complemento text,
  bairro text, cidade text, uf text,
  tags text[] default '{}',
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.clientes (email);
grant select, insert, update, delete on public.clientes to authenticated;
grant all on public.clientes to service_role;
alter table public.clientes enable row level security;
create policy "cli read staff" on public.clientes for select to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'staff'));
create policy "cli write admin" on public.clientes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger trg_clientes_updated before update on public.clientes for each row execute function public.set_updated_at();

-- ============ PEDIDOS ============
create type public.metodo_pagamento as enum ('pix','cartao');
create type public.status_pagamento as enum ('pendente','pago','cancelado');
create type public.status_logistica as enum ('aguardando_envio','etiqueta_gerada','enviado','entregue');

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero serial unique,
  cliente_id uuid references public.clientes(id) on delete set null,
  data_compra timestamptz not null default now(),
  metodo_pagamento public.metodo_pagamento not null,
  status_pagamento public.status_pagamento not null default 'pendente',
  status_logistica public.status_logistica not null default 'aguardando_envio',
  subtotal numeric(10,2) not null default 0,
  valor_frete numeric(10,2) not null default 0,
  valor_total numeric(10,2) not null default 0,
  tracking_code text,
  etiqueta_url text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.pedidos (cliente_id);
create index on public.pedidos (status_pagamento);
create index on public.pedidos (data_compra desc);
grant select, insert, update, delete on public.pedidos to authenticated;
grant all on public.pedidos to service_role;
alter table public.pedidos enable row level security;
create policy "ped read staff" on public.pedidos for select to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'staff'));
create policy "ped write admin" on public.pedidos for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger trg_pedidos_updated before update on public.pedidos for each row execute function public.set_updated_at();

-- ============ ITENS DO PEDIDO ============
create table public.itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index on public.itens_pedido (pedido_id);
grant select, insert, update, delete on public.itens_pedido to authenticated;
grant all on public.itens_pedido to service_role;
alter table public.itens_pedido enable row level security;
create policy "itens read staff" on public.itens_pedido for select to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'staff'));
create policy "itens write admin" on public.itens_pedido for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ TRIGGER: baixa de estoque ao mudar para pago ============
create or replace function public.baixa_estoque_pedido_pago()
returns trigger language plpgsql security definer set search_path = public as $$
declare it record;
begin
  if new.status_pagamento = 'pago' and (old.status_pagamento is distinct from 'pago') then
    for it in select produto_id, quantidade from public.itens_pedido where pedido_id = new.id loop
      update public.produtos set estoque_atual = estoque_atual - it.quantidade where id = it.produto_id;
    end loop;
  end if;
  return new;
end $$;
create trigger trg_baixa_estoque after update of status_pagamento on public.pedidos
  for each row execute function public.baixa_estoque_pedido_pago();
