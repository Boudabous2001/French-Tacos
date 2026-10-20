/** Contrat de la commande envoyée par le navigateur, validé à l'identique côté serveur. */
import { z } from "zod";

// Messages de validation en français, côté navigateur comme côté serveur.
z.config(z.locales.fr());

/** Jeton secret du lien de suivi (24 octets en base64url). */
export const JETON_SUIVI = /^[A-Za-z0-9_-]{32}$/;

const identifiant = z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/);

export const REGEX_TELEPHONE = /^(?:(?:\+|00)33[\s.-]*|0)[1-9](?:[\s.-]*\d{2}){4}$/;

/** « 06 12 34 56 78 », « +33 6 12… » → « +33612345678 ». */
export function telephoneE164(telephone: string): string {
  const chiffres = telephone.replace(/[^\d+]/g, "").replace(/^00/, "+");
  if (chiffres.startsWith("+33")) return `+33${chiffres.slice(3).replace(/^0/, "")}`;
  return `+33${chiffres.replace(/^0/, "")}`;
}

/** « +33612345678 » → « 06 12 34 56 78 ». */
export function telephoneLisible(e164: string): string {
  const national = `0${e164.replace(/^\+33/, "")}`;
  return national.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export const ligneSchema = z.object({
  produitId: identifiant,
  selection: z.object({
    varianteId: identifiant.nullable(),
    options: z.record(identifiant, z.array(identifiant).max(20)),
  }),
  quantite: z.number().int().min(1).max(20),
});

export const adresseSchema = z.object({
  libelle: z.string().trim().min(5).max(200),
  numero: z.string().trim().max(20).optional(),
  rue: z.string().trim().max(160).optional(),
  codePostal: z.string().trim().regex(/^\d{5}$/, "Code postal invalide"),
  ville: z.string().trim().min(1).max(100),
  insee: z.string().trim().regex(/^[0-9AB]{5}$/).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  complement: z.string().trim().max(120).default(""),
  instructions: z.string().trim().max(200).default(""),
});

export const commandeSchema = z
  .object({
    mode: z.enum(["livraison", "emporter"]),
    lignes: z.array(ligneSchema).min(1, "Ton panier est vide.").max(40),
    client: z.object({
      prenom: z.string().trim().min(1, "Ton prénom").max(60),
      nom: z.string().trim().max(60).default(""),
      telephone: z.string().trim().regex(REGEX_TELEPHONE, "Numéro de téléphone invalide"),
      email: z.union([z.email("E-mail invalide").max(120), z.literal("")]).default(""),
    }),
    adresse: adresseSchema.nullable(),
    /** null = dès que possible */
    creneau: z.iso.datetime().nullable(),
    note: z.string().trim().max(300).default(""),
    paiement: z.enum(["en_ligne", "sur_place"]),
    cgv: z.literal(true, { error: "Merci d'accepter les conditions générales de vente." }),
  })
  .refine((c) => c.mode === "emporter" || c.adresse !== null, {
    message: "Adresse de livraison manquante.",
    path: ["adresse"],
  });

export type CommandeEntree = z.input<typeof commandeSchema>;
export type CommandeValidee = z.output<typeof commandeSchema>;
export type LigneEntree = z.input<typeof ligneSchema>;

export const STATUTS = [
  "attente_paiement",
  "nouvelle",
  "acceptee",
  "prete",
  "en_livraison",
  "terminee",
  "annulee",
] as const;
export type Statut = (typeof STATUTS)[number];

export const LIBELLES_STATUT: Record<Statut, string> = {
  attente_paiement: "En attente de paiement",
  nouvelle: "Reçue",
  acceptee: "En préparation",
  prete: "Prête",
  en_livraison: "En livraison",
  terminee: "Terminée",
  annulee: "Annulée",
};

/** Étapes autorisées : on ne saute pas d'étape et on ne revient pas en arrière. */
export const TRANSITIONS: Record<Statut, Statut[]> = {
  attente_paiement: ["nouvelle", "annulee"],
  nouvelle: ["acceptee", "annulee"],
  acceptee: ["prete", "en_livraison", "annulee"],
  prete: ["en_livraison", "terminee", "annulee"],
  en_livraison: ["terminee"],
  terminee: [],
  annulee: [],
};

export type PaiementMode = "en_ligne" | "sur_place";
export type PaiementStatut = "en_attente" | "paye" | "a_encaisser" | "rembourse" | "echoue";
