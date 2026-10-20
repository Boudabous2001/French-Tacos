import { Check } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageTexte } from "@/components/site/PageTexte";
import { ALLERGENES, type CleAllergene } from "@/lib/catalogue/types";
import { lireCartePublique, lireReglages } from "@/lib/serveur/donnees";

export const metadata: Metadata = {
  title: "Allergènes",
  description: "Présence des 14 allergènes réglementaires dans les produits French Tacos.",
  alternates: { canonical: "/allergenes" },
};

const CLES = Object.keys(ALLERGENES) as CleAllergene[];

export default function PageAllergenes() {
  return (
    <PageTexte
      surtitre="Règlement européen INCO"
      titre="Allergènes"
      introduction="Présence des 14 allergènes à déclaration obligatoire dans nos produits. En cas d'allergie sévère, signale-le dans le mot pour la cuisine ou appelle-nous avant de commander."
    >
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[1.75rem] bg-sable" />}>
        <Tableau />
      </Suspense>
    </PageTexte>
  );
}

async function Tableau() {
  await connection();
  const [carte, reglages] = await Promise.all([lireCartePublique(), lireReglages()]);
  const nonRenseignes = carte.produits.filter((p) => p.allergenes === null).length;

  return (
    <div className="space-y-6">
      {nonRenseignes > 0 && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Les informations de {nonRenseignes} produit{nonRenseignes > 1 ? "s" : ""} sont disponibles sur simple demande au restaurant ({reglages.restaurant.telephone}).
        </p>
      )}
      <div className="overflow-x-auto rounded-[1.5rem] bg-white shadow-carte ring-1 ring-ligne">
        <table className="w-full min-w-[56rem] text-xs">
          <thead className="bg-nuit-900 text-creme">
            <tr>
              <th scope="col" className="sticky left-0 bg-nuit-900 p-3 text-left text-sm">
                Produit
              </th>
              {CLES.map((cle) => (
                <th key={cle} scope="col" className="p-2 text-center font-semibold [writing-mode:vertical-rl] rotate-180">
                  {ALLERGENES[cle]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ligne">
            {carte.produits.map((p) => (
              <tr key={p.id}>
                <th scope="row" className="sticky left-0 bg-white p-3 text-left text-sm font-bold">
                  {p.nom}
                </th>
                {p.allergenes === null ? (
                  <td colSpan={CLES.length} className="p-3 text-center text-gris">
                    Sur demande au restaurant
                  </td>
                ) : (
                  CLES.map((cle) => (
                    <td key={cle} className="p-2 text-center">
                      {p.allergenes!.includes(cle) ? <Check className="mx-auto size-4 text-braise-600" aria-label={`Contient : ${ALLERGENES[cle]}`} /> : <span className="sr-only">Non</span>}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gris">Nos produits sont préparés dans une cuisine où sont manipulés l&apos;ensemble de ces allergènes : des traces sont possibles.</p>
    </div>
  );
}
