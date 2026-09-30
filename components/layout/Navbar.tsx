"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { useSettings } from "@/components/SettingsContext";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/cardapio", label: "Cardápio" },
  { href: "/monte-sua-festa", label: "Monte sua Festa" },
  { href: "/personalizados", label: "Personalizados" },
  { href: "/contato", label: "Contato" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { count } = useCart();
  const settings = useSettings();
  const [open, setOpen] = useState(false);

  // Fecha o menu ao navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava o scroll com o menu aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-chocolate/10 bg-cream/90 backdrop-blur-md">
      <nav className="container-site flex h-16 items-center justify-between gap-4" aria-label="Navegação principal">
        <Link href="/" className="flex items-center gap-2 font-display text-xl text-chocolate-dark">
          <span aria-hidden="true">🧁</span>
          <span>{settings.bakery_name}</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition hover:bg-chocolate/5 ${
                  pathname === link.href ? "bg-chocolate/10 text-chocolate-dark" : "text-chocolate-light"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/carrinho"
            className="relative rounded-full p-2.5 text-chocolate transition hover:bg-chocolate/5"
            aria-label={`Carrinho com ${count} ${count === 1 ? "item" : "itens"}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 animate-pop-in items-center justify-center rounded-full bg-rose-deep px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          <Link
            href="/checkout"
            className="hidden rounded-full bg-chocolate px-5 py-2.5 text-sm font-medium text-cream shadow-soft transition hover:-translate-y-0.5 hover:bg-chocolate-dark sm:inline-flex"
          >
            Fazer pedido
          </Link>

          <button
            className="rounded-full p-2.5 text-chocolate transition hover:bg-chocolate/5 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {open ? (
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="fixed inset-0 top-16 z-40 animate-fade-in bg-cream lg:hidden">
          <ul className="flex flex-col gap-1 p-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block rounded-2xl px-4 py-3.5 text-base font-medium transition ${
                    pathname === link.href ? "bg-chocolate/10 text-chocolate-dark" : "text-chocolate hover:bg-chocolate/5"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2">
              <Link
                href="/checkout"
                className="block rounded-2xl bg-chocolate px-4 py-3.5 text-center text-base font-medium text-cream"
              >
                Fazer pedido
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
