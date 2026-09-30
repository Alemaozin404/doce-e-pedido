/**
 * Tipos centrais do domínio "Doce & Pedido".
 * Espelham o schema do Supabase (database/schema.sql).
 */

export type OrderStatus =
  | "NOVO"
  | "CONFIRMADO"
  | "EM_PRODUCAO"
  | "PRONTO"
  | "ENTREGUE"
  | "CANCELADO";

export type OrderType = "RETIRADA" | "ENTREGA";

export type OrderSource = "CART" | "PARTY_PLANNER" | "CUSTOM_ORDER";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  gallery: string[] | null;
  options: ProductOption[] | null;
  is_available: boolean;
  stock: number | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export interface ProductOption {
  name: "Sabores" | string;
  type: "single" | "multiple";
  values: string[];
}

export interface CartItem {
  product_id: string;
  name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  options: Record<string, string[]> | null;
  notes: string | null;
  desired_date: string | null;
}

export interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  date: string;
  time: string;
  type: OrderType;
  address: string;
  notes: string;
}

export interface OrderItemData {
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  options: Record<string, string[]> | null;
  notes: string | null;
}

export interface OrderData {
  id: string;
  code: string | null;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  event_date: string | null;
  event_time: string | null;
  type: OrderType;
  address: string | null;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  source: OrderSource;
  customer_id: string | null;
  items: OrderItemData[];
  created_at: string;
  customers?: { id: string; name: string; phone: string } | null;
}

export interface CustomOrderData {
  name: string;
  event_type: string;
  event_date: string;
  guests: number;
  theme: string;
  colors: string;
  sweet_type: string;
  reference_url: string;
  notes: string;
}

/** Linha da tabela custom_orders (encomendas personalizadas). */
export interface CustomOrderRecord {
  id: string;
  name: string;
  event_type: string | null;
  event_date: string | null;
  guests: number | null;
  theme: string | null;
  colors: string | null;
  sweet_type: string | null;
  reference_url: string | null;
  notes: string | null;
  status: "NOVO" | "EM_ATENDIMENTO" | "ORCADO" | "FECHADO" | "CANCELADO";
  created_at: string;
}

export interface Settings {
  bakery_name: string;
  whatsapp_number: string;
  instagram_handle: string;
  address: string;
  opening_hours: string;
  delivery_fee: number;
  whatsapp_message: string;
  /** Cabeçalho opcional usado no topo das mensagens de WhatsApp (vazio = usa o nome da confeitaria). */
  message_header: string;
  seo_city: string;
  logo_url: string | null;
}

export interface Review {
  id: string;
  customer_name: string;
  rating: number;
  text: string;
  is_approved: boolean;
  created_at: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
}
