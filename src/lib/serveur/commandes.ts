import "server-only";

import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, lt, notInArray } from "drizzle-orm";
import { after } from "next/server";

import { base, schema } from "@/db";
import type { AdresseCommande, TvaLigne } from "@/db/schema";
import { euros } from "@/lib/argent";
import { evaluerSelection, texteResume, type ResumeGroupe } from "@/lib/catalogue/prix";
import type { Produit } from "@/lib/catalogue/types";
import {
  LIBELLES_STATUT,
  telephoneE164,
  TRANSITIONS,
  type CommandeValidee,
  type PaiementMode,
  type PaiementStatut,
  type Statut,
} from "@/lib/commande-schema";
import { creneauValide, etatOuverture, instantParis, partiesParis } from "@/lib/horaires";
import { fraisLivraison, trouverZone, type Zone } from "@/lib/livraison";
import type { Reglages } from "@/lib/reglages-type";
import { publierCommande } from "./bus";
import { chargerCarte, chargerReglages } from "./donnees";
import {
  courrielAnnulationClient,
  courrielConfirmationClient,
  courrielNouvelleCommandeRestaurant,
  type CommandeCourriel,
} from "./emails";
import { verifierAdresse } from "./geocodage";
import {
  annulerIntentionPaiement,
  creerIntentionPaiement,
  lireIntentionPaiement,
  modePaiementEnLigne,
  rembourser,
} from "./paiement";

const MINUTE = 60_000;
/** Une commande non payée est abandonnée au bout de ce délai. */
const DELAI_PAIEMENT_MINUTES = 30;

type LigneCommande = typeof schema.lignesCommande.$inferSelect;
type CommandeLigne = typeof schema.commandes.$inferSelect;

export interface Refus {
  ok: false;
  erreur: string;
  champ?: string;
  statutHttp: number;
}

const refus = (erreur: string, statutHttp = 422, champ?: string): Refus => ({ ok: false, erreur, champ, statutHttp });

/** Exécute une tâche après l'envoi de la réponse (e-mails), sans jamais la bloquer. */
function ensuite(tache: () => Promise<unknown>) {
  const surveillee = () => tache().catch((e) => console.error("[tâche différée]", e));
  try {
    after(surveillee);
  } catch {
    void surveillee();
  }
}

function genererJeton() {
  return randomBytes(24).toString("base64url");
}

function ventilerTva(lignes: { tva: number; total: number }[], frais: number): TvaLigne[] {
  const parTaux = new Map<number, number>();
  for (const l of lignes) parTaux.set(l.tva, (parTaux.get(l.tva) ?? 0) + l.total);
  if (frais > 0) parTaux.set(1000, (parTaux.get(1000) ?? 0) + frais);
  return [...parTaux.entries()]
    .sort(([a], [b]) => a - b)
    .map(([taux, ttc]) => {
      const ht = Math.round((ttc * 10000) / (10000 + taux));
      return { taux, base: ht, montant: ttc - ht };
    });
}

function zoneDeCommande(reglages: Reglages, zoneId: string | null): Zone | undefined {
  return reglages.zones.find((z) => z.id === zoneId);
}

/* =====================================================================
 * Création
 * ===================================================================== */

export type ResultatCreation =
  | {
      ok: true;
      jeton: string;
      numero: number;
      total: number;
      paiement: { type: "stripe"; clientSecret: string } | { type: "demo" } | { type: "sur_place" };
    }
  | Refus;

