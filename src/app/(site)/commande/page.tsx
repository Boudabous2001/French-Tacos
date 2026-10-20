import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Caisse } from "@/components/commande/Caisse";
import { reglagesPublics } from "@/lib/reglages-type";
import { lireCartePublique, lireReglages } from "@/lib/serveur/donnees";
import { modePaiementEnLigne } from "@/lib/serveur/paiement";

export const metadata: Metadata = {
  title: "Ta commande",
  robots: { index: false },
};

export default function PageCommande() {
  return (
    <Suspense fallback={<SqueletteCaisse />}>
      <CaisseChargee />
    </Suspense>
  );
}

async function CaisseChargee() {
  await connection();
  const [carte, reglages] = await Promise.all([lireCartePublique(), lireReglages()]);
  return (
    <Caisse
      carte={carte}
      reglages={reglagesPublics(reglages)}
      paiementEnLigne={modePaiementEnLigne()}
      cleStripe={process.env.STRIPE_PUBLISHABLE_KEY ?? null}
    />
  );
}

function SqueletteCaisse() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6" aria-busy="true" aria-label="Chargement">
      <div className="h-14 w-72 animate-pulse rounded-xl bg-sable" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-[1.75rem] bg-sable" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-[1.75rem] bg-sable" />
      </div>
    </div>
  );
}
