"use client";

import Link from "next/link";
import { useSettings } from "@/components/SettingsContext";
import { formatPhone } from "@/lib/format";

export default function Footer() {
  const settings = useSettings();
  return (
    <footer className="mt-20 border-t border-chocolate/10 bg-white/60">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 font-display text-xl text-chocolate-dark">
            <span aria-hidden="true">🧁</span> {settings.bakery_name}
          </p>
          <p className="mt-3 text-sm text-chocolate-light">
            Doces artesanais, bolos e kits preparados com carinho para deixar sua comemoração ainda mais especial.
          </p>
        </div>

        <nav aria-label="Links do site">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-chocolate-light">Navegue</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-chocolate-dark hover:underline" href="/cardapio">Cardápio</Link></li>
            <li><Link className="hover:text-chocolate-dark hover:underline" href="/monte-sua-festa">Monte sua Festa</Link></li>
            <li><Link className="hover:text-chocolate-dark hover:underline" href="/personalizados">Pedidos personalizados</Link></li>
            <li><Link className="hover:text-chocolate-dark hover:underline" href="/contato">Contato</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-chocolate-light">Atendimento</h2>
          <ul className="space-y-2 text-sm text-chocolate-light">
            <li>{settings.opening_hours}</li>
            {settings.whatsapp_number ? (
              <li>WhatsApp: {formatPhone(settings.whatsapp_number)}</li>
            ) : null}
            {settings.instagram_handle ? (
              <li>
                <a
                  href={`https://instagram.com/${settings.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-chocolate-dark hover:underline"
                >
                  @{settings.instagram_handle}
                </a>
              </li>
            ) : null}
            {settings.address ? <li>{settings.address}</li> : null}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-chocolate-light">Atalhos</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-chocolate-dark hover:underline" href="/carrinho">Meu carrinho</Link></li>
            <li><Link className="hover:text-chocolate-dark hover:underline" href="/checkout">Finalizar pedido</Link></li>
            <li><Link className="hover:text-chocolate-dark hover:underline" href="/admin">Área administrativa</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-chocolate/10 py-5 text-center text-xs text-chocolate-light">
        © {new Date().getFullYear()} {settings.bakery_name} · Feito com carinho
      </div>
    </footer>
  );
}
