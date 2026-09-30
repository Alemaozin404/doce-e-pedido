"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { sanitizeText } from "@/lib/validation";
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "@/data/demo";
import type { Category, Product, ProductOption } from "@/types";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
  is_available: true,
  is_featured: false,
  stock: "",
  flavors: "",
};

export default function AdminProdutosPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      setProducts(DEMO_PRODUCTS);
      setCategories(DEMO_CATEGORIES);
      return;
    }
    const [prodRes, catRes] = await Promise.all([
      supabase.from("products").select("*").order("display_order", { ascending: true }),
      supabase.from("categories").select("*").order("display_order", { ascending: true }),
    ]);
    if (prodRes.error) console.error(prodRes.error.message);
    if (catRes.error) console.error(catRes.error.message);
    setProducts((prodRes.data ?? []) as Product[]);
    setCategories((catRes.data ?? []) as Category[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id ?? "" });
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      category_id: product.category_id ?? "",
      image_url: product.image_url ?? "",
      is_available: product.is_available,
      is_featured: product.is_featured,
      stock: product.stock === null ? "" : String(product.stock),
      flavors: product.options?.[0]?.values.join(", ") ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      showToast("Conecte o Supabase para gerenciar produtos.", "error");
      return;
    }
    if (form.name.trim().length < 2 || !form.price) {
      showToast("Preencha nome e preço.", "error");
      return;
    }
    setSaving(true);
    const values = {
      name: sanitizeText(form.name, 120),
      description: sanitizeText(form.description, 500) || null,
      price: Number(form.price.replace(",", ".")),
      category_id: form.category_id || null,
      image_url: form.image_url.trim() || null,
      is_available: form.is_available,
      is_featured: form.is_featured,
      stock: form.stock ? Number(form.stock) : null,
      options:
        form.flavors.trim().length > 0
          ? ([{ name: "Sabores", type: "single", values: form.flavors.split(",").map((v) => v.trim()).filter(Boolean) }] as ProductOption[])
          : [],
    };

    const result = editing
      ? await supabase.from("products").update(values).eq("id", editing.id)
      : await supabase.from("products").insert(values);

    setSaving(false);
    if (result.error) {
      console.error(result.error.message);
      showToast("Erro ao salvar produto.", "error");
      return;
    }
    showToast(editing ? "Produto atualizado!" : "Produto criado!");
    setModalOpen(false);
    load();
  }

  async function toggleAvailability(product: Product) {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase
      .from("products")
      .update({ is_available: !product.is_available })
      .eq("id", product.id);
    if (error) {
      showToast("Erro ao atualizar.", "error");
      return;
    }
    showToast(product.is_available ? "Produto desativado" : "Produto ativado");
    load();
  }

  async function handleDelete() {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase || !deleting) return;
    const { error } = await supabase.from("products").delete().eq("id", deleting.id);
    if (error) {
      showToast("Erro ao excluir produto.", "error");
    } else {
      showToast("Produto excluído.");
    }
    setDeleting(null);
    load();
  }

  if (products === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-3xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-chocolate-dark">Produtos</h1>
          <p className="mt-1 text-sm text-chocolate-light">Gerencie o cardápio da loja.</p>
        </div>
        <Button onClick={openCreate}>+ Novo produto</Button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-800">
          Exibindo dados de demonstração. Conecte o Supabase para editar de verdade.
        </p>
      )}

      {products.length === 0 ? (
        <EmptyState
          emoji="📦"
          title="Nenhum produto cadastrado"
          description="Crie o primeiro produto para começar a vender."
          action={<Button onClick={openCreate}>Criar produto</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {products.map((product) => (
            <li key={product.id} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream-dark">
                {product.image_url ? (
                  <Image src={product.image_url} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-2xl" aria-hidden="true">🍰</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-chocolate-dark">{product.name}</p>
                <p className="text-xs text-chocolate-light">
                  {categories.find((c) => c.id === product.category_id)?.name ?? "Sem categoria"} ·{" "}
                  {formatPrice(product.price)} · {product.stock === null ? "estoque livre" : `${product.stock} em estoque`}
                </p>
              </div>
              <span
                className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:inline ${
                  product.is_available ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {product.is_available ? "Ativo" : "Inativo"}
              </span>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="ghost" onClick={() => toggleAvailability(product)}>
                  {product.is_available ? "Desativar" : "Ativar"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(product)}>Editar</Button>
                <Button size="sm" variant="danger" onClick={() => setDeleting(product)}>Excluir</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar produto" : "Novo produto"}>
        <div className="space-y-4">
          <Field label="Nome *">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Descrição">
            <textarea rows={3} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço (R$) *">
              <input inputMode="decimal" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Estoque (vazio = ilimitado)">
              <input inputMode="numeric" className={inputCls} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Field>
          </div>
          <Field label="Categoria">
            <select className={inputCls} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Sem categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="URL da foto principal">
            <input placeholder="https://..." className={inputCls} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </Field>
          <Field label="Sabores/opções (separados por vírgula)">
            <input placeholder="Chocolate, Morango, Ninho, Oreo" className={inputCls} value={form.flavors} onChange={(e) => setForm({ ...form, flavors: e.target.value })} />
          </Field>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="h-4 w-4 accent-[#5C4033]" />
              Ativo (visível no cardápio)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4 accent-[#5C4033]" />
              Destaque na home
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir produto"
        message={`Excluir "${deleting?.name ?? ""}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-chocolate">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-chocolate/20 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/40";
