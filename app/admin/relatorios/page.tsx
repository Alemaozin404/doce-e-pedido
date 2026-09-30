"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderData } from "@/types";

type Range = 30 | 90 | 365;

interface MonthlyPoint {
  key: string; // YYYY-MM
  label: string;
  revenue: number;
  count: number;
}

const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function AdminRelatoriosPage() {
  const [orders, setOrders] = useState<OrderData[] | null>(null);
  const [range, setRange] = useState<Range>(90);

  useEffect(() => {
    (async () => {
      const supabase = await getSupabaseBrowserClient();
      if (!supabase) {
        setOrders([]);
        return;
      }
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) console.error(error.message);
      setOrders((data ?? []) as unknown as OrderData[]);
    })();
  }, []);

  /** Pedidos válidos dentro do período selecionado. */
  const scoped = useMemo(() => {
    if (!orders) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    return orders.filter((o) => o.status !== "CANCELADO" && new Date(o.created_at) >= cutoff);
  }, [orders, range]);

  const kpis = useMemo(() => {
    const revenue = scoped.reduce((acc, o) => acc + Number(o.total), 0);
    const delivered = scoped.filter((o) => o.status === "ENTREGUE");
    const ticket = scoped.length > 0 ? revenue / scoped.length : 0;
    return { revenue, count: scoped.length, ticket, deliveredRate: scoped.length > 0 ? delivered.length / scoped.length : 0 };
  }, [scoped]);

  /** Faturamento por mês (últimos 6 meses, independente do filtro). */
  const monthly = useMemo<MonthlyPoint[]>(() => {
    if (!orders) return [];
    const map = new Map<string, MonthlyPoint>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, { key, label: MONTH_SHORT[d.getMonth()], revenue: 0, count: 0 });
    }
    for (const o of orders) {
      if (o.status === "CANCELADO") continue;
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const point = map.get(key);
      if (point) {
        point.revenue += Number(o.total);
        point.count += 1;
      }
    }
    return [...map.values()];
  }, [orders]);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of scoped) {
      map.set(o.source, (map.get(o.source) ?? 0) + 1);
    }
    return map;
  }, [scoped]);

  const topProducts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of scoped) {
      for (const item of o.items ?? []) {
        counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity);
      }
    }
    return [...counts.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [scoped]);

  const upcoming = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return scoped
      .filter((o) => o.event_date && o.event_date >= todayKey && ["NOVO", "CONFIRMADO", "EM_PRODUCAO", "PRONTO"].includes(o.status))
      .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""))
      .slice(0, 8);
  }, [scoped]);

  if (orders === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1);
  const SOURCE_LABELS: Record<string, string> = {
    CART: "Cardápio",
    PARTY_PLANNER: "Monte sua Festa",
    CUSTOM_ORDER: "Personalizado",
  };

  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        emoji="📊"
        title="Supabase não configurado"
        description="Os relatórios precisam do Supabase com pedidos salvos no banco."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-chocolate-dark">Relatórios</h1>
          <p className="mt-1 text-sm text-chocolate-light">Desempenho da loja e agenda de entregas.</p>
        </div>
        <div className="flex gap-2">
          {([30, 90, 365] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                range === r ? "bg-chocolate text-cream" : "bg-white text-chocolate hover:bg-chocolate/5"
              }`}
            >
              {r === 30 ? "30 dias" : r === 90 ? "90 dias" : "1 ano"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Faturamento" value={formatPrice(kpis.revenue)} hint={`Últimos ${range === 365 ? "365" : range} dias`} />
        <KpiCard label="Pedidos" value={String(kpis.count)} hint="excluindo cancelados" />
        <KpiCard label="Ticket médio" value={formatPrice(kpis.ticket)} />
        <KpiCard label="Entregues" value={`${Math.round(kpis.deliveredRate * 100)}%`} hint="dos pedidos do período" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Faturamento mensal */}
        <section aria-labelledby="rel-mensal" className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 id="rel-mensal" className="font-display text-xl text-chocolate-dark">Faturamento mensal</h2>
          <p className="text-xs text-chocolate-light">Últimos 6 meses</p>
          <div className="mt-6 flex h-44 items-end gap-3">
            {monthly.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-medium text-chocolate">
                  {m.revenue > 0 ? formatPrice(m.revenue).replace(",00", "") : "—"}
                </span>
                <div
                  className="w-full rounded-t-xl bg-rose transition-all"
                  style={{ height: `${Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 6 : 2)}%` }}
                  title={`${m.count} pedido(s) — ${formatPrice(m.revenue)}`}
                />
                <span className="text-xs text-chocolate-light">{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Origem dos pedidos */}
        <section aria-labelledby="rel-origem" className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 id="rel-origem" className="font-display text-xl text-chocolate-dark">Origem dos pedidos</h2>
          <p className="text-xs text-chocolate-light">De onde vêm as vendas no período</p>
          <ul className="mt-5 space-y-3">
            {Object.entries(SOURCE_LABELS).map(([source, label]) => {
              const count = bySource.get(source) ?? 0;
              const pct = kpis.count > 0 ? Math.round((count / kpis.count) * 100) : 0;
              return (
                <li key={source}>
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-chocolate-light">
                      {count} pedido{count === 1 ? "" : "s"} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-cream-dark">
                    <div className="h-full rounded-full bg-chocolate" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mais vendidos */}
        <section aria-labelledby="rel-vendidos" className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 id="rel-vendidos" className="font-display text-xl text-chocolate-dark">Mais vendidos no período</h2>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-chocolate-light">Sem vendas no período.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-soft font-semibold text-chocolate-dark">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="font-medium text-chocolate-light">{p.qty} un.</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Próximas entregas */}
        <section aria-labelledby="rel-agenda" className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 id="rel-agenda" className="font-display text-xl text-chocolate-dark">Próximas entregas</h2>
          {upcoming.length === 0 ? (
            <p className="mt-4 text-sm text-chocolate-light">Nenhuma entrega futura no período.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.customer_name}</p>
                    <p className="text-xs text-chocolate-light">
                      {o.event_date ? formatDate(o.event_date) : ""}
                      {o.event_time ? ` ${o.event_time}` : ""}
                    </p>
                  </div>
                  <span className="font-display text-chocolate-dark">{formatPrice(Number(o.total))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-chocolate-light">{label}</p>
      <p className="mt-1 font-display text-2xl text-chocolate-dark">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-chocolate-light">{hint}</p>}
    </div>
  );
}
