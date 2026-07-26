// Mock data for Step 3 UI work. Replaced by Supabase queries in Step 4+.
// Shape mirrors the DB schema (SPEC.md §4). Prices = integer centimes MAD.

export type MockVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  category: "citadine" | "compacte" | "suv" | "luxe" | "utilitaire";
  transmission: "manuelle" | "automatique";
  fuel: "diesel" | "essence" | "hybride" | "électrique";
  seats: number;
  dailyPriceMad: number;
  city: string;
  agency: string;
  rating: number;
  reviewCount: number;
  /** photo path under /public */
  image: string;
  tone: string;
};

export const CITIES = [
  "Casablanca",
  "Marrakech",
  "Rabat",
  "Agadir",
  "Tanger",
  "Fès",
] as const;

export const CATEGORIES: { key: MockVehicle["category"]; label: string }[] = [
  { key: "citadine", label: "Citadine" },
  { key: "compacte", label: "Compacte" },
  { key: "suv", label: "SUV" },
  { key: "luxe", label: "Luxe" },
  { key: "utilitaire", label: "Utilitaire" },
];

export const MOCK_VEHICLES: MockVehicle[] = [
  { id: "v1", image: "/vehicles/dacia-logan.jpg", make: "Dacia", model: "Logan", year: 2024, category: "citadine", transmission: "manuelle", fuel: "diesel", seats: 5, dailyPriceMad: 25000, city: "Casablanca", agency: "Atlas Cars", rating: 4.7, reviewCount: 128, tone: "from-slate-600 to-slate-800" },
  { id: "v2", image: "/vehicles/renault-clio.jpg", make: "Renault", model: "Clio 5", year: 2024, category: "citadine", transmission: "manuelle", fuel: "diesel", seats: 5, dailyPriceMad: 28000, city: "Marrakech", agency: "Medina Rent", rating: 4.8, reviewCount: 96, tone: "from-orange-500 to-red-700" },
  { id: "v3", image: "/vehicles/hyundai-i20.jpg", make: "Hyundai", model: "i20", year: 2023, category: "citadine", transmission: "automatique", fuel: "essence", seats: 5, dailyPriceMad: 30000, city: "Rabat", agency: "Capital Drive", rating: 4.6, reviewCount: 74, tone: "from-sky-500 to-blue-800" },
  { id: "v4", image: "/vehicles/volkswagen-golf.jpg", make: "Volkswagen", model: "Golf 8", year: 2024, category: "compacte", transmission: "automatique", fuel: "diesel", seats: 5, dailyPriceMad: 45000, city: "Casablanca", agency: "Atlas Cars", rating: 4.9, reviewCount: 210, tone: "from-zinc-500 to-zinc-800" },
  { id: "v5", image: "/vehicles/peugeot-208.jpg", make: "Peugeot", model: "208", year: 2024, category: "citadine", transmission: "automatique", fuel: "essence", seats: 5, dailyPriceMad: 32000, city: "Agadir", agency: "Souss Auto", rating: 4.5, reviewCount: 58, tone: "from-yellow-500 to-amber-700" },
  { id: "v6", image: "/vehicles/hyundai-tucson.jpg", make: "Hyundai", model: "Tucson", year: 2024, category: "suv", transmission: "automatique", fuel: "hybride", seats: 5, dailyPriceMad: 65000, city: "Marrakech", agency: "Medina Rent", rating: 4.8, reviewCount: 143, tone: "from-teal-600 to-emerald-900" },
  { id: "v7", image: "/vehicles/jeep-compass.jpg", make: "Jeep", model: "Compass", year: 2023, category: "suv", transmission: "automatique", fuel: "diesel", seats: 5, dailyPriceMad: 70000, city: "Agadir", agency: "Souss Auto", rating: 4.6, reviewCount: 67, tone: "from-stone-500 to-stone-800" },
  { id: "v8", image: "/vehicles/range-rover-sport.jpg", make: "Range Rover", model: "Evoque", year: 2024, category: "luxe", transmission: "automatique", fuel: "essence", seats: 5, dailyPriceMad: 180000, city: "Casablanca", agency: "Prestige Line", rating: 4.9, reviewCount: 89, tone: "from-neutral-700 to-black" },
  { id: "v9", image: "/vehicles/mercedes-eclass.jpg", make: "Mercedes", model: "Classe E", year: 2024, category: "luxe", transmission: "automatique", fuel: "diesel", seats: 5, dailyPriceMad: 150000, city: "Rabat", agency: "Capital Drive", rating: 4.8, reviewCount: 112, tone: "from-gray-600 to-gray-900" },
  { id: "v10", image: "/vehicles/renault-express.jpg", make: "Renault", model: "Express", year: 2023, category: "utilitaire", transmission: "manuelle", fuel: "diesel", seats: 2, dailyPriceMad: 35000, city: "Tanger", agency: "Detroit Cars", rating: 4.4, reviewCount: 41, tone: "from-indigo-500 to-indigo-900" },
  { id: "v11", image: "/vehicles/renault-kadjar.jpg", make: "Renault", model: "Kadjar", year: 2024, category: "suv", transmission: "manuelle", fuel: "diesel", seats: 5, dailyPriceMad: 40000, city: "Fès", agency: "Saïss Rent", rating: 4.7, reviewCount: 83, tone: "from-lime-600 to-green-900" },
  { id: "v12", image: "/vehicles/kia-picanto.jpg", make: "Kia", model: "Picanto", year: 2024, category: "citadine", transmission: "automatique", fuel: "essence", seats: 4, dailyPriceMad: 24000, city: "Tanger", agency: "Detroit Cars", rating: 4.5, reviewCount: 52, tone: "from-rose-500 to-rose-900" },
];

export const COMMISSION_RATE = 0.175;

export function formatMad(centimes: number): string {
  return `${(centimes / 100).toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD`;
}
