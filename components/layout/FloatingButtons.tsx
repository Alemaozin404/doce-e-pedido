"use client";

import { usePathname } from "next/navigation";
import { useSettings } from "@/components/SettingsContext";

/** Botão flutuante de WhatsApp (escondido no admin). */
export default function FloatingButtons() {
  const pathname = usePathname();
  const settings = useSettings();

  if (pathname.startsWith("/admin") || !settings.whatsapp_number) return null;

  return (
    <a
      href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar no WhatsApp"
      className="fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lifted transition hover:scale-105 sm:left-auto sm:right-6"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.2L2 22l4.9-1.6A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.35-2 1.4-.5.05-1.15.25-3.85-.8-3.25-1.3-5.3-4.6-5.45-4.8-.15-.2-1.3-1.75-1.3-3.3 0-1.55.8-2.3 1.1-2.65.3-.35.65-.4.85-.4h.65c.2 0 .45-.05.7.55.25.6.85 2.15.95 2.3.1.15.15.35.05.55-.1.2-.15.35-.3.55l-.45.5c-.15.15-.3.3-.15.6.15.3.7 1.2 1.55 1.95 1.05.95 1.95 1.25 2.25 1.4.3.15.45.1.65-.05.15-.15.65-.75.85-1 .2-.25.35-.2.6-.1.25.1 1.6.75 1.9.9.3.15.5.2.55.35.1.1.1.75-.15 1.45Z" />
      </svg>
    </a>
  );
}
