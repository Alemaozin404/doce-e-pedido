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
import type { Review } from "@/types";

export default function AdminAvaliacoesPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Review[] | null>(null);
  const [filter, setFilter] = useState<"PENDENTES" | "APROVADAS" | "TODAS">("PENDENTES");
  const [deleting, setDeleting] = useState<Review | null>(null);

  const load = useCallback(async () => {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      setRows([]);
      return;
    }
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) console.error(error.message);
    setRows((data ?? []) as unknown as Review[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setApproval(review: Review, is_approved: boolean) {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.from("reviews").update({ is_approved }).eq("id", review.id);
    if (error) {
      showToast("Erro ao atualizar avaliação.", "error");
      return;
    }
    showToast(is_approved ? "Avaliação aprovada e publicada no site!" : "Avaliação ocultada.");
    load();
  }

  async function handleDelete() {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase || !deleting) return;
    const { error } = await supabase.from("reviews").delete().eq("id", deleting.id);
    if (error) showToast("Erro ao excluir.", "error");
    else showToast("Avaliação excluída.");
    setDeleting(null);
    load();
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (filter === "PENDENTES") return rows.filter((r) => !r.is_approved);
    if (filter === "APROVADAS") return rows.filter((r) => r.is_approved);
    return rows;
  }, [rows, filter]);

  if (rows === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
    );
  }

  const pendingCount = rows.filter((r) => !r.is_approved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-chocolate-dark">Avaliações</h1>
        <p className="mt-1 text-sm text-chocolate-light">
          Modere os depoimentos: só as aprovadas aparecem na página inicial.
        </p>
      </div>

      {!isSupabaseConfigured() && (
        <p className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-800">
          Conecte o Supabase para gerenciar avaliações reais.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["PENDENTES", `Pendentes (${pendingCount})`],
            ["APROVADAS", "Aprovadas"],
            ["TODAS", "Todas"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === value ? "bg-chocolate text-cream" : "bg-white text-chocolate hover:bg-chocolate/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="⭐"
          title="Nenhuma avaliação aqui"
          description="Quando clientes avaliarem, os depoimentos chegam nesta fila para você aprovar."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((review) => (
            <li key={review.id} className="rounded-3xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-chocolate-dark">{review.customer_name}</p>
                  <p className="text-xs text-chocolate-light">{formatDate(review.created_at.slice(0, 10))}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span aria-label={`${review.rating} de 5 estrelas`} className="text-sm text-gold-dark">
                    {"★".repeat(review.rating)}
                    <span className="text-chocolate/20">{"★".repeat(5 - review.rating)}</span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      review.is_approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {review.is_approved ? "Publicada" : "Pendente"}
                  </span>
                </div>
              </div>

              <p className="mt-3 border-t border-chocolate/10 pt-3 text-sm text-chocolate">“{review.text}”</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {review.is_approved ? (
                  <Button size="sm" variant="ghost" onClick={() => setApproval(review, false)}>
                    Ocultar do site
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setApproval(review, true)}>
                    Aprovar e publicar
                  </Button>
                )}
                <Button size="sm" variant="danger" onClick={() => setDeleting(review)}>
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir avaliação"
        message={`Excluir a avaliação de "${deleting?.customer_name ?? ""}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
