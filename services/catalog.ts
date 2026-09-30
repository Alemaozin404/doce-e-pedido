/**
 * Service de catálogo (categorias, produtos e avaliações).
 * Com Supabase configurado, lê do banco; sem Supabase, usa os dados demo.
 */
import { getSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { DEMO_CATEGORIES, DEMO_PRODUCTS, DEMO_REVIEWS } from "@/data/demo";
import type { Category, Product, Review } from "@/types";

export async function getCategories(): Promise<Category[]> {
  const fallback = DEMO_CATEGORIES.filter((c) => c.is_active);
  if (!isSupabaseConfigured()) return fallback;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return fallback;
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("[catalog] erro ao carregar categorias:", error.message);
    return fallback;
  }
  if (!data || data.length === 0) return fallback;
  return data as Category[];
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return DEMO_PRODUCTS;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return DEMO_PRODUCTS;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) {
    console.error("[catalog] erro ao carregar produtos:", error.message);
    return DEMO_PRODUCTS;
  }
  return (data ?? []) as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) ?? null;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.is_featured && p.is_available);
}

export async function getReviews(): Promise<Review[]> {
  const fallback = DEMO_REVIEWS.filter((r) => r.is_approved);
  if (!isSupabaseConfigured()) return fallback;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return fallback;
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[catalog] erro ao carregar avaliações:", error.message);
    return fallback;
  }
  return (data ?? []) as Review[];
}
