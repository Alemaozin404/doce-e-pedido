/**
 * Serviço centralizado de WhatsApp.
 *
 * MVP: usa o mecanismo OFICIAL de abertura de conversa
 * (`https://wa.me/<número>?text=<mensagem>`), com a mensagem
 * codificada para URL automaticamente.
 *
 * As mensagens adotam um tom minimalista e elegante: sem emojis,
 * apenas a formatação nativa do WhatsApp (`*negrito*`, `_itálico_`
 * e blocos ```monoespaçados```) e uma divisória discreta, para
 * transmitir a sofisticação de uma confeitaria artesanal premium.
 *
 * A arquitetura já isola a geração de mensagens aqui, então migrar
 * futuramente para a WhatsApp Business API exige mudar apenas este arquivo.
 */
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import type { CartItem, CustomerInfo, CustomOrderData } from "@/types";

export interface PartyPlanRequest {
  guests: number;
  selections: { label: string; quantityLabel: string; price: number }[];
  total: number;
  date: string;
}

/** Divisória discreta, alinhada à identidade visual sóbria da marca. */
const DIVIDER = "—————————————";

/** Valor opcional não informado, em itálico. */
const PLACEHOLDER = "_a definir_";

const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

/** Número formatado em dígitos (validado em um único ponto). */
export function normalizeWhatsappNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Abre a conversa no WhatsApp com a mensagem já codificada. */
export function openWhatsapp(message: string, rawNumber: string): void {
  const number = normalizeWhatsappNumber(rawNumber);
  if (!number) {
    throw new Error("Número de WhatsApp não configurado.");
  }
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** "2026-10-05" -> "05/10/2026 (segunda-feira)" (sem deslocamento de fuso). */
function formatDateLong(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return formatDate(isoDate);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${formatDate(isoDate)} (${weekday})`;
}

/**
 * Cabeçalho das mensagens. Usa o texto configurável do painel
 * admin (tabela `settings.message_header`); se vazio, cai para o
 * nome da confeitaria em maiúsculas — elegante por padrão.
 */
function headerLines(title: string, bakeryName?: string, customHeader?: string): string[] {
  const header = customHeader?.trim();
  if (header) return [`${header}`];
  const lines: string[] = [];
  if (bakeryName) lines.push(`*${bakeryName.toUpperCase()}*`);
  lines.push(`_${title}_`);
  return lines;
}

/**
 * Bloco "recibo" em fonte monoespaçada, com valores alinhados à direita.
 * Transmite precisão e profissionalismo sem qualquer adorno.
 */
function buildReceiptBlock(
  rows: { label: string; value: string }[],
  footer?: { label: string; value: string }
): string | null {
  if (rows.length === 0) return null;
  const all = footer ? [...rows, footer] : rows;
  const leftWidth = Math.max(...all.map((r) => r.label.length)) + 2;
  const rightWidth = Math.max(...all.map((r) => r.value.length));
  const lines = rows.map(
    (r) => `${r.label.padEnd(leftWidth)}${r.value.padStart(rightWidth)}`
  );
  if (footer) {
    lines.push("—".repeat(leftWidth + rightWidth));
    lines.push(`${footer.label.padEnd(leftWidth)}${footer.value.padStart(rightWidth)}`);
  }
  return ["```", ...lines, "```"].join("\n");
}

/** Detalhes de um item (opções, data desejada e observações), em itálico. */
function itemDetails(item: CartItem): string[] {
  const details: string[] = [];
  if (item.options) {
    const parts = Object.entries(item.options)
      .filter(([, values]) => values && values.length > 0)
      .map(([key, values]) => `${key}: ${values.join(", ")}`);
    if (parts.length > 0) details.push(`_${parts.join(" · ")}_`);
  }
  if (item.desired_date) details.push(`_Data desejada: ${formatDateLong(item.desired_date)}_`);
  if (item.notes) details.push(`_Obs: ${item.notes}_`);
  return details;
}

/** Mensagem de pedido do carrinho/checkout. */
export function buildCartOrderMessage(
  items: CartItem[],
  customer: CustomerInfo,
  totals: { subtotal: number; deliveryFee: number; total: number },
  bakeryName?: string,
  customHeader?: string
): string {
  const lines: string[] = [];

  lines.push(...headerLines("Novo pedido", bakeryName, customHeader));
  lines.push("");
  lines.push("Olá! Segue o resumo do meu pedido.");
  lines.push("");
  lines.push(DIVIDER);
  lines.push("");
  lines.push("*Itens do pedido*");
  lines.push("");
  for (const item of items) {
    lines.push(`• ${item.quantity}× ${item.name} — *${formatPrice(item.unit_price * item.quantity)}*`);
    for (const detail of itemDetails(item)) {
      lines.push(`   ${detail}`);
    }
    lines.push("");
  }

  lines.push(DIVIDER);
  lines.push("");
  lines.push("*Data e entrega*");
  lines.push(`   _Data: ${formatDateLong(customer.date) || PLACEHOLDER}_`);
  lines.push(`   _Horário: ${customer.time || "a combinar"}_`);
  if (customer.type === "ENTREGA") {
    lines.push(`   _Endereço: ${customer.address || "a combinar"}_`);
  } else {
    lines.push("   _Retirada no local_");
  }
  lines.push("");

  if (customer.notes) {
    lines.push("*Observações*");
    lines.push(`   _${customer.notes}_`);
    lines.push("");
  }

  lines.push("*Cliente*");
  lines.push(`   _Nome: ${customer.name}_`);
  lines.push(`   _WhatsApp: ${formatPhone(customer.phone)}_`);
  lines.push("");

  lines.push(DIVIDER);
  lines.push("");
  lines.push("*Resumo do pedido*");
  lines.push("");
  const receiptRows = [{ label: "Subtotal", value: formatPrice(totals.subtotal) }];
  if (totals.deliveryFee > 0) {
    receiptRows.push({ label: "Entrega", value: formatPrice(totals.deliveryFee) });
  }
  const receipt = buildReceiptBlock(receiptRows, { label: "TOTAL", value: formatPrice(totals.total) });
  if (receipt) lines.push(receipt);
  lines.push("");

  lines.push(DIVIDER);
  lines.push("");
  lines.push("Agradeço desde já e fico no aguardo da confirmação.");

  return lines.join("\n");
}

/** Mensagem do "Monte sua Festa" (orçamento estimado). */
export function buildPartyPlanMessage(request: PartyPlanRequest, bakeryName?: string, customHeader?: string): string {
  const lines: string[] = [];

  lines.push(...headerLines("Orçamento de festa", bakeryName, customHeader));
  lines.push("");
  lines.push("Olá! Montei minha festa pelo site e gostaria de um orçamento.");
  lines.push("");
  lines.push(DIVIDER);
  lines.push("");
  lines.push("*Detalhes do evento*");
  lines.push(`   _Convidados: ${request.guests} ${request.guests === 1 ? "pessoa" : "pessoas"}_`);
  lines.push(`   _Data pretendida: ${request.date ? formatDateLong(request.date) : PLACEHOLDER}_`);
  lines.push("");

  const receipt = buildReceiptBlock(
    request.selections.map((sel) => ({
      label: `${sel.label} · ${sel.quantityLabel}`,
      value: formatPrice(sel.price),
    })),
    { label: "TOTAL ESTIMADO", value: formatPrice(request.total) }
  );
  if (receipt) {
    lines.push("*Itens estimados*");
    lines.push("");
    lines.push(receipt);
    lines.push("");
  }

  lines.push("_Este é um valor de referência. O orçamento final pode variar conforme as personalizações._");
  lines.push("");
  lines.push(DIVIDER);
  lines.push("");
  lines.push("Agradeço desde já e aguardo o retorno com o orçamento.");

  return lines.join("\n");
}

/** Mensagem do formulário de pedido personalizado. */
export function buildCustomOrderMessage(data: CustomOrderData, bakeryName?: string, customHeader?: string): string {
  const lines: string[] = [];

  lines.push(...headerLines("Encomenda personalizada", bakeryName, customHeader));
  lines.push("");
  lines.push("Olá! Gostaria de um orçamento sob medida.");
  lines.push("");
  lines.push(DIVIDER);
  lines.push("");
  lines.push("*Sobre o evento*");
  lines.push(`   _Evento: ${data.event_type || PLACEHOLDER}_`);
  lines.push(`   _Data: ${data.event_date ? formatDateLong(data.event_date) : PLACEHOLDER}_`);
  lines.push(`   _Convidados: ${data.guests} ${data.guests === 1 ? "pessoa" : "pessoas"}_`);
  lines.push(`   _Tipo de doce: ${data.sweet_type || PLACEHOLDER}_`);
  lines.push("");
  lines.push("*Personalização*");
  lines.push(`   _Tema: ${data.theme || PLACEHOLDER}_`);
  lines.push(`   _Cores: ${data.colors || PLACEHOLDER}_`);
  if (data.reference_url) lines.push(`   _Referência: ${data.reference_url}_`);
  lines.push("");
  lines.push(`*Cliente:* ${data.name}`);

  if (data.notes) {
    lines.push("");
    lines.push("*Observações*");
    lines.push(`   _${data.notes}_`);
  }

  lines.push("");
  lines.push(DIVIDER);
  lines.push("");
  lines.push("Agradeço desde já e aguardo o retorno com o orçamento.");

  return lines.join("\n");
}
