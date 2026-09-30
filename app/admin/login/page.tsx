"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";

const inputClass =
  "w-full rounded-2xl border border-chocolate/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/40";

/** E-mail técnico da conta única de acesso ao painel. */
const ADMIN_EMAIL = "admin@doceepedido.local";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase não configurado. Preencha o .env.local e reinicie o servidor.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });
    setLoading(false);
    if (authError) {
      setError("Senha incorreta.");
      return;
    }
    showToast("Bem-vinda de volta! 💜");
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="container-site flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-card">
        <span aria-hidden="true" className="block text-center text-5xl">🔐</span>
        <h1 className="mt-4 text-center font-display text-2xl text-chocolate-dark">Área da confeiteira</h1>
        <p className="mt-2 text-center text-sm text-chocolate-light">
          Digite sua senha para gerenciar a loja.
        </p>

        {!isSupabaseConfigured() && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
            O Supabase ainda não está configurado. Copie <code>.env.example</code> para <code>.env.local</code>,
            preencha as chaves e reinicie o servidor.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="senha" className="mb-1.5 block text-sm font-semibold">Senha de acesso</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-2xl bg-red-50 p-3 text-xs text-red-700">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
