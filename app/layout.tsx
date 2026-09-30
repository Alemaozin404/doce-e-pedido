import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/services/settings";
import { SettingsProvider } from "@/components/SettingsContext";
import { CartProvider } from "@/components/cart/CartContext";
import { ToastProvider } from "@/components/ui/Toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingButtons from "@/components/layout/FloatingButtons";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const city = settings.seo_city;
  const title = city
    ? `${settings.bakery_name} — Doces artesanais em ${city}`
    : `${settings.bakery_name} — Doces artesanais, bolos e kits para festa`;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: title,
      template: `%s · ${settings.bakery_name}`,
    },
    description:
      "Doces artesanais, bolos personalizados, brigadeiros gourmet e kits para festa. Monte seu pedido online e envie pelo WhatsApp.",
    keywords: [
      "doces artesanais",
      city ? `doces artesanais em ${city}` : "doces artesanais",
      city ? `bolos personalizados em ${city}` : "bolos personalizados",
      city ? `brigadeiro gourmet em ${city}` : "brigadeiro gourmet",
      city ? `kit festa em ${city}` : "kit festa",
      "confeitaria",
    ],
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      locale: "pt_BR",
      title,
      description: "Doces artesanais, bolos e kits para festa feitos sob encomenda.",
      siteName: settings.bakery_name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: "Doces artesanais, bolos e kits para festa feitos sob encomenda.",
    },
    icons: {
      icon: "/icon.svg",
      apple: "/icon.svg",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#FDF9F4",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <html lang="pt-BR" className={`${playfair.variable} ${jakarta.variable}`}>
      <body>
        <ToastProvider>
          <SettingsProvider settings={settings}>
            <CartProvider deliveryFee={settings.delivery_fee}>
              <ServiceWorkerRegister />
              {children}
            </CartProvider>
          </SettingsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