export async function creerCommande(entree: CommandeValidee, site: string): Promise<ResultatCreation> {
  const db = await base();
  const [carte, reglages] = await Promise.all([chargerCarte(db), chargerReglages(db)]);
  const maintenant = new Date();

  if (reglages.commandes.enPause) return refus(reglages.commandes.messagePause, 409);
  if (!reglages.modes[entree.mode]) return refus("Ce mode de commande est momentanément indisponible.", 409, "mode");

  const paiementEnLigne = modePaiementEnLigne();
  if (entree.paiement === "en_ligne" && (!reglages.paiement.enLigne || paiementEnLigne === "indisponible")) {
    return refus("Le paiement en ligne est indisponible pour le moment : choisis le paiement sur place.", 409, "paiement");
  }
  if (entree.paiement === "sur_place" && !reglages.paiement.surPlace) {
    return refus("Le paiement sur place n'est pas proposé : merci de payer en ligne.", 409, "paiement");
  }

  /* --- Articles : prix recalculés ici, jamais repris du navigateur --- */
  const categoriesActives = new Set(carte.categories.filter((c) => c.actif).map((c) => c.id));
  const lignes: { produit: Produit; quantite: number; prixUnitaire: number; varianteNom: string | null; resume: ResumeGroupe[] }[] = [];
  for (const ligne of entree.lignes) {
    const produit = carte.produits.find((p) => p.id === ligne.produitId);
    if (!produit || !produit.actif || !categoriesActives.has(produit.categorieId)) {
      return refus("Un article de ton panier n'est plus à la carte : retire-le pour continuer.", 409, "lignes");
    }
    const evaluation = evaluerSelection(produit, ligne.selection, carte.listes);
    if (!evaluation.ok) return refus(`${produit.nom} : ${evaluation.erreurs[0].message}`, 409, "lignes");
    lignes.push({
      produit,
      quantite: ligne.quantite,
      prixUnitaire: evaluation.prixUnitaire,
      varianteNom: evaluation.varianteNom,
      resume: evaluation.resume,
    });
  }
  const sousTotal = lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);

  /* --- Adresse et zone de livraison --- */
  let zone: Zone | null = null;
  let adresse: AdresseCommande | null = null;
  let frais = 0;
  if (entree.mode === "livraison") {
    const saisie = entree.adresse!;
    const verification = await verifierAdresse(saisie);
    if (verification.statut === "introuvable") {
      return refus("Adresse introuvable : choisis-la dans la liste proposée.", 422, "adresse");
    }
    const reference = verification.statut === "ok" ? verification.adresse : saisie;
    zone = trouverZone(reglages.zones, reference);
    if (!zone) return refus(`Désolé, nous ne livrons pas encore ${reference.ville}.`, 422, "adresse");
    if (sousTotal < zone.minimum) {
      return refus(`Minimum de commande pour la livraison à ${reference.ville} : ${euros(zone.minimum)}.`, 422, "lignes");
    }
    frais = fraisLivraison(zone, sousTotal);
    adresse = {
      ...saisie,
      codePostal: reference.codePostal,
      ville: reference.ville,
      insee: reference.insee,
      latitude: reference.latitude,
      longitude: reference.longitude,
    };
  } else if (sousTotal < reglages.commandes.minimumEmporter) {
    return refus(`Minimum de commande à emporter : ${euros(reglages.commandes.minimumEmporter)}.`, 422, "lignes");
  }

  /* --- Horaire --- */
  const delai = reglages.commandes.preparationMinutes + (zone?.trajetMinutes ?? 0);
  const etat = etatOuverture(maintenant, reglages.horaires, reglages.fermetures);
  let creneau: Date | null = null;
  if (entree.creneau) {
    if (!etat.ouvert && !reglages.commandes.precommande) return refus("Le restaurant est fermé pour le moment.", 409, "creneau");
    const valide = creneauValide(entree.creneau, {
      maintenant,
      semaine: reglages.horaires,
      fermetures: reglages.fermetures,
      delaiMinutes: delai,
      pasMinutes: reglages.commandes.pasCreneauMinutes,
      jours: reglages.commandes.joursAvance,
    });
    if (!valide) return refus("Ce créneau n'est plus disponible : choisis-en un autre.", 409, "creneau");
    creneau = new Date(entree.creneau);
  } else {
    if (!etat.ouvert) return refus("Le restaurant est fermé pour le moment : choisis un créneau.", 409, "creneau");
    if (etat.fermeA && maintenant.getTime() + delai * MINUTE > etat.fermeA.getTime()) {
      return refus("Le service se termine bientôt : choisis un créneau pour plus tard.", 409, "creneau");
    }
  }

  /* --- Enregistrement --- */
  const total = sousTotal + frais;
  const lignesTotal = lignes.map((l) => ({ tva: l.produit.tva, total: l.prixUnitaire * l.quantite }));
  const enLigne = entree.paiement === "en_ligne";
  const statut: Statut = enLigne ? "attente_paiement" : "nouvelle";
  const paiementStatut: PaiementStatut = enLigne ? "en_attente" : "a_encaisser";

  const commande = await db.transaction(async (tx) => {
    const [c] = await tx
      .insert(schema.commandes)
      .values({
        jeton: genererJeton(),
        statut,
        mode: entree.mode,
        clientPrenom: entree.client.prenom,
        clientNom: entree.client.nom,
        clientTelephone: telephoneE164(entree.client.telephone),
        clientEmail: entree.client.email.toLowerCase(),
        adresse,
        zoneId: zone?.id ?? null,
        creneau,
        note: entree.note,
        sousTotal,
        fraisLivraison: frais,
        total,
        tva: ventilerTva(lignesTotal, frais),
        paiementMode: entree.paiement satisfies PaiementMode,
        paiementStatut,
      })
      .returning();
    await tx.insert(schema.lignesCommande).values(
      lignes.map((l) => ({
        commandeId: c.id,
        produitId: l.produit.id,
        nom: l.produit.nom,
        varianteNom: l.varianteNom,
        resume: l.resume,
        prixUnitaire: l.prixUnitaire,
        quantite: l.quantite,
        total: l.prixUnitaire * l.quantite,
        tva: l.produit.tva,
      })),
    );
    await tx.insert(schema.evenementsCommande).values({
      commandeId: c.id,
      statut,
      message: enLigne ? "Commande créée, en attente du paiement en ligne" : "Commande reçue, paiement sur place",
      auteur: "client",
    });
    return c;
  });

  if (!enLigne) {
    await annoncerNouvelleCommande(commande.id, site);
    return { ok: true, jeton: commande.jeton, numero: commande.numero, total, paiement: { type: "sur_place" } };
  }

  if (paiementEnLigne === "demo") {
    return { ok: true, jeton: commande.jeton, numero: commande.numero, total, paiement: { type: "demo" } };
  }

  try {
    const intention = await creerIntentionPaiement({
      commandeId: commande.id,
      numero: commande.numero,
      montant: total,
      email: commande.clientEmail,
      telephone: commande.clientTelephone,
    });
    await db.update(schema.commandes).set({ stripePaymentIntent: intention.id }).where(eq(schema.commandes.id, commande.id));
    return { ok: true, jeton: commande.jeton, numero: commande.numero, total, paiement: { type: "stripe", clientSecret: intention.clientSecret } };
  } catch (erreur) {
    console.error("[stripe] Création du paiement impossible :", erreur);
    await db
      .update(schema.commandes)
      .set({ statut: "annulee", paiementStatut: "echoue", motifAnnulation: "Paiement en ligne indisponible", majLe: new Date() })
      .where(eq(schema.commandes.id, commande.id));
    return refus("Le paiement en ligne est momentanément indisponible. Réessaie dans un instant ou choisis le paiement sur place.", 502, "paiement");
  }
}

