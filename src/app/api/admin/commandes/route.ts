import { adminCourant } from "@/lib/serveur/auth";
import { lireTableauCuisine } from "@/lib/serveur/commandes";
import { erreurJson } from "@/lib/serveur/securite";

export async function GET() {
  const admin = await adminCourant();
  if (!admin) return erreurJson("Non connecté.", 401);
  return Response.json(await lireTableauCuisine(), { headers: { "Cache-Control": "no-store" } });
}
