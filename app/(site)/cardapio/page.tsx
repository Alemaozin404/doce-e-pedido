import { Suspense } from "react";
import type { Metadata } from "next";
import MenuClient from "./MenuClient";
import LoadingCardapio from "./loading";
import { getCategories, getProducts } from "@/services/catalog";

export const metadata: Metadata = {
  title: "Cardápio",
  description: "Bolos, brigadeiros, doces gourmet, kits e personalizados feitos sob encomenda.",
  alternates: { canonical: "/cardapio" },
};

export default async function CardapioPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <Suspense fallback={<LoadingCardapio />}>
      <MenuClient products={products} categories={categories} />
    </Suspense>
  );
}