/* =====================================================================
 * Paiement
 * ===================================================================== */

/** Passe une commande payée en « nouvelle » : une seule fois, même si Stripe insiste. */
export async function confirmerPaiement(critere: { commandeId: string } | { paymentIntent: string }, source: string, site: string, montantRecu?: number) {
  const db = await base();
  const filtre = "commandeId" in critere ? eq(schema.commandes.id, critere.commandeId) : eq(schema.commandes.stripePaymentIntent, critere.paymentIntent);
  const [actuelle] = await db.select().from(schema.commandes).where(filtre);
  if (!actuelle || actuelle.statut !== "attente_paiement") return false;
  if (montantRecu !== undefined && montantRecu !== actuelle.total) {
    console.error(`[paiement] Montant incohérent pour la commande ${actuelle.numero} : ${montantRecu} reçu, ${actuelle.total} attendu.`);
    await db.insert(schema.evenementsCommande).values({
      commandeId: actuelle.id,
      statut: actuelle.statut,
      message: `Montant payé incohérent (${euros(montantRecu)}) : vérification manuelle nécessaire`,
      auteur: source,
    });
    return false;
  }
  const maintenant = new Date();
  const [c] = await db
    .update(schema.commandes)
    .set({ statut: "nouvelle", paiementStatut: "paye", payeeLe: maintenant, majLe: maintenant })
    .where(and(eq(schema.commandes.id, actuelle.id), eq(schema.commandes.statut, "attente_paiement")))
    .returning();
  if (!c) return false;
  await db.insert(schema.evenementsCommande).values({ commandeId: c.id, statut: "nouvelle", message: "Paiement en ligne confirmé", auteur: source });
  await annoncerNouvelleCommande(c.id, site);
  return true;
}

