"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { sanitizeText } from "@/lib/validation";
import { useSettings } from "@/components/SettingsContext";
import type { Settings } from "@/types";

export default function AdminConfiguracoesPage() {
  const current = useSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState<Settings>(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(current);
  }, [current]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      showToast("Conecte o Supabase para salvar configurações.", "error");
      return;
    }
    setSaving(true);
    const values = {
      bakery_name: sanitizeText(form.bakery_name, 80),
      whatsapp_number: form.whatsapp_number.replace(/\D/g, ""),
      instagram_handle: form.instagram_handle.replace("@", "").trim(),
      address: sanitizeText(form.address, 200),
      opening_hours: sanitizeText(form.opening_hours, 120),
      delivery_fee: Number(form.delivery_fee) || 0,
      whatsapp_message: sanitizeText(form.whatsapp_message, 200),
      message_header: sanitizeText(form.message_header ?? "", 120),
      seo_city: sanitizeText(form.seo_city, 80),
    };
    const { error } = await supabase.from("settings").upsert({ id: 1, ...values });
    setSaving(false);
    if (error) {
      console.error(error.message);
      showToast("Erro ao salvar configurações.", "error");
      return;
    }
    showToast("Configurações salvas! Recarregue a página pública para ver (F5).");
  }

  const inputCls =
    "w-full rounded-2xl border border-chocolate/20 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/40";
  const labelCls = "mb-1.5 block text-sm font-semibold text-chocolate";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-chocolate-dark">Configurações</h1>
        <p className="mt-1 text-sm text-chocolate-light">
          Dados da loja usados em todo o site e nas mensagens de WhatsApp.
        </p>
      </div>

      {!isSupabaseConfigured() && (
        <p className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-800">
          Sem Supabase, as configurações vêm do .env.local e não podem ser editadas por aqui.
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-4 rounded-3xl bg-white p-6 shadow-soft sm:p-8">
        <div>
          <label htmlFor="c-nome" className={labelCls}>Nome da confeitaria</label>
          <input id="c-nome" className={inputCls} value={form.bakery_name} onChange={(e) => setForm({ ...form, bakery_name: e.target.value })} />
        </div>

        <div>
          <label htmlFor="c-wa" className={labelCls}>WhatsApp (só números, com DDI/DDD)</label>
          <input id="c-wa" inputMode="numeric" placeholder="5511999998888" className={inputCls} value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-ig" className={labelCls}>Instagram (sem @)</label>
            <input id="c-ig" className={inputCls} value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} />
          </div>
          <div>
            <label htmlFor="c-taxa" className={labelCls}>Taxa de entrega (R$)</label>
            <input id="c-taxa" inputMode="decimal" className={inputCls} value={String(form.delivery_fee)} onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value.replace(",", ".")) || 0 })} />
          </div>
        </div>

        <div>
          <label htmlFor="c-end" className={labelCls}>Endereço (opcional)</label>
          <input id="c-end" className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <div>
          <label htmlFor="c-hor" className={labelCls}>Horário de atendimento</label>
          <input id="c-hor" className={inputCls} value={form.opening_hours} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} />
        </div>

        <div>
          <label htmlFor="c-msg" className={labelCls}>Mensagem padrão do WhatsApp</label>
          <textarea id="c-msg" rows={2} className={inputCls} value={form.whatsapp_message} onChange={(e) => setForm({ ...form, whatsapp_message: e.target.value })} />
        </div>

        <div>
          <label htmlFor="c-header" className={labelCls}>Cabeçalho das mensagens de pedido (opcional)</label>
          <input
            id="c-header"
            placeholder="Ex: ✦ DOCE & PEDIDO — Encomendas Especiais"
            className={inputCls}
            value={form.message_header ?? ""}
            onChange={(e) => setForm({ ...form, message_header: e.target.value })}
          />
          <p className="mt-1 text-xs text-chocolate-light">
            Primeira linha que a loja recebe nas mensagens de pedido, orçamento de festa e encomenda personalizada.
            Deixe vazio para usar o nome da confeitaria em maiúsculas.
          </p>
          {(form.message_header ?? "").trim() && (
            <div className="mt-3 rounded-2xl bg-cream p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-chocolate-light">Pré-visualização</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-chocolate-dark">{form.message_header}</p>
              <p className="mt-1 italic text-sm text-chocolate-light">_Novo pedido_</p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="c-city" className={labelCls}>Cidade para SEO (ex: "São Paulo")</label>
          <input id="c-city" className={inputCls} value={form.seo_city} onChange={(e) => setForm({ ...form, seo_city: e.target.value })} />
          <p className="mt-1 text-xs text-chocolate-light">
            Usado nas frases de busca como "doces artesanais em {form.seo_city || "[cidade]"}".
          </p>
        </div>

        <div>
          <label htmlFor="c-logo" className={labelCls}>Logo (URL da imagem)</label>
          <input id="c-logo" placeholder="https://..." className={inputCls} value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value || null })} />
        </div>

        <Button type="submit" disabled={saving} size="lg">
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </form>
    </div>
  );
}
