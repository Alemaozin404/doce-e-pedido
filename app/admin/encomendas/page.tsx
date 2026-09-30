"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { formatDate } from "@/lib/format";
import type { CustomOrderRecord } from "@/types";

const STATUS_FLOW = ["NOVO", "EM_ATENDIMENTO", "ORCADO", "FECHADO", "CANCELADO"] as const;
type EncomendaStatus = (typeof STATUS_FLOW)[number];

const STATUS_LABELS: Record<EncomendaStatus, string> = {
  NOVO: "Novo",
  EM_ATENDIMENTO: "Em atendimento",
  ORCADO: "Orçado",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
};

function statusClass(status: string): string {
  switch (status) {
    case "NOVO":
      return "bg-amber-50 text-amber-700";
    case "EM_ATENDIMENTO":
      return "bg-blue-50 text-blue-700";
    case "ORCADO":
      return "bg-purple-50 text-purple-700";
    case "FECHADO":
      return "bg-emerald-50 text-emerald-700";
    case "CANCELADO":
      return "bg-red-50 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

const chipClass = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${
    active ? "bg-chocolate text-cream" : "bg-white text-chocolate hover:bg-chocolate/5"
  }`;

export default function AdminEncomendasPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<CustomOrderRecord[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<EncomendaStatus | "TODOS">("TODOS");
  const [deleting, setDeleting] = useState<CustomOrderRecord | null>(null);

  const load = useCallback(async () => {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      setRows([]);
      return;
    }
    const { data, error } = await supabase
      .from("custom_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) console.error(error.message);
    setRows((data ?? []) as unknown as CustomOrderRecord[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(row: CustomOrderRecord, status: EncomendaStatus) {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase
      .from("custom_orders")
      .update({ status })
      .eq("id", row.id);
    if (error) {
      showToast("Erro ao atualizar status.", "error");
      return;
    }
    showToast(`Encomenda marcada como ${STATUS_LABELS[status].toLowerCase()}.`);
    load();
  }

  async function handleDelete() {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase || !deleting) return;
    const { error } = await supabase.from("custom_orders").delete().eq("id", deleting.id);
    if (error) showToast("Erro ao excluir.", "error");
    else showToast("Encomenda excluída.");
    setDeleting(null);
    load();
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    return statusFilter === "TODOS" ? rows : rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  if (rows === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
    );
  }

  const counts = {
    NOVO: rows.filter((r) => r.status === "NOVO").length,
    EM_ATENDIMENTO: rows.filter((r) => r.status === "EM_ATENDIMENTO").length,
    ORCADO: rows.filter((r) => r.status === "ORCADO").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-chocolate-dark">Encomendas personalizadas</h1>
        <p className="mt-1 text-sm text-chocolate-light">
          Solicitações enviadas pelo formulário do site, com pipeline próprio de atendimento.
        </p>
      </div>

      {!isSupabaseConfigured() && (
        <p className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-800">
          Conecte o Supabase para receber solicitações reais.
        </p>
      )}

      {/* Contadores rápidos */}
      <div className="grid max-w-md grid-cols-3 gap-3">
        {(
          [
            ["NOVO", "Novas"],
            ["EM_ATENDIMENTO", "Em atendimento"],
            ["ORCADO", "Orçadas"],
          ] as const
        ).map(([status, label]) => (
          <div key={status} className="rounded-2xl bg-white p-4 text-center shadow-soft">
            <p className="font-display text-2xl text-chocolate-dark">{counts[status]}</p>
            <p className="mt-0.5 text-xs text-chocolate-light">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtro por status */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("TODOS")}
          aria-pressed={statusFilter === "TODOS"}
          className={chipClass(statusFilter === "TODOS")}
        >
          Todos
        </button>
        {STATUS_FLOW.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            aria-pressed={statusFilter === status}
            className={chipClass(statusFilter === status)}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="Nenhuma solicitação aqui"
          description="As encomendas do formulário de personalizados aparecem nesta lista."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((row) => (
            <li key={row.id} className="rounded-3xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-chocolate-dark">{row.name}</p>
                  <p className="mt-0.5 text-xs text-chocolate-light">
                    {row.event_type ?? "Evento não informado"}
                    {row.event_date ? ` · ${formatDate(row.event_date.slice(0, 10))}` : ""}
                    {row.guests ? ` · ${row.guests} convidados` : ""}
                    {" · "}
                    {formatDate(row.created_at.slice(0, 10))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(row.status)}`}>
                    {STATUS_LABELS[row.status as EncomendaStatus] ?? row.status}
                  </span>
                  <Button size="sm" variant="danger" onClick={() => setDeleting(row)}>
                    Excluir
                  </Button>
                </div>
              </div>

              {/* Detalhes */}
              <dl className="mt-3 grid gap-x-6 gap-y-1 border-t border-chocolate/10 pt-3 text-sm sm:grid-cols-2">
                {row.theme && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-chocolate-light">Tema:</dt>
                    <dd>{row.theme}</dd>
                  </div>
                )}
                {row.colors && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-chocolate-light">Cores:</dt>
                    <dd>{row.colors}</dd>
                  </div>
                )}
                {row.sweet_type && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-chocolate-light">Doce:</dt>
                    <dd>{row.sweet_type}</dd>
                  </div>
                )}
                {row.reference_url && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-chocolate-light">Referência:</dt>
                    <dd className="truncate">
                      <a
                        href={row.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-chocolate"
                      >
                        abrir link
                      </a>
                    </dd>
                  </div>
                )}
                {row.notes && (
                  <div className="flex gap-2 sm:col-span-2">
                    <dt className="shrink-0 text-chocolate-light">Obs:</dt>
                    <dd className="italic">{row.notes}</dd>
                  </div>
                )}
              </dl>

              {/* Pipeline de status */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {STATUS_FLOW.filter((s) => s !== row.status).map((status) => (
                  <button
                    key={status}
                    onClick={() => changeStatus(row, status)}
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

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir encomenda"
        message={`Excluir a solicitação de "${deleting?.name ?? ""}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
