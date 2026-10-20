import { connection } from "next/server";

import { reglagesPublics } from "@/lib/reglages-type";
import { lireCartePublique, lireReglages } from "@/lib/serveur/donnees";
import { HydrateurBoutique } from "./HydrateurBoutique";

/** Transmet la carte et les réglages publics aux composants interactifs (panier, fiche produit). */
export async function ChargeurBoutique() {
  await connection();
  const [carte, reglages] = await Promise.all([lireCartePublique(), lireReglages()]);
  return <HydrateurBoutique carte={carte} reglages={reglagesPublics(reglages)} />;
}
