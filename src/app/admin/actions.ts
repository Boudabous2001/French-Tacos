"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { base, schema } from "@/db";
import { STATUTS, type Statut } from "@/lib/commande-schema";
import { reglagesSchema } from "@/lib/reglages-schema";
import { adminCourant, fermerSession, ouvrirSession, verifierIdentifiants } from "@/lib/serveur/auth";
import { changerStatut } from "@/lib/serveur/commandes";
import { chargerReglages, TAG_CARTE, TAG_REGLAGES } from "@/lib/serveur/donnees";
import { ipClient, limiter, reinitialiserLimite } from "@/lib/serveur/securite";

export type EtatAction = { ok: boolean; message?: string } | null;

/** Chaque action se ré-authentifie : une Server Action est un point d'entrée public. */
async function exigerAdminAction() {
  const admin = await adminCourant();
  if (!admin) throw new Error("Session expirée : reconnecte-toi.");
  return admin;
}

/* ---------------- Connexion ---------------- */

export async function seConnecter(_precedent: EtatAction, donnees: FormData): Promise<EtatAction> {
  const entetes = await headers();
  const ip = ipClient(entetes);
  const email = String(donnees.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  const motDePasse = String(donnees.get("motDePasse") ?? "").slice(0, 200);

  const parIp = limiter(`connexion-ip:${ip}`, 10, 900);
  const parCompte = limiter(`connexion-compte:${email}`, 5, 900);
  if (!parIp.autorise || !parCompte.autorise) {
    const minutes = Math.ceil(Math.max(parIp.reessayerDansSecondes, parCompte.reessayerDansSecondes) / 60);
    return { ok: false, message: `Trop de tentatives. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.` };
  }
  if (!email || !motDePasse) return { ok: false, message: "E-mail et mot de passe requis." };

  const admin = await verifierIdentifiants(email, motDePasse);
  if (!admin) return { ok: false, message: "Identifiants incorrects." };

  reinitialiserLimite(`connexion-compte:${email}`);
  await ouvrirSession(admin, { ip, navigateur: entetes.get("user-agent") ?? "" });
  redirect("/admin/commandes");
}

export async function seDeconnecter() {
  await fermerSession();
  redirect("/admin/connexion");
}

/* ---------------- Commandes ---------------- */

const optionsStatut = z.object({
  preparationMinutes: z.number().int().min(5).max(180).optional(),
  motif: z.string().trim().max(300).optional(),
});

export async function mettreAJourStatut(id: string, statut: Statut, options: z.input<typeof optionsStatut> = {}): Promise<EtatAction> {
  const admin = await exigerAdminAction();
  if (!z.uuid().safeParse(id).success || !STATUTS.includes(statut)) return { ok: false, message: "Requête invalide." };
  const opts = optionsStatut.safeParse(options);
  if (!opts.success) return { ok: false, message: "Options invalides." };
  const resultat = await changerStatut(id, statut, { auteur: admin.nom, ...opts.data });
  return resultat.ok ? { ok: true } : { ok: false, message: resultat.erreur };
}

/* ---------------- Réglages ---------------- */

export async function basculerPause(enPause: boolean): Promise<EtatAction> {
  await exigerAdminAction();
  const db = await base();
  const reglages = await chargerReglages(db);
  reglages.commandes.enPause = Boolean(enPause);
  await db.update(schema.reglages).set({ donnees: reglages, majLe: new Date() }).where(eq(schema.reglages.id, "principal"));
  updateTag(TAG_REGLAGES);
  return { ok: true, message: enPause ? "Commandes en ligne en pause" : "Commandes en ligne réactivées" };
}

export async function enregistrerReglages(donnees: unknown): Promise<EtatAction> {
  await exigerAdminAction();
  const analyse = reglagesSchema.safeParse(donnees);
  if (!analyse.success) {
    const probleme = analyse.error.issues[0];
    return { ok: false, message: `${probleme.path.join(" › ")} : ${probleme.message}` };
  }
  const db = await base();
  await db.update(schema.reglages).set({ donnees: analyse.data, majLe: new Date() }).where(eq(schema.reglages.id, "principal"));
  updateTag(TAG_REGLAGES);
  return { ok: true, message: "Réglages enregistrés" };
}

/* ---------------- Carte ---------------- */

const majProduitSchema = z.object({
  disponible: z.boolean().optional(),
  actif: z.boolean().optional(),
  prix: z.number().int().min(0).max(100_000).optional(),
  prixVariantes: z.record(z.string().max(40), z.number().int().min(0).max(100_000)).optional(),
});

export async function modifierProduit(id: string, modifications: z.input<typeof majProduitSchema>): Promise<EtatAction> {
  await exigerAdminAction();
  const analyse = majProduitSchema.safeParse(modifications);
  if (!analyse.success || !/^[a-z0-9-]{1,80}$/.test(id)) return { ok: false, message: "Modification invalide." };
  const db = await base();
  const [produit] = await db.select().from(schema.produits).where(eq(schema.produits.id, id));
  if (!produit) return { ok: false, message: "Produit introuvable." };

  const { prixVariantes, ...reste } = analyse.data;
  const variantes = prixVariantes
    ? produit.variantes.map((v) => (prixVariantes[v.id] !== undefined ? { ...v, prix: prixVariantes[v.id] } : v))
    : undefined;
  await db
    .update(schema.produits)
    .set({ ...reste, ...(variantes ? { variantes } : {}), majLe: new Date() })
    .where(eq(schema.produits.id, id));
  updateTag(TAG_CARTE);
  return { ok: true };
}

const majChoixSchema = z.object({
  disponible: z.boolean().optional(),
  prix: z.number().int().min(0).max(10_000).optional(),
});

export async function modifierChoix(listeId: string, itemId: string, modifications: z.input<typeof majChoixSchema>): Promise<EtatAction> {
  await exigerAdminAction();
  const analyse = majChoixSchema.safeParse(modifications);
  if (!analyse.success) return { ok: false, message: "Modification invalide." };
  const db = await base();
  const [liste] = await db.select().from(schema.listesChoix).where(eq(schema.listesChoix.id, listeId));
  if (!liste || !liste.items.some((i) => i.id === itemId)) return { ok: false, message: "Choix introuvable." };
  const items = liste.items.map((i) => (i.id === itemId ? { ...i, ...analyse.data } : i));
  await db.update(schema.listesChoix).set({ items }).where(eq(schema.listesChoix.id, listeId));
  updateTag(TAG_CARTE);
  return { ok: true };
}
