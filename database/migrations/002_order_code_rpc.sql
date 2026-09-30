-- ==============================================================
-- Migration 002: numeração amigável de pedidos + inserção pública
-- Execute no SQL Editor do Supabase.
-- ==============================================================

-- ---------- 1. Numeração amigável: ORD-YYYYMMDD-0001 ----------
create sequence if not exists public.order_code_seq start 1;

create or replace function public.generate_order_code()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_num bigint;
  v_seq_val bigint;
begin
  -- nextval consome um número;.currval não é confiável entre sessões.
  select nextval('public.order_code_seq') into v_seq_val;
  v_num := v_seq_val;
  return 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(v_num::text, 4, '0');
end;
$$;

revoke all on function public.generate_order_code() from public;
grant execute on function public.generate_order_code() to anon, authenticated;

-- ---------- 2. Insert público de pedidos (visitantes do site) ----------
-- O site público usa a anon key: sem estas políticas, nenhum pedido
-- feito pelo checkout chegaria ao banco.
create policy "public insert orders"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

create policy "public insert order_items"
  on public.order_items
  for insert
  to anon, authenticated
  with check (true);

-- Encomendas personalizadas: insert público, resto só admin.
create policy "public insert custom_orders"
  on public.custom_orders
  for insert
  to anon, authenticated
  with check (true);

-- A RPC roda como security definer e não lê tabelas.
grant execute on function public.generate_order_code() to anon;
