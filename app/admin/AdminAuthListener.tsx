"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

/** Exibe "Entrar" (link para login) ou "Sair" conforme a sessão. */
export default function AdminAuthListener() {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = await getSupabaseBrowserClient();
      if (cancelled) return;
      if (!supabase) {
        setSession(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(Boolean(data.session));
      const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(Boolean(s)));
      return () => sub.subscription.unsubscribe();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    const supabase = await getSupabaseBrowserClient();
    await supabase?.auth.signOut();
  }

  if (session === null) return <span className="text-xs text-chocolate-light">...</span>;

  if (!session) {
    return (
      <Link
        href="/admin/login"
        className="rounded-full bg-chocolate px-4 py-1.5 text-sm font-medium text-cream transition hover:bg-chocolate-dark"
      >
        Entrar
      </Link>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-chocolate/20 px-4 py-1.5 text-sm text-chocolate transition hover:bg-chocolate/5"
    >
      Sair
    </button>
  );
}
