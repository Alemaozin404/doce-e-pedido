"use client";

/**
 * Carrinho de pedidos com persistência em localStorage.
 * As taxas e o número de WhatsApp vêm da configuração central (SettingsContext).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clampQuantity } from "@/lib/validation";
import type { CartItem, CartTotals } from "@/types";

interface CartContextValue {
  items: CartItem[];
  totals: CartTotals;
  deliveryType: "RETIRADA" | "ENTREGA";
  setDeliveryType: (t: "RETIRADA" | "ENTREGA") => void;
  count: number;
  addItem: (item: CartItem, unitPrice?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}

const STORAGE_KEY = "doceepedido.cart.v1";

interface PersistedCart {
  items: CartItem[];
  deliveryType: "RETIRADA" | "ENTREGA";
}

function load(): PersistedCart {
  if (typeof window === "undefined") return { items: [], deliveryType: "RETIRADA" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], deliveryType: "RETIRADA" };
    const parsed = JSON.parse(raw) as Partial<PersistedCart>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      deliveryType: parsed.deliveryType === "ENTREGA" ? "ENTREGA" : "RETIRADA",
    };
  } catch {
    return { items: [], deliveryType: "RETIRADA" };
  }
}

/**
 * `deliveryFee` vem do SettingsProvider (configuração central).
 */
export function CartProvider({
  children,
  deliveryFee,
}: {
  children: ReactNode;
  deliveryFee: number;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<"RETIRADA" | "ENTREGA">("RETIRADA");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persisted = load();
    setItems(persisted.items);
    setDeliveryType(persisted.deliveryType);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, deliveryType } satisfies PersistedCart)
    );
  }, [items, deliveryType, hydrated]);

  const addItem = useCallback((item: CartItem, unitPrice?: number) => {
    setItems((prev) => {
      const price = typeof unitPrice === "number" ? unitPrice : item.unit_price;
      const existing = prev.find((i) => i.product_id === item.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: clampQuantity(i.quantity + item.quantity) }
            : i
        );
      }
      return [...prev, { ...item, unit_price: price }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.product_id !== productId)
        : prev.map((i) => (i.product_id === productId ? { ...i, quantity: clampQuantity(quantity) } : i))
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totals = useMemo<CartTotals>(() => {
    const subtotal = items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
    const fee = deliveryType === "ENTREGA" ? deliveryFee : 0;
    return {
      subtotal,
      deliveryFee: fee,
      total: subtotal + fee,
    };
  }, [items, deliveryType, deliveryFee]);

  const count = useMemo(() => items.reduce((acc, i) => acc + i.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({ items, totals, deliveryType, setDeliveryType, count, addItem, updateQuantity, removeItem, clearCart }),
    [items, totals, deliveryType, count, addItem, updateQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