export async function signalerPaiementAnnule(paymentIntent: string) {
  const db = await base();
  const [c] = await db
    .update(schema.commandes)
    .set({ statut: "annulee", paiementStatut: "echoue", motifAnnulation: "Paiement non abouti", majLe: new Date() })
    .where(and(eq(schema.commandes.stripePaymentIntent, paymentIntent), eq(schema.commandes.statut, "attente_paiement")))
    .returning();
  if (c) {
    await db.insert(schema.evenementsCommande).values({ commandeId: c.id, statut: "annulee", message: "Paiement non abouti", auteur: "stripe" });
  }
}

/** Filet de sécurité si le webhook tarde : on demande directement à Stripe. */
async function synchroniserPaiement(c: CommandeLigne, site: string) {
  if (c.statut !== "attente_paiement" || !c.stripePaymentIntent) return;
  const intention = await lireIntentionPaiement(c.stripePaymentIntent).catch(() => null);
  if (intention?.status === "succeeded") {
    await confirmerPaiement({ commandeId: c.id }, "verification", site, intention.amount_received);
  }
}

/** Paiement simulé (développement uniquement, sans clés Stripe). */
export async function payerEnDemo(jeton: string, site: string) {
  if (modePaiementEnLigne() !== "demo") return false;
  const db = await base();
  const [c] = await db.select().from(schema.commandes).where(eq(schema.commandes.jeton, jeton));
  if (!c) return false;
  return confirmerPaiement({ commandeId: c.id }, "demo", site);
}

/* =====================================================================
 * Annonces (cuisine + e-mails)
 * ===================================================================== */

async function chargerCommandeComplete(id: string) {
  const db = await base();
  const [c] = await db.select().from(schema.commandes).where(eq(schema.commandes.id, id));
  if (!c) return null;
  const lignes = await db.select().from(schema.lignesCommande).where(eq(schema.lignesCommande.commandeId, id)).orderBy(asc(schema.lignesCommande.id));
  return { ...c, lignes };
}

function pourCourriel(c: CommandeLigne & { lignes: LigneCommande[] }): CommandeCourriel {
  return {
    numero: c.numero,
    jeton: c.jeton,
    mode: c.mode,
    clientPrenom: c.clientPrenom,
    clientEmail: c.clientEmail,
    clientTelephone: c.clientTelephone,
    adresse: c.adresse,
    creneau: c.creneau,
    note: c.note,
    sousTotal: c.sousTotal,
    fraisLivraison: c.fraisLivraison,
    total: c.total,
    paiementMode: c.paiementMode,
    lignes: c.lignes.map((l) => ({ nom: l.nom, varianteNom: l.varianteNom, details: texteResume(l.resume), quantite: l.quantite, total: l.total })),
  };
}

