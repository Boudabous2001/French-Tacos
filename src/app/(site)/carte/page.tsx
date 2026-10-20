import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { CarteInteractive } from "@/components/carte/CarteInteractive";
import { lireCartePublique } from "@/lib/serveur/donnees";

export const metadata: Metadata = {
  title: "La carte",
  description: "Tacos simple, double ou triple, burgers, sandwichs, paninis, galettes, assiettes, tex-mex et desserts. Compose ta commande en ligne.",
  alternates: { canonical: "/carte" },
};

export default function PageCarte() {
  return (
    <>
      <section className="grain relative overflow-hidden bg-nuit-900 pb-10 pt-8 text-creme sm:pb-14 sm:pt-12">
        <div className="halo-neon pointer-events-none absolute -top-24 right-0 h-72 w-[40rem] opacity-70" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <p className="animate-apparition font-pinceau text-xl text-ambre-400">Fait minute, servi chaud</p>
          <h1 className="animate-apparition titre-display mt-1 text-6xl text-white [animation-delay:80ms] sm:text-7xl">La carte</h1>
          <p className="animate-apparition mt-3 max-w-lg text-creme/75 [animation-delay:160ms]">
            Touche un produit pour le composer : taille, viandes, sauces, suppléments. Le prix se met à jour en direct.
          </p>
        </div>
      </section>
      <Suspense fallback={<SqueletteCarte />}>
        <CarteChargee />
      </Suspense>
    </>
  );
}

async function CarteChargee() {
  await connection();
  const carte = await lireCartePublique();
  return <CarteInteractive carte={carte} />;
}

function SqueletteCarte() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6" aria-busy="true" aria-label="Chargement de la carte">
      <div className="flex gap-2 py-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-sable" />
        ))}
      </div>
      <div className="mt-8 h-32 animate-pulse rounded-[1.75rem] bg-sable" />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-[1.75rem] bg-sable" />
        ))}
      </div>
    </div>
  );
}
