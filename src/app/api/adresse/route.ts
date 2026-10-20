import { trouverZone } from "@/lib/livraison";
import { lireReglages } from "@/lib/serveur/donnees";
import { rechercherAdresses } from "@/lib/serveur/geocodage";
import { erreurJson, ipClient, limiter } from "@/lib/serveur/securite";

/** Autocomplétion d'adresse + zone de livraison correspondante. */
export async function GET(requete: Request) {
  const q = new URL(requete.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3 || q.length > 160) return Response.json({ adresses: [] });
  if (!limiter(`adresse:${ipClient(requete.headers)}`, 60, 60).autorise) return erreurJson("Trop de recherches, patiente un instant.", 429);

  const reglages = await lireReglages();
  try {
    const adresses = await rechercherAdresses(q, reglages.restaurant);
    return Response.json(
      {
        adresses: adresses.map((adresse) => {
          const zone = trouverZone(reglages.zones, adresse);
          return {
            ...adresse,
            zone: zone
              ? { id: zone.id, nom: zone.nom, frais: zone.frais, minimum: zone.minimum, gratuiteDes: zone.gratuiteDes, trajetMinutes: zone.trajetMinutes }
              : null,
          };
        }),
      },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch {
    return erreurJson("La recherche d'adresse est momentanément indisponible.", 503);
  }
}
