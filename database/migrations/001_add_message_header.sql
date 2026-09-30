-- Migration: adiciona cabeçalho configurável das mensagens de WhatsApp.
-- Execute no SQL Editor do Supabase em projetos que já rodaram o schema.sql.

alter table public.settings
  add column if not exists message_header text not null default '';
