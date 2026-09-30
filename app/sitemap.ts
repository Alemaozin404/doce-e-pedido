import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();
  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/cardapio`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/monte-sua-festa`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/personalizados`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contato`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
