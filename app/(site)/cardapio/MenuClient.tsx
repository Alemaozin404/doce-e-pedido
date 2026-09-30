"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Category, Product } from "@/types";

export default function MenuClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(() => searchParams.get("cat") ?? "todos");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat =
        activeCat === "todos" ||
        categories.find((c) => c.id === p.category_id)?.slug === activeCat;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, categories, query, activeCat]);

  return (
    <div className="container-site py-10 sm:py-14">
      <header className="mb-8 text-center">
        <h1 className="font-display text-4xl text-chocolate-dark sm:text-5xl">Cardápio</h1>
        <p className="mx-auto mt-3 max-w-lg text-chocolate-light">
          Tudo feito sob encomenda, com ingredientes selecionados. Escolha e monte seu pedido.
        </p>
      </header>

      {/* Busca */}
      <div className="mx-auto mb-6 max-w-md">
        <label htmlFor="busca" className="sr-only">Buscar produtos</label>
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-chocolate-light">🔍</span>
          <input
            id="busca"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou ingrediente..."
            className="w-full rounded-full border border-chocolate/15 bg-white py-3 pl-11 pr-4 text-sm shadow-soft outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/40"
          />
        </div>
      </div>

      {/* Filtros por categoria */}
      <nav aria-label="Filtrar por categoria" className="mb-8 overflow-x-auto pb-2">
        <ul className="flex gap-2" style={{ width: "max-content" }}>
          {[{ slug: "todos", name: "Todos" }, ...categories].map((cat) => (
            <li key={cat.slug}>
              <button
                onClick={() => setActiveCat(cat.slug)}
                aria-pressed={activeCat === cat.slug}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCat === cat.slug
                    ? "bg-chocolate text-cream shadow-soft"
                    : "bg-white text-chocolate hover:bg-chocolate/5"
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Grade de produtos */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="🔍"
          title="Nenhum produto encontrado"
          description="Tente outro termo de busca ou escolha uma categoria diferente."
          action={
            <button
              onClick={() => {
                setQuery("");
                setActiveCat("todos");
              }}
              className="mt-1 rounded-full bg-chocolate px-5 py-2 text-sm font-medium text-cream transition hover:bg-chocolate-dark"
            >
              Limpar filtros
            </button>
          }
        />
      )}
    </div>
  );
}
