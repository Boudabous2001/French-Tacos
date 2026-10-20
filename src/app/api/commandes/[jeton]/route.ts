import { JETON_SUIVI } from "@/lib/commande-schema";
import { lireSuivi } from "@/lib/serveur/commandes";
import { erreurJson, ipClient, limiter, urlSite } from "@/lib/serveur/securite";

export async function GET(requete: Request, contexte: RouteContext<"/api/commandes/[jeton]">) {
  const { jeton } = await contexte.params;
  if (!JETON_SUIVI.test(jeton)) return erreurJson("Commande introuvable.", 404);
  if (!limiter(`suivi:${ipClient(requete.headers)}`, 120, 60).autorise) return erreurJson("Trop de requêtes.", 429);

  const suivi = await lireSuivi(jeton, urlSite(requete.headers));
  if (!suivi) return erreurJson("Commande introuvable.", 404);
  return Response.json(suivi, { headers: { "Cache-Control": "no-store" } });
}
