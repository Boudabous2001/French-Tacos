/**
 * Carte initiale, reprise des affiches du restaurant (menu reçu le 02/11/2026).
 * Elle remplit la base au premier démarrage ; ensuite tout se modifie depuis
 * le back-office (/admin/carte).
 *
 * À FAIRE CONFIRMER PAR LE CLIENT : nombre de viandes du tacos Maxi (3 supposé),
 * contenu des menus, nombre de sauces, prix d'un sandwich « classique »,
 * allergènes (laissés à null tant qu'ils ne sont pas fournis) et taux de TVA.
 */
import type { Categorie, GroupeOptions, ListeChoix, Produit } from "./types";

const TVA_PLATS = 1000; // 10 % : vente à emporter / livraison à consommer immédiatement
const TVA_BOISSONS = 550; // 5,5 % : boissons en contenant fermé (à confirmer)

const img = (nom: string) => `/images/menu/${nom}.webp`;
const choixImg = (nom: string) => `/images/choix/${nom}.webp`;

export const LISTES: ListeChoix[] = [
  {
    id: "viandes",
    nom: "Viandes",
    items: [
      { id: "kebab", nom: "Kebab", prix: 0, disponible: true, image: choixImg("viande-kebab") },
      { id: "steak", nom: "Steak", prix: 0, disponible: true, image: choixImg("viande-steak") },
      { id: "poulet-curry", nom: "Poulet curry", prix: 0, disponible: true, image: choixImg("viande-poulet") },
      { id: "poulet-tandoori", nom: "Poulet tandoori", prix: 0, disponible: true, image: choixImg("viande-poulet") },
      { id: "falafel", nom: "Falafel", prix: 0, disponible: true, image: choixImg("viande-falafel"), tags: ["vegetarien"] },
      { id: "tenders", nom: "Tenders", prix: 0, disponible: true, image: choixImg("viande-tenders") },
      { id: "nuggets", nom: "Nuggets", prix: 0, disponible: true, image: choixImg("viande-nuggets") },
      { id: "cordon-bleu", nom: "Cordon bleu", prix: 0, disponible: true, image: choixImg("viande-cordon-bleu") },
      { id: "merguez", nom: "Merguez", prix: 0, disponible: true, image: choixImg("viande-merguez") },
      { id: "farmer", nom: "Farmer", prix: 0, disponible: true, image: choixImg("viande-farmer") },
    ],
  },
  {
    id: "sauces",
    nom: "Sauces",
    items: [
      { id: "blanche", nom: "Blanche", prix: 0, disponible: true, image: choixImg("sauce-blanche") },
      { id: "mayonnaise", nom: "Mayonnaise", prix: 0, disponible: true, image: choixImg("sauce-mayonnaise") },
      { id: "ketchup", nom: "Ketchup", prix: 0, disponible: true, image: choixImg("sauce-ketchup") },
      { id: "moutarde", nom: "Moutarde", prix: 0, disponible: true, image: choixImg("sauce-moutarde") },
      { id: "algerienne", nom: "Algérienne", prix: 0, disponible: true, image: choixImg("sauce-algerienne"), tags: ["epice"] },
      { id: "barbecue", nom: "Barbecue", prix: 0, disponible: true, image: choixImg("sauce-barbecue") },
      { id: "harissa", nom: "Harissa", prix: 0, disponible: true, image: choixImg("sauce-harissa"), tags: ["epice"] },
      { id: "andalouse", nom: "Andalouse", prix: 0, disponible: true, image: choixImg("sauce-andalouse") },
      { id: "samourai", nom: "Samouraï", prix: 0, disponible: true, image: choixImg("sauce-samourai"), tags: ["epice"] },
      { id: "marocaine", nom: "Marocaine", prix: 0, disponible: true, image: choixImg("sauce-marocaine") },
      { id: "bresilienne", nom: "Brésilienne", prix: 0, disponible: true, image: choixImg("sauce-bresilienne") },
      { id: "biggy", nom: "Biggy", prix: 0, disponible: true, image: choixImg("sauce-biggy") },
      { id: "chili-thai", nom: "Chili thaï", prix: 0, disponible: true, image: choixImg("sauce-chili-thai"), tags: ["epice"] },
      { id: "curry", nom: "Curry", prix: 0, disponible: true, image: choixImg("sauce-curry") },
      { id: "cheesy-easy", nom: "Cheesy Easy", prix: 0, disponible: true, image: choixImg("sauce-cheesy-easy") },
    ],
  },
  {
    id: "supplements",
    nom: "Suppléments",
    items: [
      { id: "boursin", nom: "Boursin", prix: 100, disponible: true, image: choixImg("sup-boursin") },
      { id: "bonne-vache", nom: "La Bonne Vache", prix: 100, disponible: true, image: choixImg("sup-bonne-vache") },
      { id: "chevre", nom: "Chèvre", prix: 100, disponible: true, image: choixImg("sup-chevre") },
      { id: "cheddar", nom: "Cheddar", prix: 100, disponible: true, image: choixImg("sup-cheddar") },
      { id: "oeuf", nom: "Œuf", prix: 100, disponible: true, image: choixImg("sup-oeuf") },
      { id: "raclette", nom: "Raclette", prix: 100, disponible: true, image: choixImg("sup-raclette") },
      { id: "lardon", nom: "Lardons", prix: 200, disponible: true, image: choixImg("sup-lardon") },
    ],
  },
  {
    id: "gratine",
    nom: "Gratiné (mozzarella + ingrédient)",
    items: [
      { id: "cheddar", nom: "Cheddar", prix: 0, disponible: true, image: choixImg("gratine-cheddar") },
      { id: "raclette", nom: "Raclette", prix: 0, disponible: true, image: choixImg("gratine-raclette") },
      { id: "chevre-miel", nom: "Chèvre-miel", prix: 0, disponible: true, image: choixImg("gratine-chevre-miel") },
      { id: "lardon", nom: "Lardons", prix: 0, disponible: true, image: choixImg("gratine-lardon") },
      { id: "bacon", nom: "Bacon", prix: 0, disponible: true, image: choixImg("gratine-bacon") },
      { id: "poivron", nom: "Poivron", prix: 0, disponible: true, image: choixImg("gratine-poivron") },
    ],
  },
  {
    id: "pain-sandwich",
    nom: "Pain du sandwich",
    items: [
      { id: "pain-maison", nom: "Pain maison", prix: 0, disponible: true, image: choixImg("pain-maison") },
      { id: "galette", nom: "Galette", prix: 0, disponible: true, image: choixImg("pain-galette") },
      { id: "cheese-naan", nom: "Cheese naan", prix: 0, disponible: true, image: choixImg("pain-cheese-naan") },
    ],
  },
  {
    id: "pain-burger",
    nom: "Pain du burger",
    items: [
      { id: "bun", nom: "Pain burger", prix: 0, disponible: true },
      { id: "naan", nom: "Naan burger", prix: 100, disponible: true, image: img("pain-naan-burger") },
    ],
  },
  {
    id: "formule-burger",
    nom: "Formule burger",
    items: [
      { id: "seul", nom: "Burger seul", prix: 0, disponible: true },
      { id: "menu", nom: "En menu : frites + boisson", prix: 200, disponible: true, image: img("formule-menu") },
    ],
  },
  {
    id: "boissons",
    nom: "Canettes",
    items: [
      { id: "coca", nom: "Coca-Cola", prix: 0, disponible: true },
      { id: "coca-zero", nom: "Coca-Cola Zéro", prix: 0, disponible: true },
      { id: "coca-cherry", nom: "Coca-Cola Cherry", prix: 0, disponible: true },
      { id: "ice-tea", nom: "Lipton Ice Tea", prix: 0, disponible: true },
      { id: "oasis", nom: "Oasis Tropical", prix: 0, disponible: true },
      { id: "perrier", nom: "Perrier", prix: 0, disponible: true },
      { id: "schweppes", nom: "Schweppes Agrumes", prix: 0, disponible: true },
    ],
  },
  {
    id: "boissons-bouteille",
    nom: "Bouteilles",
    items: [
      { id: "coca", nom: "Coca-Cola", prix: 0, disponible: true },
      { id: "fanta", nom: "Fanta", prix: 0, disponible: true },
      { id: "sprite", nom: "Sprite", prix: 0, disponible: true },
    ],
  },
  {
    id: "plat-enfant",
    nom: "Plat du menu enfant",
    items: [
      { id: "cheeseburger", nom: "Cheeseburger", prix: 0, disponible: true, image: img("burger-cheese") },
      { id: "kebab", nom: "Kebab", prix: 0, disponible: true, image: choixImg("viande-kebab") },
      { id: "nuggets", nom: "5 Nuggets", prix: 0, disponible: true, image: img("texmex-nuggets") },
    ],
  },
];

