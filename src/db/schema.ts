import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { Badge, GroupeOptions, ChoixItem, Variante } from "@/lib/catalogue/types";
import type { ResumeGroupe } from "@/lib/catalogue/prix";
import type { Reglages } from "@/lib/reglages-type";

const horodatage = (nom: string) => timestamp(nom, { withTimezone: true, mode: "date" });

/* ---------------- Carte ---------------- */

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  accroche: text("accroche"),
  image: text("image"),
  position: integer("position").notNull().default(0),
  actif: boolean("actif").notNull().default(true),
});

export const produits = pgTable(
  "produits",
  {
    id: text("id").primaryKey(),
    categorieId: text("categorie_id")
      .notNull()
      .references(() => categories.id, { onUpdate: "cascade" }),
    nom: text("nom").notNull(),
    description: text("description").notNull().default(""),
    image: text("image"),
    prix: integer("prix").notNull().default(0),
    variantes: jsonb("variantes").$type<Variante[]>().notNull().default([]),
    groupes: jsonb("groupes").$type<GroupeOptions[]>().notNull().default([]),
    allergenes: jsonb("allergenes").$type<string[] | null>(),
    badges: jsonb("badges").$type<Badge[]>().notNull().default([]),
    tva: integer("tva").notNull().default(1000),
    disponible: boolean("disponible").notNull().default(true),
    actif: boolean("actif").notNull().default(true),
    position: integer("position").notNull().default(0),
    majLe: horodatage("maj_le").notNull().defaultNow(),
  },
  (t) => [index("produits_categorie_idx").on(t.categorieId)],
);

export const listesChoix = pgTable("listes_choix", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  items: jsonb("items").$type<ChoixItem[]>().notNull().default([]),
});

/* ---------------- Réglages (une seule ligne) ---------------- */

export const reglages = pgTable("reglages", {
  id: text("id").primaryKey().default("principal"),
  donnees: jsonb("donnees").$type<Partial<Reglages>>().notNull(),
  majLe: horodatage("maj_le").notNull().defaultNow(),
});

/* ---------------- Commandes ---------------- */

export interface AdresseCommande {
  libelle: string;
  numero?: string;
  rue?: string;
  codePostal: string;
  ville: string;
  insee?: string;
  latitude?: number;
  longitude?: number;
  complement: string;
  instructions: string;
}

export interface TvaLigne {
  taux: number;
  base: number;
  montant: number;
}

export const commandes = pgTable(
  "commandes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    numero: serial("numero").notNull().unique(),
    /** Jeton secret du lien de suivi envoyé au client. */
    jeton: text("jeton").notNull().unique(),
    statut: text("statut").notNull(),
    mode: text("mode").notNull(),
    clientPrenom: text("client_prenom").notNull(),
    clientNom: text("client_nom").notNull().default(""),
    clientTelephone: text("client_telephone").notNull(),
    clientEmail: text("client_email").notNull().default(""),
    adresse: jsonb("adresse").$type<AdresseCommande | null>(),
    zoneId: text("zone_id"),
    /** null = dès que possible */
    creneau: horodatage("creneau"),
    note: text("note").notNull().default(""),
    sousTotal: integer("sous_total").notNull(),
    fraisLivraison: integer("frais_livraison").notNull().default(0),
    total: integer("total").notNull(),
    tva: jsonb("tva").$type<TvaLigne[]>().notNull().default([]),
    paiementMode: text("paiement_mode").notNull(),
    paiementStatut: text("paiement_statut").notNull(),
    stripePaymentIntent: text("stripe_payment_intent").unique(),
    preparationMinutes: integer("preparation_minutes"),
    pretePrevueA: horodatage("prete_prevue_a"),
    motifAnnulation: text("motif_annulation"),
    creeLe: horodatage("cree_le").notNull().defaultNow(),
    majLe: horodatage("maj_le").notNull().defaultNow(),
    payeeLe: horodatage("payee_le"),
    accepteeLe: horodatage("acceptee_le"),
    preteLe: horodatage("prete_le"),
    termineeLe: horodatage("terminee_le"),
  },
  (t) => [index("commandes_statut_idx").on(t.statut), index("commandes_cree_le_idx").on(t.creeLe)],
);

export const lignesCommande = pgTable(
  "lignes_commande",
  {
    id: serial("id").primaryKey(),
    commandeId: uuid("commande_id")
      .notNull()
      .references(() => commandes.id, { onDelete: "cascade" }),
    produitId: text("produit_id").notNull(),
    nom: text("nom").notNull(),
    varianteNom: text("variante_nom"),
    resume: jsonb("resume").$type<ResumeGroupe[]>().notNull().default([]),
    prixUnitaire: integer("prix_unitaire").notNull(),
    quantite: integer("quantite").notNull(),
    total: integer("total").notNull(),
    tva: integer("tva").notNull(),
  },
  (t) => [index("lignes_commande_idx").on(t.commandeId)],
);

/** Historique des statuts : qui a fait quoi, quand. */
export const evenementsCommande = pgTable(
  "evenements_commande",
  {
    id: serial("id").primaryKey(),
    commandeId: uuid("commande_id")
      .notNull()
      .references(() => commandes.id, { onDelete: "cascade" }),
    statut: text("statut").notNull(),
    message: text("message").notNull().default(""),
    auteur: text("auteur").notNull().default("systeme"),
    creeLe: horodatage("cree_le").notNull().defaultNow(),
  },
  (t) => [index("evenements_commande_idx").on(t.commandeId)],
);

/* ---------------- Back-office ---------------- */

export const administrateurs = pgTable("administrateurs", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  nom: text("nom").notNull(),
  motDePasse: text("mot_de_passe").notNull(),
  role: text("role").notNull().default("gerant"),
  actif: boolean("actif").notNull().default(true),
  creeLe: horodatage("cree_le").notNull().defaultNow(),
  derniereConnexion: horodatage("derniere_connexion"),
});

export const sessionsAdmin = pgTable(
  "sessions_admin",
  {
    /** Empreinte SHA-256 du jeton : le jeton lui-même n'est jamais stocké. */
    id: text("id").primaryKey(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => administrateurs.id, { onDelete: "cascade" }),
    expireLe: horodatage("expire_le").notNull(),
    creeLe: horodatage("cree_le").notNull().defaultNow(),
    ip: text("ip"),
    navigateur: text("navigateur"),
  },
  (t) => [index("sessions_admin_expire_idx").on(t.expireLe)],
);

/** Événements Stripe déjà traités (un webhook peut arriver plusieurs fois). */
export const evenementsStripe = pgTable("evenements_stripe", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  recuLe: horodatage("recu_le").notNull().default(sql`now()`),
});
