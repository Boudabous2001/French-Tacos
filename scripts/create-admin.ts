/**
 * Crée un compte du back-office, ou réinitialise son mot de passe s'il existe.
 *
 *   npm run admin:create -- gerant@restaurant.fr "Prénom Nom"
 *
 * Le mot de passe est généré aléatoirement et affiché une seule fois.
 * En production (Docker) :
 *   docker compose exec site node scripts/create-admin.mjs gerant@restaurant.fr "Prénom Nom"
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { base, schema } from "../src/db";

async function principal() {
  const [email, nom = "Gérant"] = process.argv.slice(2);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage : npm run admin:create -- email@exemple.fr "Prénom Nom"');
    process.exit(1);
  }
  const motDePasse = randomBytes(15).toString("base64url");
  const empreinte = await bcrypt.hash(motDePasse, 12);
  const db = await base();
  const adresse = email.trim().toLowerCase();
  const [existant] = await db.select().from(schema.administrateurs).where(eq(schema.administrateurs.email, adresse));

  if (existant) {
    await db.update(schema.administrateurs).set({ motDePasse: empreinte, actif: true }).where(eq(schema.administrateurs.id, existant.id));
    await db.delete(schema.sessionsAdmin).where(eq(schema.sessionsAdmin.adminId, existant.id));
    console.info(`Mot de passe réinitialisé pour ${adresse} (sessions ouvertes fermées).`);
  } else {
    await db.insert(schema.administrateurs).values({ email: adresse, nom, motDePasse: empreinte, role: "gerant" });
    console.info(`Compte créé pour ${adresse}.`);
  }
  console.info(`Mot de passe (à transmettre de façon sûre, il ne sera plus affiché) : ${motDePasse}`);
  process.exit(0);
}

principal().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
