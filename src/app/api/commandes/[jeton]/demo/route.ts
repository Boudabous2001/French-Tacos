import { payerEnDemo } from "@/lib/serveur/commandes";
import { modePaiementEnLigne } from "@/lib/serveur/paiement";
import { erreurJson, origineAutorisee, urlSite } from "@/lib/serveur/securite";

/** Paiement simulé : n'existe que sans clés Stripe, hors production. */
export async function POST(requete: Request, contexte: RouteContext<"/api/commandes/[jeton]/demo">) {
  if (modePaiementEnLigne() !== "demo") return erreurJson("Paiement de démonstration désactivé.", 404);
  if (!origineAutorisee(requete.headers)) return erreurJson("Origine de la requête refusée.", 403);
  const { jeton } = await contexte.params;
  const ok = await payerEnDemo(jeton, urlSite(requete.headers));
  if (!ok) return erreurJson("Commande introuvable ou déjà payée.", 409);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
