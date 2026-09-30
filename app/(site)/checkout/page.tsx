"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { useSettings } from "@/components/SettingsContext";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatPrice, todayISO } from "@/lib/format";
import { isValidPhone, onlyDigits, sanitizeText } from "@/lib/validation";
import { buildCartOrderMessage, openWhatsapp } from "@/services/whatsapp";
import { saveCartOrder } from "@/services/orders";
import type { CustomerInfo, OrderType } from "@/types";

export default function CheckoutPage() {
  const { items, totals, deliveryType, setDeliveryType, clearCart } = useCart();
  const settings = useSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState<Omit<CustomerInfo, "type">>({
    name: "",
    phone: "",
    date: todayISO(),
    time: "",
    address: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Informe seu nome.";
    if (!isValidPhone(form.phone)) next.phone = "Telefone inválido. Ex: (11) 99999-8888";
    if (!form.date) next.date = "Informe a data do pedido.";
    if (!form.time) next.time = "Informe o horário.";
    if (deliveryType === "ENTREGA" && form.address.trim().length < 8) {
      next.address = "Informe o endereço completo para entrega.";
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
      showToast("WhatsApp da loja não configurado. Fale conosco pelo Instagram.", "error");
      return;
    }

    setSending(true);
    try {
      const customer: CustomerInfo = {
        ...form,
        name: sanitizeText(form.name, 80),
        phone: onlyDigits(form.phone),
        address: sanitizeText(form.address, 200),
        notes: sanitizeText(form.notes, 400),
        type: deliveryType as OrderType,
      };
      const message = buildCartOrderMessage(items, customer, totals, settings.bakery_name, settings.message_header);

      // Salva no banco (se houver Supabase) e abre o WhatsApp.
      // Falha no banco NÃO bloqueia o pedido: o WhatsApp é o fluxo principal.
      const saved = await saveCartOrder(items, customer, totals);
      const orderCode = saved.ok ? saved.code : null;

      const finalMessage = orderCode
        ? message.replace(
            "Olá! Segue o resumo do meu pedido.",
            `Olá! Segue o resumo do meu pedido. (Pedido ${orderCode})`
          )
        : message;

      openWhatsapp(finalMessage, settings.whatsapp_number);
      setSent(true);
      clearCart();
    } catch (err) {
      console.error("[checkout] erro ao abrir WhatsApp:", err);
      showToast("Não foi possível abrir o WhatsApp. Tente novamente.", "error");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="container-site flex min-h-[60vh] items-center justify-center py-16">
        <div className="max-w-md text-center">
          <span aria-hidden="true" className="text-6xl">🎉</span>
          <h1 className="mt-4 font-display text-3xl text-chocolate-dark">Pedido enviado!</h1>
          <p className="mt-3 text-chocolate-light">
            Abrimos o WhatsApp com o seu pedido organizado. Basta apertar enviar na conversa para confirmar.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/cardapio" variant="primary">Voltar ao cardápio</Button>
            <Button href="/" variant="ghost">Página inicial</Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-site py-16">
        <h1 className="mb-8 text-center font-display text-4xl text-chocolate-dark">Finalizar pedido</h1>
        <EmptyState
          emoji="🛍️"
          title="Nenhum item no pedido"
          description="Adicione produtos do cardápio para finalizar seu pedido."
          action={<Button href="/cardapio" variant="primary">Ver cardápio</Button>}
        />
      </div>
    );
  }

  const inputClass =
    "w-full rounded-2xl border border-chocolate/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/40";
  const labelClass = "mb-1.5 block text-sm font-semibold text-chocolate";

  return (
    <div className="container-site py-10 sm:py-14">
      <h1 className="mb-8 text-center font-display text-4xl text-chocolate-dark">Finalizar pedido</h1>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8" noValidate>
        {/* Resumo dos itens */}
        <section aria-labelledby="resumo-itens" className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 id="resumo-itens" className="font-display text-xl text-chocolate-dark">Seu pedido</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.product_id} className="flex items-start justify-between gap-4">
                <span>
                  {item.quantity}× {item.name}
                  {item.options && Object.keys(item.options).length > 0 && (
                    <span className="block text-xs text-chocolate-light">
                      {Object.entries(item.options).map(([k, v]) => `${k}: ${v.join(", ")}`).join(" | ")}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-medium">{formatPrice(item.unit_price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-chocolate/10 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-chocolate-light">Subtotal</dt>
              <dd>{formatPrice(totals.subtotal)}</dd>
            </div>
            {deliveryType === "ENTREGA" && (
              <div className="flex justify-between">
                <dt className="text-chocolate-light">Taxa de entrega</dt>
                <dd>{formatPrice(totals.deliveryFee)}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd className="font-display text-lg">{formatPrice(totals.total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-chocolate-light">
            <Link href="/carrinho" className="underline underline-offset-2 hover:text-chocolate">
              Editar itens no carrinho
            </Link>
          </p>
        </section>

        {/* Dados do cliente */}
        <section aria-labelledby="dados-cliente" className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 id="dados-cliente" className="font-display text-xl text-chocolate-dark">Seus dados</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="nome" className={labelClass}>Nome completo *</label>
              <input
                id="nome"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "erro-nome" : undefined}
              />
              {errors.name && <p id="erro-nome" role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="telefone" className={labelClass}>Telefone (WhatsApp) *</label>
              <input
                id="telefone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(11) 99999-8888"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputClass}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "erro-telefone" : undefined}
              />
              {errors.phone && <p id="erro-telefone" role="alert" className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="data" className={labelClass}>Data do pedido *</label>
              <input
                id="data"
                type="date"
                min={todayISO()}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={inputClass}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "erro-data" : undefined}
              />
              {errors.date && <p id="erro-data" role="alert" className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>

            <div>
              <label htmlFor="hora" className={labelClass}>Horário *</label>
              <input
                id="hora"
                type="time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className={inputClass}
                aria-invalid={!!errors.time}
                aria-describedby={errors.time ? "erro-hora" : undefined}
              />
              {errors.time && <p id="erro-hora" role="alert" className="mt-1 text-xs text-red-600">{errors.time}</p>}
            </div>

            <fieldset className="sm:col-span-2">
              <legend className={labelClass}>Tipo de pedido *</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["RETIRADA", "ENTREGA"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDeliveryType(t)}
                    aria-pressed={deliveryType === t}
                    className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                      deliveryType === t
                        ? "border-chocolate bg-chocolate text-cream"
                        : "border-chocolate/20 bg-white text-chocolate hover:border-chocolate/50"
                    }`}
                  >
                    {t === "RETIRADA" ? "🏪 Retirada" : "🛵 Entrega"}
                  </button>
                ))}
              </div>
            </fieldset>

            {deliveryType === "ENTREGA" && (
              <div className="sm:col-span-2">
                <label htmlFor="endereco" className={labelClass}>Endereço de entrega *</label>
                <input
                  id="endereco"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Rua, número, bairro, cidade e referência"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className={inputClass}
                  aria-invalid={!!errors.address}
                  aria-describedby={errors.address ? "erro-endereco" : undefined}
                />
                {errors.address && <p id="erro-endereco" role="alert" className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="obs-gerais" className={labelClass}>Observações gerais</label>
              <textarea
                id="obs-gerais"
                rows={3}
                placeholder="Ex: decoração rosa, escrita no bolo, alergias..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <Button type="submit" size="lg" fullWidth disabled={sending}>
          {sending ? "Abrindo WhatsApp..." : "Enviar pedido pelo WhatsApp"}
        </Button>
        <p className="text-center text-xs text-chocolate-light">
          Ao enviar, abriremos o WhatsApp com o pedido organizado. Nenhuma informação é cobrada automaticamente.
        </p>
      </form>
    </div>
  );
}
