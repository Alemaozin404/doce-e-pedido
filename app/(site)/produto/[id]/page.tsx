import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import { getProductById, getProducts } from "@/services/catalog";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.description ?? undefined,
    alternates: { canonical: `/produto/${product.id}` },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const [product, all] = await Promise.all([getProductById(params.id), getProducts()]);
  if (!product) notFound();

  const related = all.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 4);

  return <ProductDetailClient product={product} related={related} />;
}