async function annoncerNouvelleCommande(id: string, site: string) {
  const c = await chargerCommandeComplete(id);
  if (!c) return;
  publierCommande({ id: c.id, numero: c.numero, statut: c.statut as Statut, arrivee: true });
  ensuite(async () => {
    const reglages = await chargerReglages(await base());
    const restaurant = `${reglages.restaurant.nom} · ${reglages.restaurant.adresse}, ${reglages.restaurant.codePostal} ${reglages.restaurant.ville} · ${reglages.restaurant.telephone}`;
    await Promise.all([
      courrielConfirmationClient(pourCourriel(c), `${site}/suivi/${c.jeton}`, restaurant),
      courrielNouvelleCommandeRestaurant(pourCourriel(c), `${site}/admin/commandes`, process.env.EMAIL_RESTAURANT ?? reglages.restaurant.email),
    ]);
  });
}

/* =====================================================================
 * Suivi client
 * ===================================================================== */

export interface SuiviPublic {
  numero: number;
  statut: Statut;
  libelleStatut: string;
  mode: string;
  creneau: string | null;
  pretePrevueA: string | null;
  creeLe: string;
  clientPrenom: string;
  adresse: string | null;
  paiementMode: string;
  paiementStatut: string;
  motifAnnulation: string | null;
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  lignes: { nom: string; varianteNom: string | null; details: string; quantite: number; total: number }[];
  etapes: { statut: string; le: string }[];
}

export async function lireSuivi(jeton: string, site: string): Promise<SuiviPublic | null> {
  const db = await base();
  let [c] = await db.select().from(schema.commandes).where(eq(schema.commandes.jeton, jeton));
  if (!c) return null;
  if (c.statut === "attente_paiement") {
    await synchroniserPaiement(c, site);
    [c] = await db.select().from(schema.commandes).where(eq(schema.commandes.id, c.id));
  }
  const [lignes, evenements] = await Promise.all([
    db.select().from(schema.lignesCommande).where(eq(schema.lignesCommande.commandeId, c.id)).orderBy(asc(schema.lignesCommande.id)),
    db.select().from(schema.evenementsCommande).where(eq(schema.evenementsCommande.commandeId, c.id)).orderBy(asc(schema.evenementsCommande.creeLe)),
  ]);
  return {
    numero: c.numero,
    statut: c.statut as Statut,
    libelleStatut: LIBELLES_STATUT[c.statut as Statut],
    mode: c.mode,
    creneau: c.creneau?.toISOString() ?? null,
    pretePrevueA: c.pretePrevueA?.toISOString() ?? null,
    creeLe: c.creeLe.toISOString(),
    clientPrenom: c.clientPrenom,
    adresse: c.adresse ? c.adresse.libelle : null,
    paiementMode: c.paiementMode,
    paiementStatut: c.paiementStatut,
    motifAnnulation: c.motifAnnulation,
    sousTotal: c.sousTotal,
    fraisLivraison: c.fraisLivraison,
    total: c.total,
    lignes: lignes.map((l) => ({ nom: l.nom, varianteNom: l.varianteNom, details: texteResume(l.resume), quantite: l.quantite, total: l.total })),
    etapes: evenements.map((e) => ({ statut: e.statut, le: e.creeLe.toISOString() })),
  };
}

/* =====================================================================
 * Cuisine / back-office
 * ===================================================================== */

export interface CommandeCuisine {
  id: string;
  numero: number;
  statut: Statut;
  mode: string;
  clientPrenom: string;
  clientNom: string;
  clientTelephone: string;
  adresse: AdresseCommande | null;
  creneau: string | null;
  note: string;
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  paiementMode: string;
  paiementStatut: string;
  preparationMinutes: number | null;
  pretePrevueA: string | null;
  motifAnnulation: string | null;
  creeLe: string;
  lignes: { id: number; nom: string; varianteNom: string | null; resume: ResumeGroupe[]; quantite: number; total: number }[];
}

