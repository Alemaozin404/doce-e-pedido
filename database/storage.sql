-- ==============================================================
-- DOCE & PEDIDO — Storage de imagens (Supabase Storage)
-- Execute DEPOIS do schema.sql no SQL Editor.
-- ==============================================================

-- Bucket público para imagens do site
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Leitura pública
create policy "public read media" on storage.objects
  for select using (bucket_id = 'media');

-- Upload/edição apenas para usuários autenticados (admin)
create policy "admin write media" on storage.objects
  for all using (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
  ) with check (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
  );
