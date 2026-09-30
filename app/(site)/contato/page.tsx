import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import { getSettings } from "@/services/settings";
import { formatPhone } from "@/lib/format";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale conosco pelo WhatsApp ou Instagram. Horários de atendimento e localização.",
  alternates: { canonical: "/contato" },
};

export default async function ContatoPage() {
  const settings = await getSettings();

  return (
    <div className="container-site py-10 sm:py-14">
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep">Fale conosco</p>
        <h1 className="mt-1 font-display text-4xl text-chocolate-dark sm:text-5xl">Contato</h1>
        <p className="mx-auto mt-3 max-w-lg text-chocolate-light">
          Tire dúvidas, faça encomendas e acompanhe novidades pelos nossos canais.
        </p>
      </header>

      <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
        {/* WhatsApp */}
        <section className="rounded-3xl bg-white p-7 shadow-soft" aria-labelledby="ct-wa">
          <h2 id="ct-wa" className="flex items-center gap-2 font-display text-xl text-chocolate-dark">
            <span aria-hidden="true">💬</span> WhatsApp
          </h2>
          <p className="mt-2 text-sm text-chocolate-light">
            {settings.whatsapp_number ? formatPhone(settings.whatsapp_number) : "Configure o número nas configurações."}
          </p>
          <div className="mt-4">
            {settings.whatsapp_number ? (
              <Button
                href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`}
                external
                variant="primary"
              >
                Conversar no WhatsApp
              </Button>
            ) : (
              <p className="text-xs text-chocolate-light">
                Defina NEXT_PUBLIC_WHATSAPP_NUMBER no .env.local ou edite nas configurações admin.
              </p>
            )}
          </div>
        </section>

        {/* Instagram */}
        <section className="rounded-3xl bg-white p-7 shadow-soft" aria-labelledby="ct-ig">
          <h2 id="ct-ig" className="flex items-center gap-2 font-display text-xl text-chocolate-dark">
            <span aria-hidden="true">📸</span> Instagram
          </h2>
          <p className="mt-2 text-sm text-chocolate-light">
            {settings.instagram_handle ? `@${settings.instagram_handle}` : "Configure o handle nas configurações."}
          </p>
          {settings.instagram_handle && (
            <div className="mt-4">
              <Button href={`https://instagram.com/${settings.instagram_handle}`} external variant="secondary">
                Abrir Instagram
              </Button>
            </div>
          )}
        </section>

        {/* Horário */}
        <section className="rounded-3xl bg-white p-7 shadow-soft" aria-labelledby="ct-horario">
          <h2 id="ct-horario" className="flex items-center gap-2 font-display text-xl text-chocolate-dark">
            <span aria-hidden="true">🕘</span> Atendimento
          </h2>
          <p className="mt-2 text-sm text-chocolate-light">{settings.opening_hours}</p>
        </section>

        {/* Localização */}
        <section className="rounded-3xl bg-white p-7 shadow-soft" aria-labelledby="ct-local">
          <h2 id="ct-local" className="flex items-center gap-2 font-display text-xl text-chocolate-dark">
            <span aria-hidden="true">📍</span> Localização
          </h2>
          {settings.address ? (
            <p className="mt-2 text-sm text-chocolate-light">{settings.address}</p>
          ) : (
            <p className="mt-2 text-sm text-chocolate-light">
              Endereço não divulgado. Combine a retirada pelo WhatsApp.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