function pourCuisine(c: CommandeLigne, lignes: LigneCommande[]): CommandeCuisine {
  return {
    id: c.id,
    numero: c.numero,
    statut: c.statut as Statut,
    mode: c.mode,
    clientPrenom: c.clientPrenom,
    clientNom: c.clientNom,
    clientTelephone: c.clientTelephone,
    adresse: c.adresse,
    creneau: c.creneau?.toISOString() ?? null,
    note: c.note,
    sousTotal: c.sousTotal,
    fraisLivraison: c.fraisLivraison,
    total: c.total,
    paiementMode: c.paiementMode,
    paiementStatut: c.paiementStatut,
    preparationMinutes: c.preparationMinutes,
    pretePrevueA: c.pretePrevueA?.toISOString() ?? null,
    motifAnnulation: c.motifAnnulation,
    creeLe: c.creeLe.toISOString(),
    lignes: lignes
      .filter((l) => l.commandeId === c.id)
      .map((l) => ({ id: l.id, nom: l.nom, varianteNom: l.varianteNom, resume: l.resume, quantite: l.quantite, total: l.total })),
  };
}

declare global {
  var __frenchTacosDerniereExpiration: number | undefined;
}

/** Annule les paiements abandonnés (au plus une fois par minute). */
async function expirerPaiementsAbandonnes() {
  const maintenant = Date.now();
  if (globalThis.__frenchTacosDerniereExpiration && maintenant - globalThis.__frenchTacosDerniereExpiration < MINUTE) return;
  globalThis.__frenchTacosDerniereExpiration = maintenant;
  const db = await base();
  const expirees = await db
    .update(schema.commandes)
    .set({ statut: "annulee", paiementStatut: "echoue", motifAnnulation: "Paiement non finalisé", majLe: new Date() })
    .where(and(eq(schema.commandes.statut, "attente_paiement"), lt(schema.commandes.creeLe, new Date(maintenant - DELAI_PAIEMENT_MINUTES * MINUTE))))
    .returning({ id: schema.commandes.id, pi: schema.commandes.stripePaymentIntent });
  for (const e of expirees) {
    await db.insert(schema.evenementsCommande).values({ commandeId: e.id, statut: "annulee", message: "Paiement non finalisé", auteur: "systeme" });
    if (e.pi) await annulerIntentionPaiement(e.pi);
  }
}

export interface TableauCuisine {
  commandes: CommandeCuisine[];
  statistiques: { commandes: number; chiffreAffaires: number; panierMoyen: number; enCours: number };
}

export async function lireTableauCuisine(): Promise<TableauCuisine> {
  await expirerPaiementsAbandonnes();
  const db = await base();
  const debutJournee = instantParis(partiesParis(new Date()).date, "00:00");
  const debutFenetre = new Date(Math.min(debutJournee.getTime(), Date.now() - 6 * 60 * MINUTE));

  const commandes = await db
    .select()
    .from(schema.commandes)
    .where(and(notInArray(schema.commandes.statut, ["attente_paiement"]), gte(schema.commandes.creeLe, debutFenetre)))
    .orderBy(desc(schema.commandes.creeLe))
    .limit(200);
  // Les commandes programmées pour plus tard restent visibles même si elles datent d'hier.
  const programmees = await db
    .select()
    .from(schema.commandes)
    .where(and(inArray(schema.commandes.statut, ["nouvelle", "acceptee", "prete", "en_livraison"]), lt(schema.commandes.creeLe, debutFenetre)));
  const toutes = [...commandes, ...programmees];
  const lignes = toutes.length
    ? await db.select().from(schema.lignesCommande).where(inArray(schema.lignesCommande.commandeId, toutes.map((c) => c.id)))
    : [];

  const duJour = toutes.filter((c) => c.creeLe >= debutJournee && c.statut !== "annulee");
  const chiffreAffaires = duJour.reduce((s, c) => s + c.total, 0);
  return {
    commandes: toutes.map((c) => pourCuisine(c, lignes)),
    statistiques: {
      commandes: duJour.length,
      chiffreAffaires,
      panierMoyen: duJour.length ? Math.round(chiffreAffaires / duJour.length) : 0,
      enCours: toutes.filter((c) => ["nouvelle", "acceptee", "prete", "en_livraison"].includes(c.statut)).length,
    },
  };
}

