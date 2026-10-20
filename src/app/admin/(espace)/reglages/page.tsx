import type { Metadata } from "next";
import { Suspense } from "react";

import { FormulaireReglages } from "@/components/admin/FormulaireReglages";
import { base } from "@/db";
import { exigerAdmin } from "@/lib/serveur/auth";
import { chargerReglages } from "@/lib/serveur/donnees";

export const metadata: Metadata = { title: "Réglages" };

export default function PageReglages() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-creme/50">Chargement des réglages…</p>}>
      <Chargeur />
    </Suspense>
  );
}

async function Chargeur() {
  await exigerAdmin();
  const reglages = await chargerReglages(await base());
  return <FormulaireReglages reglages={reglages} />;
}
