/**
 * Clientes Supabase (browser e server).
 *
 * Os pacotes são importados dinamicamente para que o site funcione e
 * faça build mesmo sem as variáveis de ambiente (modo demonstração):
 * sem config, as funções retornam `null` e o catálogo usa dados demo.
 * A área administrativa exige Supabase configurado.
 */
import { ENV, isSupabaseConfigured } from "@/lib/config";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/** Cliente para uso no navegador (componentes client). Sempre `await`. */
export async function getSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  if (typeof window === "undefined") return null;
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    const { createBrowserClient } = await import("@supabase/ssr");
    browserClient = createBrowserClient(ENV.supabaseUrl, ENV.supabaseAnonKey);
  }
  return browserClient;
}

/**
 * Cliente para uso em Server Components / Route Handlers.
 * Não usa cookies: o site público só faz leitura com a anon key + RLS.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
