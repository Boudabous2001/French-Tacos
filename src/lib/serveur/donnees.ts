import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { base, schema, type Base } from "@/db";
import type { Carte } from "@/lib/catalogue/types";
import { completerReglages, type Reglages } from "@/lib/reglages-type";

export const TAG_CARTE = "carte";
export const TAG_REGLAGES = "reglages";

export async function chargerCarte(db: Base): Promise<Carte> {
  const [categories, produits, listes] = await Promise.all([
    db.select().from(schema.categories).orderBy(asc(schema.categories.position)),
    db.select().from(schema.produits).orderBy(asc(schema.produits.position)),
    db.select().from(schema.listesChoix),
  ]);
  return {
    categories,
    produits: produits.map(({ majLe: _majLe, ...p }) => p),
    listes: Object.fromEntries(listes.map((l) => [l.id, l])),
  };
}

export async function chargerReglages(db: Base): Promise<Reglages> {
  const [ligne] = await db.select().from(schema.reglages).where(eq(schema.reglages.id, "principal"));
  return completerReglages(ligne?.donnees);
}

/** Carte complète, gardée en cache jusqu'à la prochaine modification dans le back-office. */
export async function lireCarte(): Promise<Carte> {
  "use cache";
  cacheTag(TAG_CARTE);
  cacheLife("hours");
  return chargerCarte(await base());
}

/** Carte visible par les clients : catégories et produits actifs uniquement. */
export async function lireCartePublique(): Promise<Carte> {
  "use cache";
  cacheTag(TAG_CARTE);
  cacheLife("hours");
  const carte = await chargerCarte(await base());
  const categoriesActives = new Set(carte.categories.filter((c) => c.actif).map((c) => c.id));
  return {
    categories: carte.categories.filter((c) => c.actif),
    produits: carte.produits.filter((p) => p.actif && categoriesActives.has(p.categorieId)),
    listes: carte.listes,
  };
}

export async function lireReglages(): Promise<Reglages> {
  "use cache";
  cacheTag(TAG_REGLAGES);
  cacheLife("hours");
  return chargerReglages(await base());
}
