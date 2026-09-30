"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { useSettings } from "@/components/SettingsContext";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/format";
import type { CartItem } from "@/types";

export default function CarrinhoPage() {
  const { items, totals, deliveryType, setDeliveryType, updateQuantity, removeItem, clearCart } = useCart();
  const settings = useSettings();
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<CartItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="container-site py-16">
        <h1 className="mb-8 text-center font-display text-4xl text-chocolate-dark">Seu carrinho</h1>
        <EmptyState
          emoji="🛒"
          title="Seu carrinho está vazio"
          description="Explore o cardápio e adicione seus doces favoritos."
          action={
            <Button href="/cardapio" variant="primary">Ver cardápio</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-chocolate-dark">Seu carrinho</h1>
        <button
          onClick={() => setConfirmClear(true)}
          className="text-sm text-red-600 underline-offset-4 hover:underline"
        >
          Limpar carrinho
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Lista de itens */}
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.product_id} className="flex gap-4 rounded-3xl bg-white p-4 shadow-soft">
              <Link href={`/produto/${item.product_id}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-cream-dark">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-3xl" aria-hidden="true">🍰</span>
                )}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/produto/${item.product_id}`} className="font-medium text-chocolate-dark hover:underline">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => setConfirmRemove(item)}
                    aria-label={`Remover ${item.name}`}
                    className="rounded-full p-1.5 text-chocolate-light transition hover:bg-red-50 hover:text-red-600"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                {item.options && Object.keys(item.options).length > 0 && (
                  <p className="mt-0.5 text-xs text-chocolate-light">
                    {Object.entries(item.options).map(([k, v]) => `${k}: ${v.join(", ")}`).join(" | ")}
                  </p>
                )}
                {item.desired_date && (
                  <p className="mt-0.5 text-xs text-chocolate-light">Data desejada: {item.desired_date}</p>
                )}
                {item.notes && <p className="mt-0.5 text-xs italic text-chocolate-light">“{item.notes}”</p>}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-chocolate/20">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      aria-label={`Diminuir ${item.name}`}
                      className="px-3 py-1 text-chocolate"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      aria-label={`Aumentar ${item.name}`}
                      className="px-3 py-1 text-chocolate"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-display text-lg text-chocolate-dark">
                    {formatPrice(item.unit_price * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Resumo */}
        <aside className="h-fit rounded-3xl bg-white p-6 shadow-card lg:sticky lg:top-24">
          <h2 className="font-display text-xl text-chocolate-dark">Resumo do pedido</h2>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold">Tipo de pedido</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["RETIRADA", "ENTREGA"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDeliveryType(t)}
                  aria-pressed={deliveryType === t}
                  className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
                    deliveryType === t
                      ? "border-chocolate bg-chocolate text-cream"
                      : "border-chocolate/20 text-chocolate hover:border-chocolate/50"
                  }`}
                >
                  {t === "RETIRADA" ? "Retirada" : "Entrega"}
                </button>
              ))}
            </div>
          </fieldset>

          <dl className="mt-5 space-y-2 border-t border-chocolate/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-chocolate-light">Subtotal</dt>
              <dd className="font-medium">{formatPrice(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-chocolate-light">Taxa de entrega</dt>
              <dd className="font-medium">
                {deliveryType === "ENTREGA" ? formatPrice(totals.deliveryFee) : "—"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-chocolate/10 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="font-display text-xl">{formatPrice(totals.total)}</dd>
            </div>
          </dl>

          <div className="mt-6 space-y-2">
            <Button href="/checkout" fullWidth size="lg">
              Finalizar pedido
            </Button>
            <Button href="/cardapio" variant="ghost" fullWidth>
              Continuar comprando
            </Button>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Limpar carrinho"
        message="Tem certeza que deseja remover todos os itens do carrinho?"
        confirmLabel="Limpar tudo"
        onConfirm={() => {
          clearCart();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={confirmRemove !== null}
        title="Remover item"
        message={`Remover "${confirmRemove?.name ?? ""}" do carrinho?`}
        confirmLabel="Remover"
        onConfirm={() => {
          if (confirmRemove) removeItem(confirmRemove.product_id);
          setConfirmRemove(null);
        }}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}
