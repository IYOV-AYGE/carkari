import type { MetadataRoute } from "next";
import { CITIES, MOCK_VEHICLES } from "@/lib/mock/vehicles";

const BASE = "https://www.carkari.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const cities = CITIES.map((c) => ({
    url: `${BASE}/location-voiture/${c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}`,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));
  const vehicles = MOCK_VEHICLES.map((v) => ({
    url: `${BASE}/vehicles/${v.id}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/search`, changeFrequency: "daily", priority: 0.9 },
    ...cities,
    ...vehicles,
    ...["/about", "/aide", "/assurance", "/confiance", "/mariages", "/carculator"].map(
      (p) => ({ url: BASE + p, changeFrequency: "monthly" as const, priority: 0.5 })
    ),
  ];
}
