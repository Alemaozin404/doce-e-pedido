"use client";

import { useEffect, useMemo, useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import type { OrderData } from "@/types";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminCalendarioPage() {
  const [orders, setOrders] = useState<OrderData[] | null>(null);
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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
        .order("event_date", { ascending: true })
        .limit(300);
      if (error) console.error(error.message);
      setOrders((data ?? []) as unknown as OrderData[]);
    })();
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, OrderData[]>();
    for (const o of orders ?? []) {
      if (!o.event_date || o.status === "CANCELADO") continue;
      const key = o.event_date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(o);
      map.set(key, list);
    }
    return map;
  }, [orders]);

  const cells = useMemo(() => {
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (string | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(toISODate(new Date(year, month, d)));
    return result;
  }, [current]);

  const todayKey = toISODate(new Date());
  const dayOrders = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  if (orders === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-chocolate-dark">Calendário de encomendas</h1>
        <p className="mt-1 text-sm text-chocolate-light">Pedidos por data de entrega/retirada.</p>
      </div>

      {!isSupabaseConfigured() && (
        <p className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-800">Conecte o Supabase para ver os pedidos reais.</p>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-soft sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            className="rounded-full px-3 py-1.5 text-sm hover:bg-cream-dark"
            aria-label="Mês anterior"
          >
            ←
          </button>
          <h2 className="font-display text-xl text-chocolate-dark">
            {MONTHS[current.getMonth()]} de {current.getFullYear()}
          </h2>
          <button
            onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            className="rounded-full px-3 py-1.5 text-sm hover:bg-cream-dark"
            aria-label="Próximo mês"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-chocolate-light">
          {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (iso === null) return <div key={`empty-${i}`} />;
            const dayOrdersList = byDay.get(iso) ?? [];
            const isToday = iso === todayKey;
            return (
              <button
                key={iso}
                onClick={() => dayOrdersList.length > 0 && setSelectedDay(iso)}
                disabled={dayOrdersList.length === 0}
                aria-label={`${iso}: ${dayOrdersList.length} encomendas`}
                className={`relative aspect-square rounded-xl text-sm transition sm:aspect-auto sm:min-h-14 ${
                  dayOrdersList.length > 0
                    ? "bg-rose-soft font-semibold text-chocolate-dark hover:shadow-soft"
                    : "text-chocolate-light hover:bg-cream-dark/60"
                } ${isToday ? "ring-2 ring-chocolate" : ""}`}
              >
                <span className="absolute left-1.5 top-1 text-[11px] opacity-70">{Number(iso.slice(-2))}</span>
                {dayOrdersList.length > 0 && (
                  <span className="flex h-full items-center justify-center pt-2 text-xs sm:text-sm">
                    {dayOrdersList.length === 1 ? "1 pedido" : `${dayOrdersList.length} pedidos`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalhes do dia */}
      {selectedDay && (
        <section aria-labelledby="dia-detalhe" className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 id="dia-detalhe" className="font-display text-xl text-chocolate-dark">
            Encomendas de {selectedDay.slice(8, 10)}/{selectedDay.slice(5, 7)}/{selectedDay.slice(0, 4)}
          </h2>
          {dayOrders.length === 0 ? (
            <EmptyState emoji="📭" title="Nenhuma encomenda neste dia" />
          ) : (
            <ul className="mt-4 space-y-3">
              {dayOrders.map((o) => (
                <li key={o.id} className="rounded-2xl border border-chocolate/10 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{o.customer_name} {o.event_time ? `· ${o.event_time}` : ""}</p>
                    <span className="font-display">{formatPrice(Number(o.total))}</span>
                  </div>
                  <p className="mt-1 text-xs text-chocolate-light">
                    {(o.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
