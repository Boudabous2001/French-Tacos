/** Validation des réglages envoyés par le back-office. */
import { z } from "zod";

import { JOURS } from "@/lib/horaires";

const heure = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure au format HH:MM");
const date = z.iso.date();
const centimes = z.number().int().min(0).max(100_000);
const texte = (max: number) => z.string().trim().max(max);
const url = z.union([z.literal(""), z.url({ protocol: /^https$/ }).max(300)]);

const plage = z.object({ debut: heure, fin: heure });

export const reglagesSchema = z.object({
  restaurant: z.object({
    nom: texte(80).min(1),
    slogan: texte(160),
    adresse: texte(160).min(1),
    codePostal: z.string().regex(/^\d{5}$/),
    ville: texte(100).min(1),
    telephone: texte(30).min(6),
    email: z.union([z.literal(""), z.email().max(120)]),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    raisonSociale: texte(160),
    siret: texte(30),
    tvaIntracom: texte(30),
    responsablePublication: texte(100),
  }),
  horaires: z.object(Object.fromEntries(JOURS.map((j) => [j, z.array(plage).max(4)])) as Record<(typeof JOURS)[number], z.ZodArray<typeof plage>>),
  fermetures: z
    .array(z.object({ du: date, au: date, motif: texte(120).optional() }).refine((f) => f.au >= f.du, "La fin doit suivre le début"))
    .max(50),
  commandes: z.object({
    enPause: z.boolean(),
    messagePause: texte(240).min(1),
    precommande: z.boolean(),
    preparationMinutes: z.number().int().min(5).max(180),
    pasCreneauMinutes: z.union([z.literal(10), z.literal(15), z.literal(20), z.literal(30)]),
    joursAvance: z.number().int().min(0).max(7),
    minimumEmporter: centimes,
  }),
  modes: z.object({ livraison: z.boolean(), emporter: z.boolean() }).refine((m) => m.livraison || m.emporter, "Au moins un mode de commande"),
  paiement: z.object({ enLigne: z.boolean(), surPlace: z.boolean() }).refine((p) => p.enLigne || p.surPlace, "Au moins un moyen de paiement"),
  zones: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]{1,40}$/),
        nom: texte(60).min(1),
        communes: z
          .array(
            z.object({
              nom: texte(100).min(1),
              codePostal: z.string().regex(/^\d{5}$/),
              insee: z.string().regex(/^[0-9AB]{5}$/).optional(),
            }),
          )
          .min(1)
          .max(60),
        frais: centimes,
        minimum: centimes,
        gratuiteDes: centimes.nullable(),
        trajetMinutes: z.number().int().min(0).max(120),
        active: z.boolean(),
      }),
    )
    .max(20),
  reseaux: z.object({ instagram: url, facebook: url, tiktok: url, snapchat: url, avisGoogle: url }),
});

export type ReglagesValides = z.output<typeof reglagesSchema>;
