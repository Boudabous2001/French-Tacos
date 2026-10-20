import type { Metadata } from "next";
import { Suspense } from "react";

import { EcranCuisine } from "@/components/admin/EcranCuisine";
import { base } from "@/db";
import { exigerAdmin } from "@/lib/serveur/auth";
import { lireTableauCuisine } from "@/lib/serveur/commandes";
import { chargerReglages } from "@/lib/serveur/donnees";

export const metadata: Metadata = { title: "Commandes" };

export default function PageCommandes() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-creme/50">Chargement des commandes…</p>}>
      <Chargeur />
    </Suspense>
  );
}

async function Chargeur() {
  await exigerAdmin();
  const [tableau, reglages] = await Promise.all([lireTableauCuisine(), chargerReglages(await base())]);
  return <EcranCuisine initial={tableau} preparationDefaut={reglages.commandes.preparationMinutes} />;
}
