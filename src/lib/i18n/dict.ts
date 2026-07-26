// UI dictionaries. FR is the reference. Keep keys flat-ish and in sync.
// Arabic (ar) will be added as a third dictionary later (SPEC.md P2).

export type Lang = "fr" | "en";

const fr = {
  nav: { cars: "Voitures", cities: "Villes", partner: "Devenir partenaire", login: "Connexion", logout: "Déconnexion" },
  hero: {
    title: "La location réinventée,",
    titleAccent: "partout au Maroc",
    sub: "Des agences vérifiées, des prix clairs. Réservez avec un simple acompte — le reste à la prise du véhicule.",
  },
  search: { city: "Ville", allCities: "Toutes les villes", from: "Départ", to: "Retour", btn: "Rechercher" },
  cats: { all: "Tous", citadine: "Citadine", compacte: "Compacte", suv: "SUV", luxe: "Luxe", utilitaire: "Utilitaire" },
  rows: {
    popular: "Populaires à {city}",
    suvIn: "SUV à {city}",
    luxury: "Luxe et prestige",
    budget: "Petits budgets",
    vans: "Utilitaires et minibus",
    seeAll: "Tout voir",
  },
  cities: "Par ville",
  how: {
    title: "Comment ça marche",
    steps: [
      ["1. Choisissez", "Comparez les voitures d'agences vérifiées dans votre ville."],
      ["2. Réservez", "Payez un acompte en ligne sécurisé pour bloquer vos dates."],
      ["3. Roulez", "Réglez le solde à la prise du véhicule, directement à l'agence."],
    ] as [string, string][],
  },
  cta: {
    title: "Vous êtes une agence de location ?",
    sub: "Mettez votre flotte en ligne sur CarKari et recevez des réservations sans effort. Inscription gratuite, commission uniquement sur les locations réalisées.",
    btn: "Devenir partenaire",
  },
  card: { perDay: "/ jour", seats: "places", verified: "vérifiée" },
  banner: { text: "Lancement CarKari — annulation gratuite 24 h sur toutes les réservations.", link: "En savoir plus" },
  auth: {
    login: "Connexion", signup: "Créer un compte", fullName: "Nom complet",
    email: "Email", password: "Mot de passe", submitLogin: "Se connecter",
    submitSignup: "Créer mon compte",
    agencyQ: "Agence de location ?", agencyLink: "Devenez partenaire",
    agencyNote: "— créez d'abord un compte, nous vous contactons ensuite.",
  },
  results: { count: "{n} véhicule(s)", inMorocco: "au Maroc", at: "à", none: "Aucun véhicule pour ces critères. Essayez une autre ville ou catégorie." },
  filters: {
    allPrices: "Tous les prix", under: "Moins de 350 MAD/j", mid: "350 – 1 000 MAD/j", high: "1 000 – 3 000 MAD/j", lux: "3 000+ MAD/j",
    anyTrans: "Toute boîte", manual: "Manuelle", auto: "Automatique",
    sort: "Tri : pertinence", priceAsc: "Prix croissant", priceDesc: "Prix décroissant", rating: "Meilleures notes",
    apply: "Filtrer", reset: "Réinitialiser",
  },
  footer: {
    tagline: "La location de voiture au Maroc, auprès d'agences vérifiées.",
    col1: "CarKari", col2: "Aide et confiance", col3: "Villes",
    links1: [["/search", "Rechercher une voiture"], ["/mariages", "Voitures de mariage"], ["/carculator", "Carculator — estimez votre budget"], ["/blog", "Blog"], ["/about", "À propos"], ["/partenaires", "Devenir agence partenaire"], ["/carrieres", "Carrières"], ["/presse", "Presse"]] as [string, string][],
    links2: [["/aide", "Centre d'aide"], ["/confiance", "Confiance et sécurité"], ["/assurance", "Assurance"], ["/contact", "Contact"], ["/conditions", "Conditions d'utilisation"], ["/confidentialite", "Confidentialité"]] as [string, string][],
  },
};

const en: typeof fr = {
  nav: { cars: "Cars", cities: "Cities", partner: "Become a partner", login: "Sign in", logout: "Sign out" },
  hero: {
    title: "Rental reinvented,",
    titleAccent: "all across Morocco",
    sub: "Verified agencies, transparent prices. Book with a simple deposit — pay the rest at pickup.",
  },
  search: { city: "City", allCities: "All cities", from: "Pick-up", to: "Return", btn: "Search" },
  cats: { all: "All", citadine: "City car", compacte: "Compact", suv: "SUV", luxe: "Luxury", utilitaire: "Van" },
  rows: {
    popular: "Popular in {city}",
    suvIn: "SUVs in {city}",
    luxury: "Luxury and prestige",
    budget: "Budget friendly",
    vans: "Vans and minibuses",
    seeAll: "See all",
  },
  cities: "By city",
  how: {
    title: "How it works",
    steps: [
      ["1. Choose", "Compare cars from verified agencies in your city."],
      ["2. Book", "Pay a secure online deposit to lock your dates."],
      ["3. Drive", "Pay the balance at pickup, directly to the agency."],
    ] as [string, string][],
  },
  cta: {
    title: "Are you a rental agency?",
    sub: "Put your fleet on CarKari and receive bookings effortlessly. Free signup, commission only on completed rentals.",
    btn: "Become a partner",
  },
  card: { perDay: "/ day", seats: "seats", verified: "verified" },
  banner: { text: "CarKari launch — free 24h cancellation on all bookings.", link: "Learn more" },
  auth: {
    login: "Sign in", signup: "Create account", fullName: "Full name",
    email: "Email", password: "Password", submitLogin: "Sign in",
    submitSignup: "Create my account",
    agencyQ: "Rental agency?", agencyLink: "Become a partner",
    agencyNote: "— create an account first, we'll contact you after.",
  },
  results: { count: "{n} vehicle(s)", inMorocco: "in Morocco", at: "in", none: "No vehicles match these criteria. Try another city or category." },
  filters: {
    allPrices: "All prices", under: "Under 350 MAD/day", mid: "350 – 1,000 MAD/day", high: "1,000 – 3,000 MAD/day", lux: "3,000+ MAD/day",
    anyTrans: "Any gearbox", manual: "Manual", auto: "Automatic",
    sort: "Sort: relevance", priceAsc: "Price: low to high", priceDesc: "Price: high to low", rating: "Top rated",
    apply: "Filter", reset: "Reset",
  },
  footer: {
    tagline: "Car rental in Morocco, from verified agencies.",
    col1: "CarKari", col2: "Help and trust", col3: "Cities",
    links1: [["/search", "Find a car"], ["/mariages", "Wedding cars"], ["/carculator", "Carculator — estimate your budget"], ["/blog", "Blog"], ["/about", "About"], ["/partenaires", "Become a partner agency"], ["/carrieres", "Careers"], ["/presse", "Press"]] as [string, string][],
    links2: [["/aide", "Help center"], ["/confiance", "Trust and safety"], ["/assurance", "Insurance"], ["/contact", "Contact"], ["/conditions", "Terms of use"], ["/confidentialite", "Privacy"]] as [string, string][],
  },
};

export const DICTS: Record<Lang, typeof fr> = { fr, en };
export type Dict = typeof fr;

/** Countries that get French by default; everyone else gets English. */
export const FR_COUNTRIES = new Set([
  "FR", "MA", "DZ", "TN", "BE", "CH", "LU", "MC", "SN", "CI", "CM", "GA", "ML",
  "BF", "NE", "TG", "BJ", "GN", "CD", "CG", "MG", "HT",
]);
