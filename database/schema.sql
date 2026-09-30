-- ==============================================================
-- DOCE & PEDIDO — Schema Supabase (PostgreSQL)
-- Execute este arquivo no SQL Editor do Supabase.
-- ==============================================================

-- ---------- Extensões ----------
create extension if not exists "uuid-ossp";

-- ---------- Tabelas ----------

-- Perfis de usuários administradores (espelha auth.users do Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- Categorias do cardápio
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Produtos
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  image_url text,
  gallery jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  is_available boolean not null default true,
  stock integer check (stock is null or stock >= 0),
  is_featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Clientes (deduplicados por telefone)
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null unique,
  created_at timestamptz not null default now()
);

-- Pedidos
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  code text unique,
  status text not null default 'NOVO' check (status in (
    'NOVO', 'CONFIRMADO', 'EM_PRODUCAO', 'PRONTO', 'ENTREGUE', 'CANCELADO'
  )),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  event_date date,
  event_time text,
  type text not null default 'RETIRADA' check (type in ('RETIRADA', 'ENTREGA')),
  address text,
  notes text,
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  source text not null default 'CART' check (source in ('CART', 'PARTY_PLANNER', 'CUSTOM_ORDER')),
  created_at timestamptz not null default now()
);

-- Itens de pedido
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null default 0,
  options jsonb not null default '{}'::jsonb,
  notes text
);

-- Encomendas personalizadas (formulário dedicado)
create table if not exists public.custom_orders (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  event_type text,
  event_date date,
  guests integer,
  theme text,
  colors text,
  sweet_type text,
  reference_url text,
  notes text,
  status text not null default 'NOVO' check (status in ('NOVO', 'EM_ATENDIMENTO', 'ORCADO', 'FECHADO', 'CANCELADO')),
  created_at timestamptz not null default now()
);

-- Configurações gerais (linha única)
create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  bakery_name text not null default 'Doce & Pedido',
  whatsapp_number text not null default '',
  instagram_handle text not null default '',
  address text not null default '',
  opening_hours text not null default 'Seg a Sáb, 9h às 18h',
  delivery_fee numeric(10,2) not null default 0,
  whatsapp_message text not null default 'Olá! Gostaria de fazer um pedido:',
  message_header text not null default '',
  seo_city text not null default '',
  logo_url text,
  updated_at timestamptz not null default now()
);

-- Avaliações/depoimentos
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  text text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Índices ----------
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_available on public.products(is_available);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_event_date on public.orders(event_date);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- ---------- Triggers ----------
-- Cria um profile automaticamente para cada novo usuário autenticado.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Administrador'),
    'admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Registra/atualiza o cliente a cada pedido (upsert por telefone).
create or replace function public.upsert_customer_from_order()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  insert into public.customers (name, phone)
  values (new.customer_name, new.customer_phone)
  on conflict (phone) do update set name = excluded.name
  returning id into v_customer_id;
  update public.orders set customer_id = v_customer_id where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_upsert_customer on public.orders;
create trigger trg_upsert_customer
  after insert on public.orders
  for each row execute function public.upsert_customer_from_order();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_orders enable row level security;
alter table public.settings enable row level security;
alter table public.reviews enable row level security;

-- Leitura pública: catálogo, avaliações aprovadas e configurações.
create policy "public read categories" on public.categories
  for select using (true);
create policy "public read products" on public.products
  for select using (true);
create policy "public read settings" on public.settings
  for select using (true);
create policy "public read approved reviews" on public.reviews
  for select using (is_approved = true);

-- Admin: acesso total quando autenticado.
create policy "admin all profiles" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin all categories" on public.categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all products" on public.products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all customers" on public.customers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all orders" on public.orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all order_items" on public.order_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all custom_orders" on public.custom_orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all settings" on public.settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all reviews" on public.reviews
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- Funções utilitárias ----------

-- Totais agregados por status (usada no dashboard admin).
create or replace function public.orders_count_by_status()
returns table (status text, count bigint)
language sql
security definer set search_path = public
as $$
  select status, count(*)::bigint
  from public.orders
  group by status;
$$;

revoke all on function public.orders_count_by_status() from public;
grant execute on function public.orders_count_by_status() to authenticated;

-- ---------- Seeds iniciais ----------
insert into public.categories (name, slug, description, display_order) values
  ('Bolos', 'bolos', 'Bolos artesanais para todas as ocasiões', 1),
  ('Brigadeiros', 'brigadeiros', 'Os clássicos em versão gourmet', 2),
  ('Doces gourmet', 'doces-gourmet', 'Docinhos especiais para eventos', 3),
  ('Kits', 'kits', 'Kits prontos para presentear', 4),
  ('Festa', 'festa', 'Tudo para a sua festa', 5),
  ('Personalizados', 'personalizados', 'Feitos sob medida para você', 6),
  ('Combos', 'combos', 'Combinações com preço especial', 7)
on conflict (slug) do nothing;

insert into public.settings (id) values (1) on conflict (id) do nothing;
