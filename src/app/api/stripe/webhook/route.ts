import type Stripe from "stripe";

import { base, schema } from "@/db";
import { confirmerPaiement, signalerPaiementAnnule } from "@/lib/serveur/commandes";
import { stripe } from "@/lib/serveur/paiement";
import { erreurJson, urlSite } from "@/lib/serveur/securite";

/**
 * Notifications Stripe. Chaque appel est signé : sans signature valide,
 * rien n'est pris en compte. Le traitement est idempotent (Stripe peut
 * renvoyer le même événement plusieurs fois).
 */
export async function POST(requete: Request) {
  const client = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!client || !secret) return erreurJson("Webhook non configuré.", 503);

  const signature = requete.headers.get("stripe-signature");
  if (!signature) return erreurJson("Signature absente.", 400);

  let evenement: Stripe.Event;
  try {
    evenement = await client.webhooks.constructEventAsync(await requete.text(), signature, secret);
  } catch {
    return erreurJson("Signature invalide.", 400);
  }

  const site = urlSite(requete.headers);
  try {
    switch (evenement.type) {
      case "payment_intent.succeeded": {
        const intention = evenement.data.object;
        await confirmerPaiement({ paymentIntent: intention.id }, "stripe", site, intention.amount_received);
        break;
      }
      case "payment_intent.canceled":
        await signalerPaiementAnnule(evenement.data.object.id);
        break;
      default:
        break;
    }
    const db = await base();
    await db.insert(schema.evenementsStripe).values({ id: evenement.id, type: evenement.type }).onConflictDoNothing();
  } catch (erreur) {
    console.error("[stripe] Traitement du webhook impossible :", erreur);
    // 500 : Stripe réessaiera plus tard.
    return erreurJson("Erreur de traitement.", 500);
  }

  return Response.json({ recu: true });
}
