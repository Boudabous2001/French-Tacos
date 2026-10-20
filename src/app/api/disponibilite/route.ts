import { connection } from "next/server";

import { creneauxDisponibles, etatOuverture } from "@/lib/horaires";
import { lireReglages } from "@/lib/serveur/donnees";

/**
 * Ouverture du restaurant et créneaux proposables, calculés à l'heure du
 * serveur (l'horloge du téléphone du client peut être fausse).
 */
export async function GET(requete: Request) {
  await connection();
  const parametres = new URL(requete.url).searchParams;
  const mode = parametres.get("mode") === "livraison" ? "livraison" : "emporter";
  const reglages = await lireReglages();
  const zone = reglages.zones.find((z) => z.id === parametres.get("zone") && z.active);

  const maintenant = new Date();
  const delai = reglages.commandes.preparationMinutes + (mode === "livraison" ? (zone?.trajetMinutes ?? 20) : 0);
  const etat = etatOuverture(maintenant, reglages.horaires, reglages.fermetures);
  const creneaux =
    etat.ouvert || reglages.commandes.precommande
      ? creneauxDisponibles({
          maintenant,
          semaine: reglages.horaires,
          fermetures: reglages.fermetures,
          delaiMinutes: delai,
          pasMinutes: reglages.commandes.pasCreneauMinutes,
          jours: reglages.commandes.joursAvance,
        })
      : [];
  const desQuePossible = etat.ouvert && (!etat.fermeA || maintenant.getTime() + delai * 60_000 <= etat.fermeA.getTime());

  return Response.json(
    {
      maintenant: maintenant.toISOString(),
      ouvert: etat.ouvert,
      fermeA: etat.fermeA?.toISOString() ?? null,
      ouvreA: etat.ouvreA?.toISOString() ?? null,
      enPause: reglages.commandes.enPause,
      messagePause: reglages.commandes.messagePause,
      desQuePossible,
      delaiMinutes: delai,
      creneaux,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
