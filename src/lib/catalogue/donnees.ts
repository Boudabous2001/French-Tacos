/**
 * Carte initiale, reprise de l'affiche du restaurant.
 * Elle remplit la base au premier démarrage ; ensuite tout se modifie depuis
 * le back-office (/admin/carte).
 *
 * À FAIRE VALIDER PAR LE CLIENT : descriptions, boissons proposées, nombre de
 * sauces, allergènes (laissés à null tant qu'ils ne sont pas fournis) et taux
 * de TVA (à confirmer par le comptable).
 */
import type { Categorie, GroupeOptions, ListeChoix, Produit, Variante } from "./types";

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
      { id: "poulet", nom: "Poulet", prix: 0, disponible: true, image: choixImg("viande-poulet") },
      { id: "steak", nom: "Steak", prix: 0, disponible: true, image: choixImg("viande-steak") },
      { id: "tenders", nom: "Tenders", prix: 0, disponible: true, image: choixImg("viande-tenders") },
      { id: "merguez", nom: "Merguez", prix: 0, disponible: true, image: choixImg("viande-merguez"), tags: ["epice"] },
      { id: "cordon-bleu", nom: "Cordon bleu", prix: 0, disponible: true, image: choixImg("viande-cordon-bleu") },
      { id: "falafel", nom: "Falafel", prix: 0, disponible: true, image: choixImg("viande-falafel"), tags: ["vegetarien"] },
      { id: "kefta", nom: "Kefta", prix: 0, disponible: true, image: choixImg("viande-kefta") },
    ],
  },
  {
    id: "sauces",
    nom: "Sauces",
    items: [
      { id: "algerienne", nom: "Algérienne", prix: 0, disponible: true, image: choixImg("sauce-algerienne"), tags: ["epice"] },
      { id: "blanche", nom: "Blanche", prix: 0, disponible: true, image: choixImg("sauce-blanche") },
      { id: "barbecue", nom: "Barbecue", prix: 0, disponible: true, image: choixImg("sauce-barbecue") },
      { id: "harissa", nom: "Harissa", prix: 0, disponible: true, image: choixImg("sauce-harissa"), tags: ["epice"] },
      { id: "curry", nom: "Curry", prix: 0, disponible: true, image: choixImg("sauce-curry") },
      { id: "samourai", nom: "Samouraï", prix: 0, disponible: true, image: choixImg("sauce-samourai"), tags: ["epice"] },
      { id: "ketchup", nom: "Ketchup", prix: 0, disponible: true, image: choixImg("sauce-ketchup") },
      { id: "mayonnaise", nom: "Mayonnaise", prix: 0, disponible: true, image: choixImg("sauce-mayonnaise") },
    ],
  },
  {
    id: "supplements",
    nom: "Suppléments",
    items: [
      { id: "bacon", nom: "Bacon", prix: 100, disponible: true, image: choixImg("sup-bacon") },
      { id: "jambon", nom: "Jambon", prix: 100, disponible: true, image: choixImg("sup-jambon") },
      { id: "raclette", nom: "Raclette", prix: 100, disponible: true, image: choixImg("sup-raclette") },
      { id: "cheddar", nom: "Cheddar", prix: 100, disponible: true, image: choixImg("sup-cheddar") },
      { id: "chevre", nom: "Chèvre", prix: 100, disponible: true, image: choixImg("sup-chevre") },
      { id: "oeuf", nom: "Œuf", prix: 100, disponible: true, image: choixImg("sup-oeuf") },
      { id: "oignons", nom: "Oignons", prix: 100, disponible: true, image: choixImg("sup-oignons") },
      { id: "jalapenos", nom: "Jalapeños", prix: 100, disponible: true, image: choixImg("sup-jalapenos"), tags: ["epice"] },
    ],
  },
  {
    id: "formule-burger",
    nom: "Formule burger",
    items: [
      { id: "seul", nom: "Burger seul", prix: 0, disponible: true },
      { id: "menu", nom: "En menu : frites + boisson", prix: 300, disponible: true, image: img("formule-menu") },
    ],
  },
  {
    id: "boissons",
    nom: "Boissons",
    items: [
      { id: "coca", nom: "Coca-Cola", prix: 0, disponible: true },
      { id: "coca-zero", nom: "Coca-Cola Zéro", prix: 0, disponible: true },
      { id: "fanta", nom: "Fanta Orange", prix: 0, disponible: true },
      { id: "sprite", nom: "Sprite", prix: 0, disponible: true },
      { id: "ice-tea", nom: "Ice Tea pêche", prix: 0, disponible: true },
      { id: "eau", nom: "Eau minérale", prix: 0, disponible: true },
    ],
  },
  {
    id: "plat-enfant",
    nom: "Plat du menu enfant",
    items: [
      { id: "nuggets", nom: "5 Nuggets", prix: 0, disponible: true, image: img("texmex-nuggets") },
      { id: "cheeseburger", nom: "Cheeseburger", prix: 0, disponible: true, image: img("burger-cheese") },
    ],
  },
  {
    id: "boissons-enfant",
    nom: "Boisson du menu enfant",
    items: [
      { id: "capri-sun", nom: "Capri-Sun", prix: 0, disponible: true },
      { id: "eau", nom: "Petite eau", prix: 0, disponible: true },
    ],
  },
];