export const CATEGORIES: Categorie[] = [
  { id: "tacos", nom: "Tacos", accroche: "Sauce fromagère & frites dedans", image: img("banniere-tacos"), position: 1, actif: true },
  { id: "sandwichs", nom: "Sandwichs", accroche: "Pain maison, galette ou cheese naan", image: img("banniere-sandwichs"), position: 2, actif: true },
  { id: "burgers", nom: "Burgers", accroche: "Steaks 90 g, cheddar fondant", image: img("banniere-burgers"), position: 3, actif: true },
  { id: "kapsalon", nom: "Kapsalon", accroche: "Frites, viande, mozzarella gratinée", image: img("banniere-kapsalon"), position: 4, actif: true },
  { id: "assiettes", nom: "Assiettes", accroche: "Frites, crudités, viandes au choix", image: img("banniere-assiettes"), position: 5, actif: true },
  { id: "paninis", nom: "Paninis", accroche: "Pressés minute", image: img("panini"), position: 6, actif: true },
  { id: "tex-mex", nom: "Tex-Mex", accroche: "À grignoter, à partager", image: img("banniere-texmex"), position: 7, actif: true },
  { id: "menu-enfant", nom: "Menu enfant", accroche: "Pour les petits gourmands", image: img("menu-enfant"), position: 8, actif: true },
  { id: "boissons", nom: "Boissons", accroche: "Bien fraîches", image: img("boisson-canette"), position: 9, actif: true },
  { id: "desserts", nom: "Desserts", accroche: "Pour finir en douceur", image: img("dessert-tiramisu"), position: 10, actif: true },
];

