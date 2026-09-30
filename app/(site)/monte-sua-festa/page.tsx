"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSettings } from "@/components/SettingsContext";
import { formatPrice } from "@/lib/format";
import { buildPartyPlanMessage, openWhatsapp } from "@/services/whatsapp";
import { savePartyPlanOrder } from "@/services/orders";

/** Catálogo base para a estimativa — valores podem ser ajustados pela cliente. */
const BASE_ITEMS = [
  { id: "bolo", label: "Bolo", unit: "kg", perGuest: 0.1, pricePerUnit: 80, unitSize: "1 kg" },
  { id: "brigadeiros", label: "Brigadeiros", unit: "un", perGuest: 2, pricePerUnit: 1.5, unitSize: "unidade" },
  { id: "beijinhos", label: "Beijinhos", unit: "un", perGuest: 1, pricePerUnit: 1.5, unitSize: "unidade" },
  { id: "salgadinhos", label: "Salgadinhos", unit: "un", perGuest: 1, pricePerUnit: 1.85, unitSize: "unidade" },
  { id: "kits", label: "Kit decoração", unit: "kit", perGuest: 0.033, pricePerUnit: 30, unitSize: "1 kit" },
];

const GUEST_OPTIONS = [10, 20, 30, 50, 100];

export default function MonteSuaFestaPage() {
  const settings = useSettings();
  const { showToast } = useToast();
  const [guests, setGuests] = useState(30);
  const [selected, setSelected] = useState<Record<string, boolean>>({
    bolo: true,
    brigadeiros: true,
    beijinhos: false,
    salgadinhos: false,
    kits: false,
  });
  const [date, setDate] = useState("");

  const estimate = useMemo(() => {
    return BASE_ITEMS.filter((i) => selected[i.id]).map((i) => {
      const qty = Math.max(1, Math.ceil(guests * i.perGuest));
      return {
        ...i,
        qty,
        price: qty * i.pricePerUnit,
      };
    });
  }, [guests, selected]);

  const total = estimate.reduce((acc, i) => acc + i.price, 0);

  async function handleRequestQuote() {
    if (!settings.whatsapp_number) {
      showToast("WhatsApp da loja não configurado.", "error");
      return;
    }
    const messageSelections = estimate.map((i) => ({
      label: i.label,
      quantityLabel: `${i.qty} ${i.unit === "un" ? "un." : i.unit}`,
      price: i.price,
    }));

    const message = buildPartyPlanMessage(
      { guests, date, total, selections: messageSelections },
      settings.bakery_name,
      settings.message_header
    );
    try {
      // Salva a solicitação no banco (se houver Supabase) e abre o WhatsApp.
      await savePartyPlanOrder({ guests, date, total, selections: messageSelections });

      openWhatsapp(message, settings.whatsapp_number);
    } catch {
      showToast("Não foi possível abrir o WhatsApp.", "error");
    }
  }

  const chipClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      active ? "bg-chocolate text-cream" : "bg-white text-chocolate hover:bg-chocolate/5"
    }`;

  return (
    <div className="container-site py-10 sm:py-14">
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep">Festa completa</p>
        <h1 className="mt-1 font-display text-4xl text-chocolate-dark sm:text-5xl">Monte sua festa</h1>
        <p className="mx-auto mt-3 max-w-lg text-chocolate-light">
          Informe o número de convidados e escolha o que servir. Calculamos uma estimativa na hora.
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Convidados */}
        <section aria-labelledby="convidados" className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          <h2 id="convidados" className="font-display text-xl text-chocolate-dark">Para quantas pessoas?</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {GUEST_OPTIONS.map((n) => (
              <button key={n} onClick={() => setGuests(n)} aria-pressed={guests === n} className={chipClass(guests === n)}>
                {n}
              </button>
            ))}
            <input
              type="number"
              min={5}
              max={500}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
              aria-label="Outro número de convidados"
              className="w-24 rounded-full border border-chocolate/20 px-4 py-2 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/40"
            />
          </div>

          <div className="mt-5">
            <label htmlFor="data-festa" className="mb-1.5 block text-sm font-semibold">Data pretendida (opcional)</label>
            <input
              id="data-festa"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full max-w-xs rounded-2xl border border-chocolate/20 px-4 py-3 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/40"
            />
          </div>
        </section>

        {/* Seleção de itens */}
        <section aria-labelledby="itens-festa" className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          <h2 id="itens-festa" className="font-display text-xl text-chocolate-dark">O que você quer servir?</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {BASE_ITEMS.map((item) => (
              <li key={item.id}>
                <label
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                    selected[item.id] ? "border-chocolate bg-cream" : "border-chocolate/15 hover:border-chocolate/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected[item.id] ?? false}
                      onChange={(e) => setSelected((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                      className="h-4 w-4 accent-[#5C4033]"
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </span>
                  <span className="text-xs text-chocolate-light">
                    {Math.max(1, Math.ceil(guests * item.perGuest))} × {item.unitSize}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* Estimativa */}
        <section aria-labelledby="estimativa" className="rounded-3xl bg-chocolate p-6 text-cream shadow-card sm:p-8">
          <h2 id="estimativa" className="font-display text-xl">
            Estimativa — festa para {guests} pessoas
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {estimate.map((i) => (
              <li key={i.id} className="flex justify-between gap-4">
                <span>
                  {i.label} — {i.qty} {i.unit === "un" ? "un." : i.unit}
                </span>
                <span>{formatPrice(i.price)}</span>
              </li>
            ))}
          </ul>
          {estimate.length === 0 && <p className="mt-2 text-sm text-cream/70">Selecione pelo menos um item acima.</p>}
          <div className="mt-5 flex justify-between border-t border-cream/20 pt-4 text-lg font-semibold">
            <span>Total estimado</span>
            <span className="font-display text-2xl">{formatPrice(total)}</span>
          </div>
          <p className="mt-3 text-xs text-cream/70">
            Os valores são estimativas. O orçamento final pode variar conforme personalizações.
          </p>
          <div className="mt-6">
            <Button variant="gold" size="lg" fullWidth onClick={handleRequestQuote} disabled={estimate.length === 0}>
              Solicitar orçamento pelo WhatsApp
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
