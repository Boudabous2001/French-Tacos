import { commandeSchema } from "@/lib/commande-schema";
import { creerCommande } from "@/lib/serveur/commandes";
import { erreurJson, ipClient, limiter, origineAutorisee, urlSite } from "@/lib/serveur/securite";

export async function POST(requete: Request) {
  if (!origineAutorisee(requete.headers)) return erreurJson("Origine de la requête refusée.", 403);

  const ip = ipClient(requete.headers);
  const limite = limiter(`commande:${ip}`, 8, 600);
  if (!limite.autorise) {
    return erreurJson("Trop de commandes en peu de temps : réessaie dans quelques minutes.", 429, {
      reessayerDans: limite.reessayerDansSecondes,
    });
  }

  if (Number(requete.headers.get("content-length") ?? 0) > 50_000) return erreurJson("Commande trop volumineuse.", 413);

  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return erreurJson("Requête illisible.", 400);
  }

  const analyse = commandeSchema.safeParse(corps);
  if (!analyse.success) {
    const probleme = analyse.error.issues[0];
    return erreurJson(probleme.message, 422, { champ: probleme.path.join(".") });
  }

  try {
    const resultat = await creerCommande(analyse.data, urlSite(requete.headers));
    if (!resultat.ok) return erreurJson(resultat.erreur, resultat.statutHttp, { champ: resultat.champ });
    return Response.json(resultat, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (erreur) {
    console.error("[commande] Erreur inattendue :", erreur);
    return erreurJson("Une erreur est survenue, ta commande n'a pas été enregistrée. Réessaie dans un instant.", 500);
  }
}