/* ---------- Groupes réutilisés ---------- */

const sauces = (max = 2): GroupeOptions => ({
  id: "sauces",
  listeId: "sauces",
  titre: "Tes sauces",
  aide: max === 1 ? "1 sauce au choix, offerte" : `Jusqu'à ${max} sauces, offertes`,
  min: 0,
  max,
  inclus: true,
});

const supplements = (): GroupeOptions => ({
  id: "supplements",
  listeId: "supplements",
  titre: "Suppléments",
  aide: "+1,00 € (lardons +2,00 €)",
  min: 0,
  max: 7,
});

const boissonDuMenu = (condition: Pick<GroupeOptions, "siVariante" | "siChoix">): GroupeOptions => ({
  id: "boisson",
  listeId: "boissons",
  titre: "Ta boisson",
  aide: "Canette comprise dans le menu",
  min: 1,
  max: 1,
  inclus: true,
  ...condition,
});

/** Kapsalon et assiettes : une canette en option à +1,00 €. */
const canetteEnOption: GroupeOptions = {
  id: "boisson",
  listeId: "boissons",
  titre: "Une canette avec ?",
  aide: "+1,00 €",
  min: 0,
  max: 1,
  prixParChoix: 100,
};

const viandesSelonFormule = (titre: string): GroupeOptions => ({
  id: "viandes",
  listeId: "viandes",
  titre,
  aide: "Selon ta formule, tu peux doubler une viande",
  min: 1,
  max: 3,
  minParVariante: { v1: 1, v2: 2, v3: 3 },
  maxParVariante: { v1: 1, v2: 2, v3: 3 },
  repetition: true,
  inclus: true,
});

/* ---------- Produits ---------- */

let position = 0;
function produit(
  p: Omit<Produit, "position" | "actif" | "disponible" | "allergenes" | "tva" | "badges" | "variantes" | "groupes" | "prix"> & Partial<Produit>,
): Produit {
  position += 1;
  return {
    prix: 0,
    variantes: [],
    groupes: [],
    allergenes: null,
    badges: [],
    tva: TVA_PLATS,
    disponible: true,
    actif: true,
    position,
    ...p,
  };
}

