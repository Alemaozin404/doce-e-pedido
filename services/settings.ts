/**
 * Service de configurações do site.
 * Lê a tabela `settings` no Supabase; sem Supabase, usa os defaults do env.
 */
import { getSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseConfigured, mergeSettings, DEFAULT_SETTINGS } from "@/lib/config";
import type { Settings } from "@/types";

export async function getSettings(): Promise<Settings> {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return DEFAULT_SETTINGS;
  const { data, error } = await supabase.from("settings").select("*").limit(1).maybeSingle();
  if (error) {
    console.error("[settings] erro ao carregar configurações:", error.message);
    return DEFAULT_SETTINGS;
  }
  return mergeSettings(data as Partial<Settings> | null);
}
