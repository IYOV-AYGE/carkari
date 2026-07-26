// Blog posts — FR-first SEO content. Each post targets a real search query.
export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  body: string[]; // paragraphs
};

export const POSTS: Post[] = [
  {
    slug: "louer-voiture-maroc-guide",
    title: "Louer une voiture au Maroc : le guide complet (2026)",
    description:
      "Documents, caution, assurance, pièges à éviter — tout ce qu'il faut savoir avant de louer une voiture au Maroc.",
    date: "2026-07-20",
    body: [
      "Louer une voiture au Maroc est le meilleur moyen d'explorer le pays à votre rythme — d'Essaouira aux gorges du Dadès. Mais entre les agences internationales chères et les loueurs informels risqués, il faut savoir où mettre les pieds.",
      "Les documents indispensables : un permis de conduire valide depuis au moins un an (le permis international n'est pas obligatoire pour la plupart des nationalités en séjour touristique), une pièce d'identité ou passeport, et une carte bancaire pour la caution. La plupart des agences exigent 21 ans minimum, parfois 23 pour les catégories supérieures.",
      "La caution : comptez de 3 000 à 10 000 MAD selon le véhicule, bloqués sur votre carte ou déposés en espèces. Vérifiez toujours que le montant et les conditions de restitution figurent sur le contrat.",
      "L'assurance : les agences professionnelles incluent la responsabilité civile et une assurance tous risques avec franchise. Demandez le montant de la franchise avant de signer — c'est le chiffre qui compte vraiment en cas de pépin.",
      "Les pièges classiques : état des lieux bâclé (photographiez la voiture sous tous les angles avant de partir), carburant (rendez le réservoir au niveau de départ), kilométrage limité non annoncé, et frais de restitution dans une autre ville non précisés.",
      "Avec CarKari, toutes les agences sont vérifiées (registre de commerce et assurance contrôlés), les prix sont fermes et l'annulation est gratuite pendant 24 h. Vous réservez en ligne avec un simple acompte et payez le reste à la prise du véhicule.",
    ],
  },
  {
    slug: "prix-location-voiture-maroc",
    title: "Combien coûte une location de voiture au Maroc en 2026 ?",
    description:
      "Citadine, SUV, luxe : les vrais prix par catégorie et par ville, et comment payer moins cher.",
    date: "2026-07-15",
    body: [
      "Les prix varient fortement selon la ville, la saison et la catégorie. Voici les fourchettes réalistes constatées sur CarKari en 2026.",
      "Citadines (Dacia Logan, Clio, i10) : 200 à 350 MAD par jour. C'est la catégorie reine au Maroc — parfaite en ville et suffisante pour la plupart des routes touristiques.",
      "Compactes et berlines (Golf, 208) : 320 à 500 MAD par jour. Plus de confort sur autoroute pour les longs trajets Casablanca–Marrakech–Agadir.",
      "SUV (Duster, Tucson, RAV4) : 400 à 800 MAD par jour. Recommandé pour l'Atlas, les pistes du sud et les familles chargées.",
      "Luxe et prestige (Mercedes, Range Rover, Porsche) : de 1 200 à plus de 8 000 MAD par jour pour une Lamborghini. Très demandé pour les mariages et les événements — réservez tôt.",
      "Nos conseils pour payer moins : réservez à l'avance (les prix montent en été et pendant les fêtes), comparez à catégorie égale plutôt qu'au modèle, évitez la prise à l'aéroport quand une agence en ville est moins chère, et privilégiez la boîte manuelle, souvent 20 % moins chère.",
    ],
  },
  {
    slug: "road-trip-maroc-itineraires",
    title: "Road trip au Maroc : 3 itinéraires inoubliables en voiture de location",
    description:
      "La côte atlantique, le grand sud et le circuit impérial : trois itinéraires testés, kilométrages et conseils de conduite.",
    date: "2026-07-10",
    body: [
      "Le Maroc est un pays de road trip. Routes correctes, paysages qui changent toutes les deux heures, et des étapes mythiques. Voici trois itinéraires qui fonctionnent, testés et approuvés.",
      "1. La côte atlantique (Casablanca → Essaouira → Agadir, ~600 km, 4-6 jours) : océan à droite pendant tout le trajet, escale à El Jadida et Oualidia pour les huîtres, Essaouira pour les remparts et le vent, arrivée plages d'Agadir. Une citadine suffit largement.",
      "2. Le grand sud (Marrakech → Aït-Ben-Haddou → gorges du Dadès → Merzouga, ~560 km, 5-7 jours) : le col du Tichka, les kasbahs, les gorges, et les dunes de l'erg Chebbi au bout. Un SUV est recommandé — pas obligatoire, mais vos lombaires vous remercieront.",
      "3. Le circuit impérial (Rabat → Meknès → Fès → retour par Ifrane, ~450 km, 4-5 jours) : histoire, médinas classées et la surprise d'Ifrane, la « Suisse marocaine », avec ses cèdres et ses singes magots.",
      "Conseils de conduite : radars fréquents (respectez scrupuleusement les limitations), évitez de rouler de nuit hors agglomération, et gardez de l'espèce pour les péages d'autoroute. En cas de contrôle, souriez — courtoisie et papiers en règle suffisent.",
      "Toutes les voitures de ces itinéraires se trouvent sur CarKari, auprès d'agences vérifiées dans chaque ville de départ. Réservation en ligne, acompte sécurisé, annulation gratuite 24 h.",
    ],
  },
];