const tacos = (id: string, nom: string, viandes: number, seul: number, menu: number, gratine: number) =>
  produit({
    id,
    categorieId: "tacos",
    nom,
    description: `Sauce fromagère et frites, ${viandes} viande${viandes > 1 ? "s" : ""} et sauce au choix.`,
    image: img(id),
    variantes: [
      { id: "seul", nom: "Seul", prix: seul },
      { id: "menu", nom: "Menu", prix: menu, detail: "+ frites + boisson" },
    ],
    groupes: [
      {
        id: "viandes",
        listeId: "viandes",
        titre: viandes > 1 ? "Tes viandes" : "Ta viande",
        aide: viandes > 1 ? `${viandes} viandes au choix, tu peux doubler` : "1 viande au choix",
        min: viandes,
        max: viandes,
        repetition: true,
        inclus: true,
      },
      sauces(2),
      supplements(),
      {
        id: "gratine",
        listeId: "gratine",
        titre: "Gratiné ?",
        aide: `Mozzarella + 1 ingrédient : +${(gratine / 100).toFixed(2).replace(".", ",")} €`,
        min: 0,
        max: 1,
        prixParChoix: gratine,
      },
      boissonDuMenu({ siVariante: ["menu"] }),
    ],
  });

const sandwich = (id: string, nom: string, description: string, prix: number) =>
  produit({
    id,
    categorieId: "sandwichs",
    nom,
    description,
    image: img(id),
    prix,
    groupes: [
      { id: "pain", listeId: "pain-sandwich", titre: "Ton pain", min: 1, max: 1, inclus: true, defaut: ["pain-maison"] },
      sauces(2),
      supplements(),
    ],
  });

const burger = (id: string, nom: string, description: string, prix: number) =>
  produit({
    id,
    categorieId: "burgers",
    nom,
    description,
    image: img(id),
    prix,
    groupes: [
      { id: "pain", listeId: "pain-burger", titre: "Ton pain", min: 1, max: 1, defaut: ["bun"] },
      { id: "formule", listeId: "formule-burger", titre: "Seul ou en menu ?", min: 1, max: 1, defaut: ["seul"] },
      boissonDuMenu({ siChoix: { groupe: "formule", choix: "menu" } }),
    ],
  });

const selonViandes = (id: string, categorieId: string, nom: string, description: string, prix: [number, number, number]) =>
  produit({
    id,
    categorieId,
    nom,
    description,
    image: img(id),
    variantes: [
      { id: "v1", nom: "1 viande", prix: prix[0] },
      { id: "v2", nom: "2 viandes", prix: prix[1] },
      { id: "v3", nom: "3 viandes", prix: prix[2] },
    ],
    groupes: [viandesSelonFormule("Tes viandes"), sauces(2), canetteEnOption],
  });

const panini = (id: string, nom: string, description: string, badges: Produit["badges"] = []) =>
  produit({
    id,
    categorieId: "paninis",
    nom,
    description,
    image: img("panini"),
    badges,
    variantes: [
      { id: "seul", nom: "Seul", prix: 550 },
      { id: "menu", nom: "Menu", prix: 750, detail: "+ frites + boisson" },
    ],
    groupes: [boissonDuMenu({ siVariante: ["menu"] })],
  });

const texmex = (id: string, nom: string, description: string, prix: number, badges: Produit["badges"] = []) =>
  produit({ id, categorieId: "tex-mex", nom, description, image: img(id), prix, badges });

const petiteGrande = (id: string, nom: string, description: string, petite: number, grande: number, badges: Produit["badges"] = []) =>
  produit({
    id,
    categorieId: "tex-mex",
    nom,
    description,
    image: img(id),
    badges,
    variantes: [
      { id: "petite", nom: "Petite", prix: petite },
      { id: "grande", nom: "Grande", prix: grande },
    ],
  });

const dessert = (id: string, nom: string, description: string) =>
  produit({ id, categorieId: "desserts", nom, description, image: img(id), prix: 350 });

