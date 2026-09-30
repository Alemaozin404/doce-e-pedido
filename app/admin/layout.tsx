import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/config";
import AdminAuthListener from "./AdminAuthListener";

export const metadata: Metadata = {
  title: "Administração",
  robots: { index: false, follow: false },
};

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/encomendas", label: "Encomendas" },
  { href: "/admin/calendario", label: "Calendário" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/avaliacoes", label: "Avaliações" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-chocolate/10 bg-white/90 backdrop-blur">
        <div className="container-site flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <Link href="/admin" className="shrink-0 font-display text-lg text-chocolate-dark">
              ⚙️ Admin
            </Link>
            {isSupabaseConfigured() && (
              <nav aria-label="Menu do admin" className="flex gap-1">
                {ADMIN_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-chocolate-light transition hover:bg-chocolate/5 hover:text-chocolate"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <AdminAuthListener />
        </div>
      </header>
      <main className="container-site py-8">{children}</main>
    </div>
  );
}
