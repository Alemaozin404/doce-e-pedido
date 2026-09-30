"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSettings } from "@/components/SettingsContext";
import { todayISO } from "@/lib/format";
import { isValidUrl, sanitizeText } from "@/lib/validation";
import { buildCustomOrderMessage, openWhatsapp } from "@/services/whatsapp";
import { saveCustomOrder } from "@/services/orders";
import type { CustomOrderData } from "@/types";

const EVENT_TYPES = ["Aniversário", "Casamento", "Chá de bebê", "Chá revelação", "Corporativo", "Outro"];
const SWEET_TYPES = ["Bolo", "Brigadeiros", "Doces variados", "Kit festa", "Mesa doce", "Ainda não sei"];

const inputClass =
  "w-full rounded-2xl border border-chocolate/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/40";
const labelClass = "mb-1.5 block text-sm font-semibold text-chocolate";

export default function PersonalizadosPage() {
  const settings = useSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState<CustomOrderData>({
    name: "",
    event_type: EVENT_TYPES[0],
    event_date: "",
    guests: 20,
    theme: "",
    colors: "",
    sweet_type: SWEET_TYPES[0],
    reference_url: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  function set<K extends keyof CustomOrderData>(key: K, value: CustomOrderData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Informe seu nome.";
    if (form.guests < 1) next.guests = "Informe a quantidade de pessoas.";
    if (form.reference_url && !isValidUrl(form.reference_url)) {
      next.reference_url = "URL inválida (deve começar com http/https).";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      showToast("Verifique os campos destacados.", "error");
      return;
    }
    if (!settings.whatsapp_number) {
      showToast("WhatsApp da loja não configurado.", "error");
      return;
    }
    const data: CustomOrderData = {
      ...form,
      name: sanitizeText(form.name, 80),
      theme: sanitizeText(form.theme, 120),
      colors: sanitizeText(form.colors, 120),
      notes: sanitizeText(form.notes, 400),
    };
    try {
      const message = buildCustomOrderMessage(data, settings.bakery_name, settings.message_header);

      // Salva no banco (se houver Supabase) e abre o WhatsApp.
      await saveCustomOrder(data);

      openWhatsapp(message, settings.whatsapp_number);
      setSent(true);
    } catch {
      showToast("Não foi possível abrir o WhatsApp.", "error");
    }
  }

  if (sent) {
    return (
      <div className="container-site flex min-h-[55vh] items-center justify-center py-16">
        <div className="max-w-md text-center">
          <span aria-hidden="true" className="text-6xl">✨</span>
          <h1 className="mt-4 font-display text-3xl text-chocolate-dark">Solicitação enviada!</h1>
          <p className="mt-3 text-chocolate-light">
            Abra o WhatsApp e envie a mensagem para receber seu orçamento personalizado.
          </p>
          <div className="mt-8">
            <Button href="/cardapio" variant="primary">Ver cardápio</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-site py-10 sm:py-14">
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep">Sob medida</p>
        <h1 className="mt-1 font-display text-4xl text-chocolate-dark sm:text-5xl">Pedidos personalizados</h1>
        <p className="mx-auto mt-3 max-w-lg text-chocolate-light">
          Conte o que você imaginou e enviamos um orçamento sob medida pelo WhatsApp.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-2xl space-y-6 rounded-3xl bg-white p-6 shadow-soft sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="p-nome" className={labelClass}>Nome *</label>
            <input id="p-nome" type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} aria-invalid={!!errors.name} />
            {errors.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="p-tipo" className={labelClass}>Tipo de evento</label>
            <select id="p-tipo" value={form.event_type} onChange={(e) => set("event_type", e.target.value)} className={inputClass}>
              {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="p-data" className={labelClass}>Data do evento</label>
            <input id="p-data" type="date" min={todayISO()} value={form.event_date} onChange={(e) => set("event_date", e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="p-qtde" className={labelClass}>Quantidade de pessoas *</label>
            <input id="p-qtde" type="number" min={1} max={1000} value={form.guests} onChange={(e) => set("guests", Number(e.target.value))} className={inputClass} aria-invalid={!!errors.guests} />
            {errors.guests && <p role="alert" className="mt-1 text-xs text-red-600">{errors.guests}</p>}
          </div>

          <div>
            <label htmlFor="p-doce" className={labelClass}>Tipo de doce</label>
            <select id="p-doce" value={form.sweet_type} onChange={(e) => set("sweet_type", e.target.value)} className={inputClass}>
              {SWEET_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="p-tema" className={labelClass}>Tema</label>
            <input id="p-tema" type="text" placeholder="Ex: Safari, Festa Junina..." value={form.theme} onChange={(e) => set("theme", e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="p-cores" className={labelClass}>Cores</label>
            <input id="p-cores" type="text" placeholder="Ex: rosa e dourado" value={form.colors} onChange={(e) => set("colors", e.target.value)} className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="p-ref" className={labelClass}>Link de referência (foto/inspiração)</label>
            <input id="p-ref" type="url" placeholder="https://..." value={form.reference_url} onChange={(e) => set("reference_url", e.target.value)} className={inputClass} aria-invalid={!!errors.reference_url} />
            {errors.reference_url && <p role="alert" className="mt-1 text-xs text-red-600">{errors.reference_url}</p>}
            <p className="mt-1 text-xs text-chocolate-light">
              Tem uma foto de referência? Envie direto no WhatsApp após abrir a conversa.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="p-obs" className={labelClass}>Observações</label>
            <textarea id="p-obs" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
          </div>
        </div>

        <Button type="submit" size="lg" fullWidth>Solicitar orçamento</Button>
      </form>
    </div>
  );
}