export const PRODUITS: Produit[] = [
  tacos("tacos-simple", "Tacos Simple", 1, 800, 1000, 200),
  tacos("tacos-double", "Tacos Double", 2, 900, 1100, 250),
  tacos("tacos-maxi", "Tacos Maxi", 3, 1100, 1300, 300),

  sandwich("sandwich-cordon-bleu", "Cordon Bleu", "Cordon bleu, cheddar, crudités.", 900),
  sandwich("sandwich-mistral", "Mistral", "Escalope, Boursin, crudités, champignons, crème fraîche.", 1000),
  sandwich("sandwich-extreme", "Extrême", "3 steaks 45 g, cheddar, crudités.", 1000),
  sandwich("sandwich-radical", "Radical", "2 steaks 45 g, galette de pomme de terre, cheddar, crudités.", 1000),

  burger("burger-cheese", "Cheese Burger", "Steak 90 g, cheddar, crudités.", 600),
  burger("burger-double-cheese", "Double Cheese", "2 steaks 90 g, cheddar, crudités.", 700),
  burger("burger-triple-cheese", "Triple Cheese", "3 steaks 90 g, cheddar, crudités.", 800),
  burger("burger-supreme", "Supreme Burger", "2 steaks 90 g, cheddar, œuf, bacon, crudités.", 800),
  burger("burger-baps", "BAP'S", "Chicken, cheddar, galette de pomme de terre, crudités.", 750),
  burger("burger-chicken", "Chicken Burger", "Chicken, cheddar, crudités.", 700),

  selonViandes("kapsalon", "kapsalon", "Kapsalon", "Frites, sauce fromagère, crudités, mozzarella et viande au choix.", [1000, 1200, 1300]),
  selonViandes("assiette", "assiettes", "Assiette", "Frites, sauces, crudités et viande au choix.", [1000, 1200, 1350]),

  panini("panini-3-fromages", "Panini 3 Fromages", "Trois fromages fondus, pressé minute.", ["vegetarien"]),
  panini("panini-steak", "Panini Steak", "Steak haché et fromage fondu, pressé minute."),
  panini("panini-kebab", "Panini Kebab", "Viande kebab et fromage fondu, pressé minute."),

  texmex("texmex-tenders", "Tenders", "4 tenders de poulet croustillants.", 600),
  texmex("texmex-wings", "Wings", "6 ailes de poulet.", 600),
  produit({
    id: "texmex-nuggets",
    categorieId: "tex-mex",
    nom: "Nuggets",
    description: "Nuggets de poulet panés.",
    image: img("texmex-nuggets"),
    variantes: [
      { id: "x6", nom: "6 pièces", prix: 500 },
      { id: "x12", nom: "12 pièces", prix: 800 },
    ],
  }),
  texmex("texmex-mozza-sticks", "Mozza Sticks", "6 bâtonnets de mozzarella panés.", 600, ["vegetarien"]),
  texmex("texmex-camembert", "Bouchées Camembert", "6 bouchées de camembert panées.", 600, ["vegetarien"]),
  petiteGrande("frites", "Frites", "Frites dorées.", 250, 450, ["vegetarien"]),
  petiteGrande("frites-cheddar", "Frites Cheddar", "Frites nappées de cheddar fondu.", 450, 500, ["vegetarien"]),
  petiteGrande("frites-lardon", "Frites Lardons", "Frites, cheddar fondu et lardons.", 500, 650),
  petiteGrande("barquette-kebab", "Barquette Kebab", "Viande kebab servie en barquette.", 600, 800),

  produit({
    id: "menu-enfant",
    categorieId: "menu-enfant",
    nom: "Menu enfant",
    description: "Cheeseburger, kebab ou 5 nuggets, avec frites, Capri-Sun et Kinder Bueno.",
    image: img("menu-enfant"),
    prix: 700,
    groupes: [{ id: "plat", listeId: "plat-enfant", titre: "Son plat", min: 1, max: 1, inclus: true }],
  }),

  produit({ id: "cafe", categorieId: "boissons", nom: "Café", description: "Expresso.", image: img("boisson-cafe"), prix: 150 }),
  produit({
    id: "canette",
    categorieId: "boissons",
    nom: "Canette",
    description: "Bien fraîche.",
    image: img("boisson-canette"),
    prix: 200,
    tva: TVA_BOISSONS,
    groupes: [{ id: "parfum", listeId: "boissons", titre: "Ta canette", min: 1, max: 1, inclus: true }],
  }),
  produit({
    id: "bouteille",
    categorieId: "boissons",
    nom: "Grande bouteille",
    description: "À partager.",
    image: img("boisson-bouteille"),
    prix: 350,
    tva: TVA_BOISSONS,
    groupes: [{ id: "parfum", listeId: "boissons-bouteille", titre: "Ta bouteille", min: 1, max: 1, inclus: true }],
  }),

  dessert("dessert-tarte-daim", "Tarte au Daim", "Biscuit, caramel croquant et chocolat."),
  dessert("dessert-tiramisu", "Tiramisu", "Mascarpone, café et cacao."),
  dessert("dessert-panini-nutella", "Panini Nutella", "Panini pressé fourré au Nutella."),
  dessert("dessert-naan-nutella", "Naan Nutella", "Naan chaud fourré au Nutella."),
  dessert("dessert-naan-miel", "Naan au miel", "Naan chaud au miel."),
];
