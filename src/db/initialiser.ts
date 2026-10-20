import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { CATEGORIES, LISTES, PRODUITS } from "@/lib/catalogue/donnees";
import { REGLAGES_PAR_DEFAUT } from "@/lib/reglages-type";
import * as schema from "./schema";

/**
 * Premier démarrage : carte de l'affiche, réglages par défaut et compte
 * gérant (si ADMIN_EMAIL et ADMIN_MOT_DE_PASSE sont fournis).
 * Ne remplace jamais une donnée existante.
 */
export async function preparerBase(db: NodePgDatabase<typeof schema>) {
  const [{ total: nbCategories }] = await db.select({ total: count() }).from(schema.categories);
  if (nbCategories === 0) {
    await db.transaction(async (tx) => {
      await tx.insert(schema.categories).values(CATEGORIES);
      await tx.insert(schema.listesChoix).values(LISTES);
      await tx.insert(schema.produits).values(PRODUITS);
    });
    console.info(`[base] Carte initiale installée : ${PRODUITS.length} produits.`);
  }

  await db.insert(schema.reglages).values({ id: "principal", donnees: REGLAGES_PAR_DEFAUT }).onConflictDoNothing();

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const motDePasse = process.env.ADMIN_MOT_DE_PASSE;
  if (email && motDePasse) {
    const [{ total: nbAdmins }] = await db.select({ total: count() }).from(schema.administrateurs);
    if (nbAdmins === 0) {
      if (motDePasse.length < 12) {
        console.warn("[base] ADMIN_MOT_DE_PASSE trop court (12 caractères minimum) : compte non créé.");
      } else {
        await db.insert(schema.administrateurs).values({
          email,
          nom: process.env.ADMIN_NOM ?? "Gérant",
          motDePasse: await bcrypt.hash(motDePasse, 12),
          role: "gerant",
        });
        console.info(`[base] Compte gérant créé pour ${email}.`);
      }
    }
  }
}
