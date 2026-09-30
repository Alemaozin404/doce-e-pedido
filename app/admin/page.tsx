"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { formatPrice, formatDate } from "@/lib/format";
import type { OrderData } from "@/types";

interface DashboardData {
  orders: OrderData[];
  topProducts: { name: string; qty: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: "Novos",
  CONFIRMADO: "Confirmados",
  EM_PRODUCAO: "Em produção",
  PRONTO: "Prontos",
  ENTREGUE: "Entregues",
  CANCELADO: "Cancelados",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = await getSupabaseBrowserClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        console.error("[admin] erro ao carregar pedidos:", error.message);
        setLoading(false);
        return;
      }
      const orders = (ordersData ?? []) as unknown as OrderData[];
      const counts = new Map<string, number>();
      for (const order of orders) {
        for (const item of order.items ?? []) {
          counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity);
        }
      }
      const topProducts = [...counts.entries()]
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
      setData({ orders, topProducts });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        emoji="🔌"
        title="Supabase não configurado"
        description="A área administrativa precisa do Supabase. Siga o README para configurar .env.local e o schema.sql."
      />
    );
  }

  const orders = data?.orders ?? [];
  const pending = orders.filter((o) => ["NOVO", "CONFIRMADO", "EM_PRODUCAO"].includes(o.status));
  const revenue = orders
    .filter((o) => o.status !== "CANCELADO")
    .reduce((acc, o) => acc + Number(o.total), 0);
  const monthRevenue = orders
    .filter((o) => {
      const d = new Date(o.created_at);
      const now = new Date();
      return o.status !== "CANCELADO" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc, o) => acc + Number(o.total), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-chocolate-dark">Dashboard</h1>
        <p className="mt-1 text-sm text-chocolate-light">Visão geral da confeitaria.</p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard emoji="🧾" label="Pedidos totais" value={String(orders.length)} />
        <MetricCard emoji="⏳" label="Pedidos pendentes" value={String(pending.length)} hint="Novos + confirmados + produção" />
        <MetricCard emoji="💰" label="Faturamento total" value={formatPrice(revenue)} />
        <MetricCard emoji="📅" label="Faturamento do mês" value={formatPrice(monthRevenue)} />
      </div>

      {/* Status */}
      <section aria-labelledby="por-status">
        <h2 id="por-status" className="mb-3 font-display text-xl text-chocolate-dark">Pedidos por status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(STATUS_LABELS).map(([status, label]) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <Link
                key={status}
                href={`/admin/pedidos?status=${status}`}
                className="rounded-2xl bg-white p-4 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <p className="font-display text-2xl text-chocolate-dark">{count}</p>
                <p className="mt-1 text-xs text-chocolate-light">{label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mais vendidos */}
        <section aria-labelledby="mais-vendidos" className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 id="mais-vendidos" className="font-display text-xl text-chocolate-dark">Produtos mais vendidos</h2>
          {data?.topProducts.length ? (
            <ol className="mt-4 space-y-3">
              {data.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-soft font-semibold text-chocolate-dark">
                    {i + 1}
                  </span>
                  <span className="flex-1">{p.name}</span>
                  <span className="font-medium text-chocolate-light">{p.qty} un.</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-chocolate-light">Ainda sem vendas registradas.</p>
          )}
        </section>

        {/* Últimos pedidos */}
        <section aria-labelledby="ultimos-pedidos" className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 id="ultimos-pedidos" className="font-display text-xl text-chocolate-dark">Últimos pedidos</h2>
          {orders.length ? (
            <ul className="mt-4 space-y-3">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs text-chocolate-light">
                      {o.event_date ? formatDate(o.event_date) : "sem data"} · {STATUS_LABELS[o.status] ?? o.status}
                    </p>
                  </div>
                  <span className="font-display text-chocolate-dark">{formatPrice(Number(o.total))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-chocolate-light">Nenhum pedido ainda.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  emoji,
  label,
  value,
  hint,
}: {
  emoji: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <span aria-hidden="true" className="text-2xl">{emoji}</span>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-chocolate-light">{label}</p>
      <p className="mt-1 font-display text-2xl text-chocolate-dark">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-chocolate-light">{hint}</p>}
    </div>
  );
}
