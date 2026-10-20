import "server-only";

import Stripe from "stripe";

import { estSiteDeTest } from "@/lib/environnement";

let client: Stripe | null = null;

/** Client Stripe, ou null tant que les clés ne sont pas configurées. */
export function stripe(): Stripe | null {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) return null;
  client ??= new Stripe(cle, {
    appInfo: { name: "French Tacos – commande en ligne" },
    maxNetworkRetries: 2,
    timeout: 15_000,
  });
  return client;
}

/**
 * - stripe : vrai paiement (clés test ou live)
 * - demo : sans clés, en développement ou sur le serveur de démonstration → paiement simulé
 * - indisponible : site réel sans clés → le paiement en ligne est masqué
 */
export type ModePaiementEnLigne = "stripe" | "demo" | "indisponible";

export function modePaiementEnLigne(): ModePaiementEnLigne {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) return "stripe";
  if (process.env.NODE_ENV !== "production" || estSiteDeTest()) return "demo";
  return "indisponible";
}

export async function creerIntentionPaiement(options: {
  commandeId: string;
  numero: number;
  montant: number;
  email: string;
  telephone: string;
}): Promise<{ id: string; clientSecret: string }> {
  const s = stripe();
  if (!s) throw new Error("Stripe n'est pas configuré.");
  const intention = await s.paymentIntents.create(
    {
      amount: options.montant,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      description: `Commande n° ${options.numero} – French Tacos`,
      receipt_email: options.email || undefined,
      metadata: { commande_id: options.commandeId, numero: String(options.numero) },
    },
    { idempotencyKey: `commande-${options.commandeId}` },
  );
  if (!intention.client_secret) throw new Error("Stripe n'a pas renvoyé de secret client.");
  return { id: intention.id, clientSecret: intention.client_secret };
}

export async function lireIntentionPaiement(id: string) {
  const s = stripe();
  if (!s) return null;
  return s.paymentIntents.retrieve(id);
}

export async function annulerIntentionPaiement(id: string) {
  const s = stripe();
  if (!s) return;
  try {
    await s.paymentIntents.cancel(id);
  } catch {
    /* déjà annulée ou déjà payée : rien à faire */
  }
}

export async function rembourser(id: string, motif: string) {
  const s = stripe();
  if (!s) return;
  await s.refunds.create(
    { payment_intent: id, reason: "requested_by_customer", metadata: { motif: motif.slice(0, 450) } },
    { idempotencyKey: `remboursement-${id}` },
  );
}
