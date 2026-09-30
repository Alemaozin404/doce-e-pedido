"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ProductCard from "@/components/product/ProductCard";
import { useCart } from "@/components/cart/CartContext";
import { useToast } from "@/components/ui/Toast";
import { formatPrice, todayISO } from "@/lib/format";
import { sanitizeText } from "@/lib/validation";
import type { Product } from "@/types";

export default function ProductDetailClient({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const gallery = useMemo(() => {
    const imgs = [product.image_url, ...(product.gallery ?? [])].filter(Boolean) as string[];
    return imgs.length > 0 ? Array.from(new Set(imgs)) : [];
  }, [product]);

  const [selectedImage, setSelectedImage] = useState<string | null>(gallery[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const opt of product.options ?? []) {
      if (opt.type === "single" && opt.values.length > 0) initial[opt.name] = [opt.values[0]];
    }
    return initial;
  });
  const [notes, setNotes] = useState("");
  const [desiredDate, setDesiredDate] = useState("");

  const unavailable = !product.is_available || product.stock === 0;
  const maxQty = product.stock ?? 99;

  function handleAdd() {
    addItem(
      {
        product_id: product.id,
        name: product.name,
        image_url: product.image_url,
        unit_price: product.price,
        quantity,
        options: Object.keys(selectedOptions).length > 0 ? selectedOptions : null,
        notes: notes.trim() ? sanitizeText(notes, 300) : null,
        desired_date: desiredDate || null,
      },
      product.price
    );
    showToast("Adicionado ao pedido 🧁");
  }

  return (
    <div className="container-site py-10 sm:py-14">
      <nav aria-label="Trilha de navegação" className="mb-6 text-sm text-chocolate-light">
        <Link href="/cardapio" className="hover:text-chocolate hover:underline">Cardápio</Link>
        <span aria-hidden="true" className="mx-2">/</span>
        <span className="text-chocolate">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Galeria */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream-dark shadow-card">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl" aria-hidden="true">🍰</div>
            )}
            {unavailable && (
              <span className="absolute left-4 top-4 rounded-full bg-chocolate/85 px-4 py-1.5 text-sm font-medium text-cream">
                Indisponível
              </span>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {gallery.map((img) => (
                <button
                  key={img}
                  onClick={() => setSelectedImage(img)}
                  aria-label={`Ver imagem ${gallery.indexOf(img) + 1} de ${product.name}`}
                  aria-pressed={selectedImage === img}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                    selectedImage === img ? "border-chocolate" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações e compra */}
        <div className="flex flex-col">
          <h1 className="font-display text-3xl text-chocolate-dark sm:text-4xl">{product.name}</h1>
          {product.description ? (
            <p className="mt-4 text-chocolate-light">{product.description}</p>
          ) : null}
          <p className="mt-5 font-display text-3xl text-chocolate-dark">{formatPrice(product.price)}</p>

          {/* Opções personalizáveis */}
          {product.options?.map((opt) => (
            <fieldset key={opt.name} className="mt-6">
              <legend className="mb-2 text-sm font-semibold text-chocolate">{opt.name}</legend>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((value) => {
                  const active = selectedOptions[opt.name]?.includes(value) ?? false;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setSelectedOptions((prev) => {
                          const current = prev[opt.name] ?? [];
                          if (opt.type === "single") return { ...prev, [opt.name]: [value] };
                          return {
                            ...prev,
                            [opt.name]: active
                              ? current.filter((v) => v !== value)
                              : [...current, value],
                          };
                        })
                      }
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? "border-chocolate bg-chocolate text-cream"
                          : "border-chocolate/20 bg-white text-chocolate hover:border-chocolate/50"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {/* Quantidade */}
          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-semibold text-chocolate">Quantidade</span>
            <div className="flex items-center rounded-full border border-chocolate/20 bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuir quantidade"
                className="px-4 py-2 text-lg text-chocolate transition disabled:opacity-30"
              >
                −
              </button>
              <span aria-live="polite" className="min-w-10 text-center font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                aria-label="Aumentar quantidade"
                className="px-4 py-2 text-lg text-chocolate transition disabled:opacity-30"
              >
                +
              </button>
            </div>
            {product.stock !== null && (
              <span className="text-xs text-chocolate-light">{product.stock} disponíveis</span>
            )}
          </div>

          {/* Data desejada */}
          <div className="mt-5">
            <label htmlFor="data-desejada" className="mb-2 block text-sm font-semibold text-chocolate">
              Data desejada
            </label>
            <input
              id="data-desejada"
              type="date"
              min={todayISO()}
              value={desiredDate}
              onChange={(e) => setDesiredDate(e.target.value)}
              className="w-full max-w-xs rounded-2xl border border-chocolate/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/40"
            />
          </div>

          {/* Observações */}
          <div className="mt-5">
            <label htmlFor="obs-produto" className="mb-2 block text-sm font-semibold text-chocolate">
              Observações
            </label>
            <textarea
              id="obs-produto"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Digite alguma preferência... (ex: escrita no bolo, cores)"
              className="w-full rounded-2xl border border-chocolate/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/40"
            />
          </div>

          <div className="mt-8">
            <Button size="lg" fullWidth onClick={handleAdd} disabled={unavailable}>
              {unavailable ? "Produto indisponível" : "Adicionar ao pedido"}
            </Button>
          </div>
        </div>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="relacionados">
          <h2 id="relacionados" className="mb-6 font-display text-2xl text-chocolate-dark sm:text-3xl">
            Você também vai amar
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