export async function lireCommandeCuisine(id: string): Promise<CommandeCuisine | null> {
  const c = await chargerCommandeComplete(id);
  return c ? pourCuisine(c, c.lignes) : null;
}

export async function changerStatut(
  id: string,
  nouveau: Statut,
  options: { auteur: string; preparationMinutes?: number; motif?: string },
): Promise<{ ok: true } | Refus> {
  const db = await base();
  const [c] = await db.select().from(schema.commandes).where(eq(schema.commandes.id, id));
  if (!c) return refus("Commande introuvable.", 404);
  const actuel = c.statut as Statut;
  if (!TRANSITIONS[actuel].includes(nouveau)) {
    return refus(`Impossible de passer de « ${LIBELLES_STATUT[actuel]} » à « ${LIBELLES_STATUT[nouveau]} ».`, 409);
  }
  if (nouveau === "en_livraison" && c.mode !== "livraison") return refus("Cette commande est à emporter.", 409);

  const maintenant = new Date();
  const maj: Partial<typeof schema.commandes.$inferInsert> = { statut: nouveau, majLe: maintenant };
  let message = LIBELLES_STATUT[nouveau];

  if (nouveau === "acceptee") {
    const reglages = await chargerReglages(db);
    const preparation = Math.min(Math.max(options.preparationMinutes ?? reglages.commandes.preparationMinutes, 5), 180);
    const trajet = c.mode === "livraison" ? (zoneDeCommande(reglages, c.zoneId)?.trajetMinutes ?? 0) : 0;
    const auPlusTot = maintenant.getTime() + preparation * MINUTE;
    const souhaite = c.creneau ? c.creneau.getTime() - trajet * MINUTE : 0;
    maj.accepteeLe = maintenant;
    maj.preparationMinutes = preparation;
    maj.pretePrevueA = new Date(Math.max(auPlusTot, souhaite));
    message = `Acceptée, prête vers ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(maj.pretePrevueA)}`;
  }
  if (nouveau === "prete") maj.preteLe = maintenant;
  if (nouveau === "terminee") {
    maj.termineeLe = maintenant;
    if (c.paiementStatut === "a_encaisser") maj.paiementStatut = "paye";
  }

  let rembourse = false;
  if (nouveau === "annulee") {
    maj.motifAnnulation = options.motif?.slice(0, 300) || "Annulée par le restaurant";
    message = `Annulée : ${maj.motifAnnulation}`;
    if (c.paiementStatut === "paye" && c.stripePaymentIntent) {
      try {
        await rembourser(c.stripePaymentIntent, maj.motifAnnulation);
        maj.paiementStatut = "rembourse";
        rembourse = true;
      } catch (erreur) {
        console.error("[stripe] Remboursement impossible :", erreur);
        return refus("Le remboursement Stripe a échoué : réessaie ou rembourse depuis le tableau de bord Stripe.", 502);
      }
    } else if (c.stripePaymentIntent && c.paiementStatut === "en_attente") {
      await annulerIntentionPaiement(c.stripePaymentIntent);
      maj.paiementStatut = "echoue";
    } else if (c.paiementStatut === "a_encaisser") {
      maj.paiementStatut = "echoue";
    }
  }

  const [majee] = await db
    .update(schema.commandes)
    .set(maj)
    .where(and(eq(schema.commandes.id, id), eq(schema.commandes.statut, actuel)))
    .returning();
  if (!majee) return refus("La commande vient d'être modifiée ailleurs : actualise l'écran.", 409);

  await db.insert(schema.evenementsCommande).values({ commandeId: id, statut: nouveau, message, auteur: options.auteur });
  publierCommande({ id, numero: majee.numero, statut: nouveau, arrivee: false });

  if (nouveau === "annulee") {
    const complete = await chargerCommandeComplete(id);
    if (complete) {
      ensuite(async () => {
        const reglages = await chargerReglages(await base());
        await courrielAnnulationClient(pourCourriel(complete), majee.motifAnnulation ?? "", rembourse, `${reglages.restaurant.nom} · ${reglages.restaurant.telephone}`);
      });
    }
  }
  return { ok: true };
}
