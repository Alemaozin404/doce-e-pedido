"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import type { OrderData, OrderStatus } from "@/types";

const STATUS_FLOW: OrderStatus[] = ["NOVO", "CONFIRMADO", "EM_PRODUCAO", "PRONTO", "ENTREGUE", "CANCELADO"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  NOVO: "Novo",
  CONFIRMADO: "Confirmado",
  EM_PRODUCAO: "Em produção",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  NOVO: "bg-amber-50 text-amber-700",
  CONFIRMADO: "bg-blue-50 text-blue-700",
  EM_PRODUCAO: "bg-purple-50 text-purple-700",
  PRONTO: "bg-emerald-50 text-emerald-700",
  ENTREGUE: "bg-gray-100 text-gray-600",
  CANCELADO: "bg-red-50 text-red-600",
};

export default function PedidosClient() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderData[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "TODOS">(
    () => (searchParams.get("status") as OrderStatus) ?? "TODOS"
  );
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      setOrders([]);
      return;
    }
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) {
      console.error("[admin] erro ao carregar pedidos:", error.message);
      setOrders([]);
      return;
    }
    setOrders((data ?? []) as unknown as OrderData[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(order: OrderData, status: OrderStatus) {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (error) {
      showToast("Erro ao atualizar status.", "error");
      return;
    }
    showToast(`Pedido marcado como ${STATUS_LABELS[status].toLowerCase()}.`);
    load();
  }

  const filtered = useMemo(() => {
    if (!orders) return [];
    let list = statusFilter === "TODOS" ? orders : orders.filter((o) => o.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q.replace(/\D/g, "")) ||
          (o.code ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, statusFilter, query]);

  if (orders === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-chocolate-dark">Pedidos</h1>
        <p className="mt-1 text-sm text-chocolate-light">Acompanhe e atualize o status de cada encomenda.</p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por cliente, telefone ou código (ORD-...)..."
        aria-label="Buscar pedidos"
        className="w-full max-w-sm rounded-full border border-chocolate/15 bg-white px-5 py-3 text-sm shadow-soft outline-none focus:border-rose focus:ring-2 focus:ring-rose/40"
      />

      {!isSupabaseConfigured() && (
        <p className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-800">
          Conecte o Supabase para receber pedidos reais. Sem ele, os pedidos seguem apenas pelo WhatsApp.
        </p>
      )}

      {/* Filtro por status */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("TODOS")}
          aria-pressed={statusFilter === "TODOS"}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            statusFilter === "TODOS" ? "bg-chocolate text-cream" : "bg-white text-chocolate hover:bg-chocolate/5"
          }`}
        >
          Todos
        </button>
        {STATUS_FLOW.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            aria-pressed={statusFilter === status}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              statusFilter === status ? "bg-chocolate text-cream" : "bg-white text-chocolate hover:bg-chocolate/5"
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="🧾"
          title="Nenhum pedido aqui"
          description="Os pedidos enviados pelo site são salvos no banco e aparecem nesta lista (com Supabase configurado)."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((order) => (
            <li key={order.id} className="rounded-3xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-chocolate-dark">
                    {order.code && <span className="mr-2 font-mono text-xs text-chocolate-light">{order.code}</span>}
                    {order.customer_name} · {formatPhone(order.customer_phone)}
                  </p>
                  <p className="mt-0.5 text-xs text-chocolate-light">
                    {order.event_date ? `Entrega: ${formatDate(order.event_date)} ${order.event_time ?? ""}` : "Sem data"} ·{" "}
                    {order.type === "ENTREGA" ? `Entrega — ${order.address ?? ""}` : "Retirada"} ·{" "}
                    {order.source === "CART" ? "Cardápio" : order.source === "PARTY_PLANNER" ? "Festa" : "Personalizado"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className="font-display text-lg text-chocolate-dark">{formatPrice(Number(order.total))}</span>
                </div>
              </div>

              {/* Itens */}
              <ul className="mt-3 space-y-1 border-t border-chocolate/10 pt-3 text-sm text-chocolate-light">
                {(order.items ?? []).map((item, idx) => (
                  <li key={idx}>
                    {item.quantity}× {item.name}
                    {item.options && Object.keys(item.options).length > 0
                      ? ` — ${Object.entries(item.options).map(([k, v]) => `${k}: ${v.join(", ")}`).join(" | ")}`
                      : ""}
                  </li>
                ))}
              </ul>
              {order.notes && <p className="mt-2 text-xs italic text-chocolate-light">Obs: {order.notes}</p>}

              {/* Alterar status */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {STATUS_FLOW.filter((s) => s !== order.status).map((status) => (
                  <button
                    key={status}
                    onClick={() => changeStatus(order, status)}
                    className="rounded-full border border-chocolate/15 px-3 py-1 text-xs text-chocolate-light transition hover:border-chocolate hover:text-chocolate"
                  >
                    → {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