export const CATEGORIES: Categorie[] = [
  { id: "tacos", nom: "Tacos", accroche: "Un max de goût", image: img("banniere-tacos"), position: 1, actif: true },
  { id: "burgers", nom: "Burgers", accroche: "Des burgers qui font la différence", image: img("banniere-burgers"), position: 2, actif: true },
  { id: "sandwichs", nom: "Sandwichs", accroche: "Des classiques toujours gourmands", image: img("banniere-sandwichs"), position: 3, actif: true },
  { id: "paninis", nom: "Paninis", accroche: "Pressés, dorés, fondants", image: img("panini"), position: 4, actif: true },
  { id: "galettes", nom: "Galettes", accroche: "Roulées minute", image: img("galette"), position: 5, actif: true },
  { id: "assiettes", nom: "Assiettes", accroche: "Des assiettes généreuses", image: img("banniere-assiettes"), position: 6, actif: true },
  { id: "tex-mex", nom: "Tex-Mex", accroche: "Le goût à partager", image: img("texmex-nuggets"), position: 7, actif: true },
  { id: "menu-enfant", nom: "Menu enfant", accroche: "Pour les petits gourmands", image: img("menu-enfant"), position: 8, actif: true },
  { id: "boissons", nom: "Boissons", accroche: "Bien fraîches", image: img("boissons"), position: 9, actif: true },
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

const supplements = (filtre?: string[]): GroupeOptions => ({
  id: "supplements",
  listeId: "supplements",
  filtre,
  titre: "Suppléments",
  aide: "+1,00 € chacun",
  min: 0,
  max: filtre?.length ?? 8,
});

const boissonDuMenu = (condition: Pick<GroupeOptions, "siVariante" | "siChoix">): GroupeOptions => ({
  id: "boisson",
  listeId: "boissons",
  titre: "Ta boisson",
  aide: "Canette 33 cl comprise dans le menu",
  min: 1,
  max: 1,
  inclus: true,
  ...condition,
});

const seulOuMenu: Variante[] = [
  { id: "seul", nom: "Seul", prix: 650 },
  { id: "menu", nom: "Menu", prix: 850, detail: "+ frites + boisson" },
];

/* ---------- Produits ---------- */

let position = 0;
function produit(p: Omit<Produit, "position" | "actif" | "disponible" | "allergenes" | "tva" | "badges" | "variantes" | "groupes" | "prix"> & Partial<Produit>): Produit {
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

const tacos = (id: string, nom: string, viandes: number, prix: number, image: string, badges: Produit["badges"] = []) =>
  produit({
    id,
    categorieId: "tacos",
    nom,
    description: `Galette grillée, frites, sauce fromagère, ${viandes} viande${viandes > 1 ? "s" : ""} et sauce au choix.`,
    image: img(image),
    prix,
    badges,
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
    ],
  });

const burger = (id: string, nom: string, description: string, simple: number, double: number, badges: Produit["badges"] = []) =>
  produit({
    id,
    categorieId: "burgers",
    nom,
    description,
    image: img(id),
    badges,
    variantes: [
      { id: "simple", nom: "Simple", prix: simple },
      { id: "double", nom: "Double", prix: double, detail: "double steak" },
    ],
    groupes: [
      { id: "formule", listeId: "formule-burger", titre: "Seul ou en menu ?", min: 1, max: 1, defaut: ["seul"] },
      boissonDuMenu({ siChoix: { groupe: "formule", choix: "menu" } }),
      sauces(2),
      supplements(["bacon", "cheddar", "raclette", "oeuf", "oignons", "jalapenos"]),
    ],
  });

const roule = (categorieId: string, id: string, nom: string, description: string, image: string, badges: Produit["badges"] = []) =>
  produit({
    id,
    categorieId,
    nom,
    description,
    image: img(image),
    badges,
    variantes: seulOuMenu,
    groupes: [sauces(2), boissonDuMenu({ siVariante: ["menu"] })],
  });

const assiette = (id: string, nom: string, viande: string, prix: number) =>
  produit({
    id,
    categorieId: "assiettes",
    nom,
    description: `${viande}, frites et salade fraîche, sauce au choix.`,
    image: img(id),
    prix,
    groupes: [sauces(2)],
  });

const texmex = (id: string, nom: string, description: string, prix: number, badges: Produit["badges"] = []) =>
  produit({
    id,
    categorieId: "tex-mex",
    nom,
    description,
    image: img(id),
    prix,
    badges,
    groupes: [sauces(1)],
  });

const boisson = (id: string, nom: string, description: string, prix: number, filtre: string[]) =>
  produit({
    id,
    categorieId: "boissons",
    nom,
    description,
    image: img("boissons"),
    prix,
    tva: TVA_BOISSONS,
    groupes: [{ id: "parfum", listeId: "boissons", filtre, titre: "Ta boisson", min: 1, max: 1, inclus: true }],
  });

const dessert = (id: string, nom: string, description: string, prix: number) =>
  produit({ id, categorieId: "desserts", nom, description, image: img(id), prix });

export const PRODUITS: Produit[] = [
  tacos("tacos-simple", "Tacos Simple", 1, 750, "tacos-simple"),
  tacos("tacos-double", "Tacos Double", 2, 950, "tacos-double", ["populaire"]),
  tacos("tacos-triple", "Tacos Triple", 3, 1150, "tacos-triple", ["gourmand"]),

  burger("burger-cheese", "Cheese", "Steak haché, cheddar fondant, salade, tomate, oignons.", 550, 750),
  burger("burger-bacon", "Bacon", "Steak haché, bacon grillé, cheddar, salade, tomate.", 600, 800, ["populaire"]),
  burger("burger-chicken", "Chicken", "Poulet pané croustillant, cheddar, salade, tomate.", 600, 800),
  burger("burger-big", "Big", "Steak haché, cheddar, salade, tomate, oignons, sauce maison.", 650, 850),
  burger("burger-raclette", "Raclette", "Steak haché, raclette fondue, salade, tomate, oignons.", 650, 850, ["gourmand"]),
  burger("burger-chevre", "Chèvre", "Steak haché, chèvre fondant, salade, tomate, oignons.", 650, 850),

  roule("sandwichs", "sandwich-kebab", "Sandwich Kebab", "Viande kebab, salade, tomate, oignons, sauce au choix.", "sandwich-kebab", ["populaire"]),
  roule("sandwichs", "sandwich-poulet", "Sandwich Poulet", "Poulet mariné, salade, tomate, oignons, sauce au choix.", "sandwich-poulet"),
  roule("sandwichs", "sandwich-steak", "Sandwich Steak", "Steak haché, salade, tomate, oignons, sauce au choix.", "sandwich-steak"),
  roule("sandwichs", "sandwich-merguez", "Sandwich Merguez", "Merguez grillées, salade, tomate, oignons, sauce au choix.", "sandwich-merguez", ["epice"]),
  roule("sandwichs", "sandwich-tenders", "Sandwich Tenders", "Tenders de poulet croustillants, salade, tomate, sauce au choix.", "sandwich-tenders"),
  roule("sandwichs", "sandwich-cordon-bleu", "Sandwich Cordon bleu", "Cordon bleu doré, salade, tomate, sauce au choix.", "sandwich-cordon-bleu"),
  roule("sandwichs", "sandwich-kefta", "Sandwich Kefta", "Boulettes de kefta épicées, salade, tomate, oignons, sauce au choix.", "sandwich-kefta"),
  roule("sandwichs", "sandwich-falafel", "Sandwich Falafel", "Falafels maison, salade, tomate, oignons, sauce au choix.", "sandwich-falafel", ["vegetarien"]),

  roule("paninis", "panini-kebab", "Panini Kebab", "Viande kebab et fromage fondu, pressé minute.", "panini"),
  roule("paninis", "panini-poulet", "Panini Poulet", "Poulet et fromage fondu, pressé minute.", "panini"),
  roule("paninis", "panini-3-fromages", "Panini 3 Fromages", "Trois fromages fondus, pressé minute.", "panini", ["vegetarien"]),
  roule("paninis", "panini-jambon", "Panini Jambon", "Jambon et fromage fondu, pressé minute.", "panini"),

  roule("galettes", "galette-kebab", "Galette Kebab", "Galette roulée, viande kebab, crudités, sauce au choix.", "galette"),
  roule("galettes", "galette-poulet", "Galette Poulet", "Galette roulée, poulet, crudités, sauce au choix.", "galette"),
  roule("galettes", "galette-steak", "Galette Steak", "Galette roulée, steak haché, crudités, sauce au choix.", "galette"),
  roule("galettes", "galette-falafel", "Galette Falafel", "Galette roulée, falafels, crudités, sauce au choix.", "galette", ["vegetarien"]),

  assiette("assiette-kebab", "Assiette Kebab", "Viande kebab", 1000),
  assiette("assiette-poulet", "Assiette Poulet", "Poulet mariné", 1000),
  assiette("assiette-steak", "Assiette Steak", "Steaks hachés grillés", 1100),
  assiette("assiette-merguez", "Assiette Merguez", "Merguez grillées", 1100),
  assiette("assiette-kefta", "Assiette Kefta", "Boulettes de kefta", 1100),

  texmex("texmex-nuggets", "Nuggets", "5 pièces de poulet pané.", 450),
  texmex("texmex-tenders", "Tenders", "5 pièces de filet de poulet croustillant.", 500, ["populaire"]),
  texmex("texmex-onion-rings", "Onion Rings", "6 rondelles d'oignon panées.", 450, ["vegetarien"]),
  texmex("texmex-mozza-sticks", "Mozza Sticks", "5 bâtonnets de mozzarella panés.", 450, ["vegetarien"]),
  texmex("texmex-jalapenos", "Jalapeños", "5 piments jalapeños farcis au fromage.", 450, ["epice", "vegetarien"]),

  produit({
    id: "menu-enfant",
    categorieId: "menu-enfant",
    nom: "Menu enfant",
    description: "5 nuggets ou cheeseburger, frites, boisson et compote.",
    image: img("menu-enfant"),
    prix: 650,
    groupes: [
      { id: "plat", listeId: "plat-enfant", titre: "Son plat", min: 1, max: 1, inclus: true },
      { id: "boisson", listeId: "boissons-enfant", titre: "Sa boisson", min: 1, max: 1, inclus: true },
    ],
  }),

  boisson("canette-33", "Canette 33 cl", "Bien fraîche.", 200, ["coca", "coca-zero", "fanta", "sprite", "ice-tea"]),
  boisson("bouteille-50", "Bouteille 50 cl", "Bien fraîche.", 250, ["coca", "fanta", "sprite", "ice-tea", "eau"]),
  boisson("bouteille-150", "Bouteille 1,5 L", "À partager.", 400, ["coca", "coca-zero", "fanta", "sprite", "eau"]),

  dessert("dessert-tarte-daim", "Tarte au Daim", "Biscuit, caramel croquant et chocolat.", 350),
  dessert("dessert-tiramisu", "Tiramisu", "Mascarpone, café et cacao.", 350),
  dessert("dessert-muffin", "Muffin chocolat", "Moelleux, cœur fondant.", 300),
  dessert("dessert-donut", "Donut", "Glaçage rose et vermicelles.", 300),
];
