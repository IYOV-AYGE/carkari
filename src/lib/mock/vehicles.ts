// Mock data for Step 3 UI work. Replaced by Supabase queries in Step 4+.
// Shape mirrors the DB schema (SPEC.md §4). Prices = integer centimes MAD.

export type MockVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  category: "citadine" | "compacte" | "suv" | "luxe" | "utilitaire" | "quad" | "jetski";
  /** Quads and jet skis are sold by the hour, cars by the day. */
  rentalUnit?: "day" | "hour";
  hourlyPriceMad?: number;
  minHours?: number;
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
  /** all photos (gallery). Mock cars have one. */
  images?: string[];
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
  { key: "quad", label: "Quad / ATV" },
  { key: "jetski", label: "Jet ski" },
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
  { id: "v13", image: "/vehicles/hyundai-i10.jpg", make: "Hyundai", model: "i10", year: 2024, category: "citadine", transmission: "manuelle", fuel: "essence", seats: 4, dailyPriceMad: 22000, city: "Agadir", agency: "Souss Auto", rating: 4.4, reviewCount: 37, tone: "" },
  { id: "v14", image: "/vehicles/dacia-sandero.jpg", make: "Dacia", model: "Sandero", year: 2024, category: "citadine", transmission: "manuelle", fuel: "diesel", seats: 5, dailyPriceMad: 24000, city: "Fès", agency: "Saïss Rent", rating: 4.6, reviewCount: 61, tone: "" },
  { id: "v15", image: "/vehicles/fiat-panda.jpg", make: "Fiat", model: "Panda", year: 2023, category: "citadine", transmission: "manuelle", fuel: "essence", seats: 4, dailyPriceMad: 20000, city: "Marrakech", agency: "Medina Rent", rating: 4.3, reviewCount: 29, tone: "" },
  { id: "v16", image: "/vehicles/seat-arona.jpg", make: "Seat", model: "Arona", year: 2024, category: "suv", transmission: "automatique", fuel: "essence", seats: 5, dailyPriceMad: 38000, city: "Tanger", agency: "Detroit Cars", rating: 4.5, reviewCount: 44, tone: "" },
  { id: "v17", image: "/vehicles/toyota-rav4.jpg", make: "Toyota", model: "RAV4", year: 2024, category: "suv", transmission: "automatique", fuel: "hybride", seats: 5, dailyPriceMad: 70000, city: "Rabat", agency: "Capital Drive", rating: 4.8, reviewCount: 95, tone: "" },
  { id: "v18", image: "/vehicles/toyota-landcruiser.jpg", make: "Toyota", model: "Land Cruiser", year: 2024, category: "suv", transmission: "automatique", fuel: "diesel", seats: 7, dailyPriceMad: 150000, city: "Marrakech", agency: "Atlas Cars", rating: 4.9, reviewCount: 118, tone: "" },
  { id: "v19", image: "/vehicles/audi-q7.jpg", make: "Audi", model: "Q7", year: 2024, category: "luxe", transmission: "automatique", fuel: "diesel", seats: 7, dailyPriceMad: 160000, city: "Casablanca", agency: "Prestige Line", rating: 4.8, reviewCount: 72, tone: "" },
  { id: "v20", image: "/vehicles/audi-a6.jpg", make: "Audi", model: "A6", year: 2024, category: "luxe", transmission: "automatique", fuel: "diesel", seats: 5, dailyPriceMad: 120000, city: "Rabat", agency: "Capital Drive", rating: 4.7, reviewCount: 66, tone: "" },
  { id: "v21", image: "/vehicles/bmw.jpg", make: "BMW", model: "Série 5", year: 2024, category: "luxe", transmission: "automatique", fuel: "diesel", seats: 5, dailyPriceMad: 140000, city: "Casablanca", agency: "Prestige Line", rating: 4.8, reviewCount: 87, tone: "" },
  { id: "v22", image: "/vehicles/mercedes-sclass.jpg", make: "Mercedes", model: "Classe S", year: 2024, category: "luxe", transmission: "automatique", fuel: "essence", seats: 5, dailyPriceMad: 300000, city: "Casablanca", agency: "Prestige Line", rating: 5.0, reviewCount: 41, tone: "" },
  { id: "v23", image: "/vehicles/range-rover-vogue.jpg", make: "Range Rover", model: "Vogue", year: 2024, category: "luxe", transmission: "automatique", fuel: "diesel", seats: 5, dailyPriceMad: 280000, city: "Marrakech", agency: "Atlas Cars", rating: 4.9, reviewCount: 58, tone: "" },
  { id: "v24", image: "/vehicles/porsche-911.jpg", make: "Porsche", model: "911 Carrera", year: 2024, category: "luxe", transmission: "automatique", fuel: "essence", seats: 2, dailyPriceMad: 550000, city: "Casablanca", agency: "Prestige Line", rating: 5.0, reviewCount: 23, tone: "" },
  { id: "v25", image: "/vehicles/porsche-cayenne.jpg", make: "Porsche", model: "Cayenne", year: 2024, category: "luxe", transmission: "automatique", fuel: "hybride", seats: 5, dailyPriceMad: 240000, city: "Marrakech", agency: "Prestige Line", rating: 4.9, reviewCount: 34, tone: "" },
  { id: "v26", image: "/vehicles/bentley.jpg", make: "Bentley", model: "Continental GT", year: 2023, category: "luxe", transmission: "automatique", fuel: "essence", seats: 4, dailyPriceMad: 500000, city: "Casablanca", agency: "Prestige Line", rating: 4.9, reviewCount: 18, tone: "" },
  { id: "v27", image: "/vehicles/lamborghini-urus.jpg", make: "Lamborghini", model: "Urus", year: 2024, category: "luxe", transmission: "automatique", fuel: "essence", seats: 5, dailyPriceMad: 650000, city: "Marrakech", agency: "Prestige Line", rating: 5.0, reviewCount: 15, tone: "" },
  { id: "v28", image: "/vehicles/lamborghini-huracan.jpg", make: "Lamborghini", model: "Huracán", year: 2023, category: "luxe", transmission: "automatique", fuel: "essence", seats: 2, dailyPriceMad: 800000, city: "Casablanca", agency: "Prestige Line", rating: 5.0, reviewCount: 12, tone: "" },
  { id: "v29", image: "/vehicles/maybach.jpg", make: "Mercedes-Maybach", model: "Classe S", year: 2024, category: "luxe", transmission: "automatique", fuel: "essence", seats: 4, dailyPriceMad: 700000, city: "Casablanca", agency: "Prestige Line", rating: 5.0, reviewCount: 9, tone: "" },
  { id: "v30", image: "/vehicles/fiat-doblo.jpg", make: "Fiat", model: "Doblo", year: 2023, category: "utilitaire", transmission: "manuelle", fuel: "diesel", seats: 2, dailyPriceMad: 30000, city: "Casablanca", agency: "Atlas Cars", rating: 4.4, reviewCount: 33, tone: "" },
  { id: "v31", image: "/vehicles/ford-tourneo.jpg", make: "Ford", model: "Tourneo (9 pl.)", year: 2024, category: "utilitaire", transmission: "manuelle", fuel: "diesel", seats: 9, dailyPriceMad: 60000, city: "Agadir", agency: "Souss Auto", rating: 4.6, reviewCount: 48, tone: "" },
  // Quads and jet skis: priced per HOUR, which is how these actually sell.
  { id: "v40", image: "/vehicles/quad-raptor.jpg", make: "Yamaha", model: "Raptor 700", year: 2024, category: "quad", transmission: "automatique", fuel: "essence", seats: 1, dailyPriceMad: 90000, rentalUnit: "hour", hourlyPriceMad: 25000, minHours: 1, city: "Marrakech", agency: "Palmeraie Aventure", rating: 4.8, reviewCount: 64, tone: "from-orange-600 to-amber-800" },
  { id: "v41", image: "/vehicles/quad-cforce.jpg", make: "CFMoto", model: "CForce 520", year: 2023, category: "quad", transmission: "automatique", fuel: "essence", seats: 2, dailyPriceMad: 80000, rentalUnit: "hour", hourlyPriceMad: 20000, minHours: 1, city: "Agadir", agency: "Souss Aventure", rating: 4.6, reviewCount: 38, tone: "from-lime-600 to-green-900" },
  { id: "v42", image: "/vehicles/jetski-seadoo.jpg", make: "Sea-Doo", model: "GTI 130", year: 2024, category: "jetski", transmission: "automatique", fuel: "essence", seats: 3, dailyPriceMad: 200000, rentalUnit: "hour", hourlyPriceMad: 60000, minHours: 1, city: "Agadir", agency: "Atlantic Jet", rating: 4.9, reviewCount: 52, tone: "from-cyan-500 to-blue-900" },
  { id: "v43", image: "/vehicles/jetski-yamaha.jpg", make: "Yamaha", model: "VX Cruiser", year: 2023, category: "jetski", transmission: "automatique", fuel: "essence", seats: 3, dailyPriceMad: 190000, rentalUnit: "hour", hourlyPriceMad: 55000, minHours: 1, city: "Tanger", agency: "Detroit Marine", rating: 4.7, reviewCount: 29, tone: "from-sky-600 to-indigo-900" },
];

export const COMMISSION_RATE = 0.175;

export function formatMad(centimes: number): string {
  return `${(centimes / 100).toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD`;
}
