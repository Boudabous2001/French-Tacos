import type { Centimes } from "@/lib/argent";

/** Un choix réutilisable : une viande, une sauce, un supplément, une boisson… */
export interface ChoixItem {
  id: string;
  nom: string;
  /** Prix ajouté au produit (0 pour un choix inclus). */
  prix: Centimes;
  disponible: boolean;
  image?: string;
  /** « vegetarien », « epice »… */
  tags?: string[];
}

/**
 * Liste partagée entre plusieurs produits : passer « Kefta » en rupture
 * la retire d'un coup des tacos, des sandwichs et des assiettes.
 */
export interface ListeChoix {
  id: string;
  nom: string;
  items: ChoixItem[];
}

/** Taille ou formule d'un produit : Simple / Double, Seul / Menu… */
export interface Variante {
  id: string;
  nom: string;
  prix: Centimes;
  detail?: string;
}

/** Une étape de composition affichée dans la fiche produit. */
export interface GroupeOptions {
  /** Clé de la sélection (ex. « viandes »). */
  id: string;
  listeId: string;
  /** Restreint la liste partagée à ces choix (ex. suppléments burger). */
  filtre?: string[];
  titre: string;
  aide?: string;
  min: number;
  max: number;
  /** Bornes propres à une variante (ex. tacos Double : 2 viandes). */
  minParVariante?: Record<string, number>;
  maxParVariante?: Record<string, number>;
  /** Groupe visible seulement pour ces variantes (ex. boisson du menu). */
  siVariante?: string[];
  /** Groupe visible seulement si ce choix est pris dans un autre groupe. */
  siChoix?: { groupe: string; choix: string };
  /** Le même choix peut être pris plusieurs fois (ex. 2 × Kebab). */
  repetition?: boolean;
  /** Les prix des choix sont ignorés : ils sont compris dans le produit. */
  inclus?: boolean;
  /** Choix pré-sélectionnés à l'ouverture de la fiche (ex. formule « Seul »). */
  defaut?: string[];
}

export type Badge = "populaire" | "nouveau" | "vegetarien" | "epice" | "gourmand";

export interface Produit {
  id: string;
  categorieId: string;
  nom: string;
  description: string;
  image: string | null;
  /** Prix quand le produit n'a pas de variante. */
  prix: Centimes;
  variantes: Variante[];
  groupes: GroupeOptions[];
  /** null = information non encore fournie par le restaurant. */
  allergenes: string[] | null;
  badges: Badge[];
  /** Taux de TVA en points de base : 1000 = 10 %, 550 = 5,5 %. */
  tva: number;
  disponible: boolean;
  actif: boolean;
  position: number;
}

export interface Categorie {
  id: string;
  nom: string;
  accroche: string | null;
  image: string | null;
  position: number;
  actif: boolean;
}

export interface Carte {
  categories: Categorie[];
  produits: Produit[];
  listes: Record<string, ListeChoix>;
}

/** Ce que le client a composé pour une ligne du panier. */
export interface Selection {
  varianteId: string | null;
  options: Record<string, string[]>;
}

/** Les 14 allergènes à déclaration obligatoire (règlement INCO 1169/2011). */
export const ALLERGENES = {
  gluten: "Gluten",
  crustaces: "Crustacés",
  oeufs: "Œufs",
  poissons: "Poissons",
  arachides: "Arachides",
  soja: "Soja",
  lait: "Lait",
  fruits_a_coque: "Fruits à coque",
  celeri: "Céleri",
  moutarde: "Moutarde",
  sesame: "Sésame",
  sulfites: "Sulfites",
  lupin: "Lupin",
  mollusques: "Mollusques",
} as const;

export type CleAllergene = keyof typeof ALLERGENES;
