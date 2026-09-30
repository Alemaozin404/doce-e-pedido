"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import type { CustomerRecord, OrderData } from "@/types";

export default function AdminClientesPage() {
  const [rows, setRows] = useState<CustomerRecord[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = await getSupabaseBrowserClient();
      if (!supabase) {
        setRows([]);
        return;
      }
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, customer_phone, total, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) {
        console.error(error.message);
        setRows([]);
        return;
      }
      const orders = (data ?? []) as Pick<OrderData, "id" | "customer_name" | "customer_phone" | "total" | "created_at">[];
      const map = new Map<string, CustomerRecord>();
      for (const o of orders) {
        const key = o.customer_phone;
        const existing = map.get(key);
        if (existing) {
          existing.orders_count += 1;
          existing.total_spent += Number(o.total);
          if (!existing.last_order_at || o.created_at > existing.last_order_at) {
            existing.last_order_at = o.created_at;
          }
        } else {
          map.set(key, {
            id: key,
            name: o.customer_name,
            phone: o.customer_phone,
            created_at: o.created_at,
            orders_count: 1,
            total_spent: Number(o.total),
            last_order_at: o.created_at,
          });
        }
      }
      setRows([...map.values()].sort((a, b) => b.total_spent - a.total_spent));
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.phone.includes(q.replace(/\D/g, ""))
    );
  }, [rows, query]);

  if (rows === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-3xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-chocolate-dark">Clientes</h1>
        <p className="mt-1 text-sm text-chocolate-light">
          Cadastro automático criado a partir dos pedidos recebidos.
        </p>
      </div>

      {!isSupabaseConfigured() && (
        <p className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-800">Conecte o Supabase para ver clientes reais.</p>
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nome ou telefone..."
        aria-label="Buscar clientes"
        className="w-full max-w-sm rounded-full border border-chocolate/15 bg-white px-5 py-3 text-sm shadow-soft outline-none focus:border-rose focus:ring-2 focus:ring-rose/40"
      />

      {filtered.length === 0 ? (
        <EmptyState emoji="👩" title="Nenhum cliente ainda" description="Os clientes aparecem automaticamente após o primeiro pedido salvo no banco." />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-soft">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-chocolate/10 text-xs uppercase tracking-wide text-chocolate-light">
                <th scope="col" className="px-5 py-3.5">Nome</th>
                <th scope="col" className="px-5 py-3.5">Telefone</th>
                <th scope="col" className="px-5 py-3.5 text-right">Pedidos</th>
                <th scope="col" className="px-5 py-3.5 text-right">Total gasto</th>
                <th scope="col" className="px-5 py-3.5">Último pedido</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-chocolate/5 last:border-0">
                  <td className="px-5 py-3.5 font-medium text-chocolate-dark">{c.name}</td>
                  <td className="px-5 py-3.5">{formatPhone(c.phone)}</td>
                  <td className="px-5 py-3.5 text-right">{c.orders_count}</td>
                  <td className="px-5 py-3.5 text-right font-medium">{formatPrice(c.total_spent)}</td>
                  <td className="px-5 py-3.5 text-chocolate-light">{c.last_order_at ? formatDate(c.last_order_at.slice(0, 10)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
