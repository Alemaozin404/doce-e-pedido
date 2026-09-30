/**
 * Service de pedidos: persiste no Supabase os pedidos feitos pelo site
 * (checkout do carrinho, orçamento de festa e encomendas personalizadas).
 *
 * Sem Supabase configurado, tudo é no-op: o fluxo WhatsApp continua
 * funcionando normalmente (modo demonstração).
 *
 * A numeração usa a RPC `generate_order_code()` (database/migrations/002).
 * Em bases criadas antes da migration, o pedido é salvo com `code = null`.
 */
import type { CartItem, CustomOrderData, CustomerInfo } from "@/types";
import type { PartyPlanRequest } from "@/services/whatsapp";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** IDs demo (sem formato UUID) não são FKs válidas — salvam como null. */
function asUuidOrNull(id: string | null): string | null {
  return id && UUID_RE.test(id) ? id : null;
}

type Result = { ok: true; id: string; code: string | null } | { ok: false; error: string };

/**
 * Salva o pedido do carrinho/checkout.
 * Nunca lança: devolve `{ ok: false }` quando não há Supabase ou falha o insert
 * (o fluxo WhatsApp do checkout continua funcionando mesmo sem banco).
 */
export async function saveCartOrder(
  items: CartItem[],
  customer: CustomerInfo,
  totals: { subtotal: number; deliveryFee: number; total: number }
): Promise<Result> {
  const { getSupabaseBrowserClient } = await import("@/lib/supabase");
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase não configurado" };

  const { data: code } = await supabase.rpc("generate_order_code");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      code: (code as string | null) ?? null,
      status: "NOVO",
      customer_name: customer.name,
      customer_phone: customer.phone,
      event_date: customer.date || null,
      event_time: customer.time || null,
      type: customer.type,
      address: customer.address || null,
      notes: customer.notes || null,
      subtotal: totals.subtotal,
      delivery_fee: totals.deliveryFee,
      total: totals.total,
      source: "CART",
    })
    .select("id, code")
    .single();

  if (orderError || !order) {
    console.error("[orders] erro ao salvar pedido:", orderError?.message);
    return { ok: false, error: orderError?.message ?? "erro desconhecido" };
  }

  const rows = items.map((item) => ({
    order_id: order.id as string,
    product_id: asUuidOrNull(item.product_id),
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    options: item.options ?? {},
    notes: item.notes || null,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(rows);
  if (itemsError) {
    // O pedido existe; falhar itens não deve perder a encomenda.
    console.error("[orders] erro ao salvar itens:", itemsError.message);
  }

  return { ok: true, id: order.id as string, code: (order.code as string | null) ?? null };
}

/**
 * Salva a solicitação de "Monte sua Festa" como pedido com source
 * PARTY_PLANNER (status NOVO; o valor é estimativa).
 */
export async function savePartyPlanOrder(request: PartyPlanRequest): Promise<Result> {
  const { getSupabaseBrowserClient } = await import("@/lib/supabase");
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase não configurado" };

  const { data: code } = await supabase.rpc("generate_order_code");

  const summary = request.selections
    .map((s) => `${s.label} (${s.quantityLabel})`)
    .join(", ");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      code: (code as string | null) ?? null,
      status: "NOVO",
      customer_name: "Orçamento de festa (site)",
      customer_phone: "",
      event_date: request.date || null,
      notes: `Festa para ${request.guests} convidado(s). Itens: ${summary || "—"}.`,
      subtotal: request.total,
      delivery_fee: 0,
      total: request.total,
      source: "PARTY_PLANNER",
    })
    .select("id, code")
    .single();

  if (orderError || !order) {
    console.error("[orders] erro ao salvar festa:", orderError?.message);
    return { ok: false, error: orderError?.message ?? "erro desconhecido" };
  }

  return { ok: true, id: order.id as string, code: (order.code as string | null) ?? null };
}

/**
 * Salva a solicitação do formulário de encomendas personalizadas
 * na tabela `custom_orders`.
 */
export async function saveCustomOrder(data: CustomOrderData): Promise<Result> {
  const { getSupabaseBrowserClient } = await import("@/lib/supabase");
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase não configurado" };

  const { data: row, error } = await supabase
    .from("custom_orders")
    .insert({
      name: data.name,
      event_type: data.event_type || null,
      event_date: data.event_date || null,
      guests: data.guests || null,
      theme: data.theme || null,
      colors: data.colors || null,
      sweet_type: data.sweet_type || null,
      reference_url: data.reference_url || null,
      notes: data.notes || null,
      status: "NOVO",
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("[orders] erro ao salvar personalizado:", error?.message);
    return { ok: false, error: error?.message ?? "erro desconhecido" };
  }

  return { ok: true, id: row.id as string, code: null };
}
