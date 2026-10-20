import type { Metadata } from "next";
import { Suspense } from "react";

import { GestionCarte } from "@/components/admin/GestionCarte";
import { base } from "@/db";
import { exigerAdmin } from "@/lib/serveur/auth";
import { chargerCarte } from "@/lib/serveur/donnees";

export const metadata: Metadata = { title: "Carte" };

export default function PageCarteAdmin() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-creme/50">Chargement de la carte…</p>}>
      <Chargeur />
    </Suspense>
  );
}

async function Chargeur() {
  await exigerAdmin();
  const carte = await chargerCarte(await base());
  return <GestionCarte carte={carte} />;
}
