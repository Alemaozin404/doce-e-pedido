"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const unavailable = !product.is_available || product.stock === 0;

  function handleAdd() {
    addItem(
      {
        product_id: product.id,
        name: product.name,
        image_url: product.image_url,
        unit_price: product.price,
        quantity: 1,
        options: null,
        notes: null,
        desired_date: null,
      },
      product.price * 1
    );
    showToast("Adicionado ao pedido 🧁");
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link
        href={`/produto/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-cream-dark"
        aria-label={`Ver detalhes de ${product.name}`}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">
            🍰
          </div>
        )}
        {unavailable && (
          <span className="absolute left-3 top-3 rounded-full bg-chocolate/80 px-3 py-1 text-xs font-medium text-cream">
            Indisponível
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="heading-display text-lg leading-snug">
          <Link href={`/produto/${product.id}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.description ? (
          <p className="line-clamp-2 text-sm text-chocolate-light">{product.description}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="font-display text-xl text-chocolate-dark">
            {formatPrice(product.price)}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAdd}
            disabled={unavailable}
            aria-label={`Adicionar ${product.name} ao pedido`}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </article>
  );
}
