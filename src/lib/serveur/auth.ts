import "server-only";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { base, schema } from "@/db";

/**
 * Sessions du back-office : jeton aléatoire dans un cookie httpOnly,
 * seule son empreinte SHA-256 est stockée en base (une fuite de la base ne
 * permet pas d'usurper une session).
 */
const DUREE_SESSION_HEURES = 12;
const enProduction = process.env.NODE_ENV === "production";
// Le préfixe __Host- impose HTTPS, le chemin / et l'absence de domaine.
export const COOKIE_SESSION = enProduction ? "__Host-ft_admin" : "ft_admin";

// Empreinte factice : le temps de réponse est le même que l'e-mail existe ou non.
let empreinteFactice: Promise<string> | undefined;
const obtenirEmpreinteFactice = () => (empreinteFactice ??= bcrypt.hash(randomBytes(16).toString("hex"), 12));

export interface Admin {
  id: string;
  email: string;
  nom: string;
  role: string;
}

const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

export async function verifierIdentifiants(email: string, motDePasse: string): Promise<Admin | null> {
  const db = await base();
  const [compte] = await db.select().from(schema.administrateurs).where(eq(schema.administrateurs.email, email.trim().toLowerCase()));
  const valide = await bcrypt.compare(motDePasse, compte?.motDePasse ?? (await obtenirEmpreinteFactice()));
  if (!compte || !valide || !compte.actif) return null;
  return { id: compte.id, email: compte.email, nom: compte.nom, role: compte.role };
}

export async function ouvrirSession(admin: Admin, contexte: { ip: string; navigateur: string }) {
  const db = await base();
  const jeton = randomBytes(32).toString("base64url");
  const expireLe = new Date(Date.now() + DUREE_SESSION_HEURES * 3_600_000);
  await db.insert(schema.sessionsAdmin).values({
    id: empreinte(jeton),
    adminId: admin.id,
    expireLe,
    ip: contexte.ip,
    navigateur: contexte.navigateur.slice(0, 300),
  });
  await db.update(schema.administrateurs).set({ derniereConnexion: new Date() }).where(eq(schema.administrateurs.id, admin.id));
  await db.delete(schema.sessionsAdmin).where(lt(schema.sessionsAdmin.expireLe, new Date()));

  (await cookies()).set(COOKIE_SESSION, jeton, {
    httpOnly: true,
    secure: enProduction,
    sameSite: "lax",
    path: "/",
    expires: expireLe,
    priority: "high",
  });
}

export async function fermerSession() {
  const magasin = await cookies();
  const jeton = magasin.get(COOKIE_SESSION)?.value;
  if (jeton) {
    const db = await base();
    await db.delete(schema.sessionsAdmin).where(eq(schema.sessionsAdmin.id, empreinte(jeton)));
  }
  magasin.delete(COOKIE_SESSION);
}

/** Administrateur connecté, ou null. */
export async function adminCourant(): Promise<Admin | null> {
  const jeton = (await cookies()).get(COOKIE_SESSION)?.value;
  if (!jeton || jeton.length > 100) return null;
  // La validité dépend de l'heure : toujours évaluée à la requête, jamais pré-rendue.
  await connection();
  const db = await base();
  const [ligne] = await db
    .select({
      id: schema.administrateurs.id,
      email: schema.administrateurs.email,
      nom: schema.administrateurs.nom,
      role: schema.administrateurs.role,
      actif: schema.administrateurs.actif,
    })
    .from(schema.sessionsAdmin)
    .innerJoin(schema.administrateurs, eq(schema.administrateurs.id, schema.sessionsAdmin.adminId))
    .where(and(eq(schema.sessionsAdmin.id, empreinte(jeton)), gt(schema.sessionsAdmin.expireLe, new Date())));
  if (!ligne || !ligne.actif) return null;
  return { id: ligne.id, email: ligne.email, nom: ligne.nom, role: ligne.role };
}

/** Pour les pages : renvoie vers la connexion si besoin. */
export async function exigerAdmin(): Promise<Admin> {
  const admin = await adminCourant();
  if (!admin) redirect("/admin/connexion");
  return admin;
}
