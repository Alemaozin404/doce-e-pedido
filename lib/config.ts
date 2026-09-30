/**
 * Configuração central do site.
 *
 * Prioridade dos valores:
 * 1. Supabase (tabela `settings`, editável pela área administrativa)
 * 2. Variáveis de ambiente (.env.local)
 * 3. Fallback padrão
 *
 * O número de WhatsApp NUNCA deve ficar espalhado pelo código:
 * use sempre `getConfig().whatsappNumber` ou os services de WhatsApp.
 */
import type { Settings } from "@/types";

export const ENV = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM ?? "",
  city: process.env.NEXT_PUBLIC_CITY ?? "",
};

export function isSupabaseConfigured(): boolean {
  return Boolean(ENV.supabaseUrl && ENV.supabaseAnonKey);
}

/** Configuração padrão usada quando não há Supabase configurado. */
export const DEFAULT_SETTINGS: Settings = {
  bakery_name: "Doce & Pedido",
  whatsapp_number: ENV.whatsappNumber,
  instagram_handle: ENV.instagram,
  address: "",
  opening_hours: "Seg a Sáb, 9h às 18h",
  delivery_fee: 0,
  whatsapp_message: "Olá! Gostaria de fazer um pedido:",
  message_header: "",
  seo_city: ENV.city,
  logo_url: null,
};

/**
 * Mescla uma linha da tabela `settings` com os defaults,
 * mantendo valores do env quando o banco está vazio.
 */
export function mergeSettings(row: Partial<Settings> | null): Settings {
  return {
    bakery_name: row?.bakery_name?.trim() || DEFAULT_SETTINGS.bakery_name,
    whatsapp_number: row?.whatsapp_number?.trim() || DEFAULT_SETTINGS.whatsapp_number,
    instagram_handle: row?.instagram_handle?.trim() || DEFAULT_SETTINGS.instagram_handle,
    address: row?.address ?? "",
    opening_hours: row?.opening_hours?.trim() || DEFAULT_SETTINGS.opening_hours,
    delivery_fee: typeof row?.delivery_fee === "number" ? row.delivery_fee : DEFAULT_SETTINGS.delivery_fee,
    whatsapp_message: row?.whatsapp_message?.trim() || DEFAULT_SETTINGS.whatsapp_message,
    message_header: row?.message_header?.trim() || "",
    seo_city: row?.seo_city ?? DEFAULT_SETTINGS.seo_city,
    logo_url: row?.logo_url ?? null,
  };
}
