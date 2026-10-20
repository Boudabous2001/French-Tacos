import { Suspense } from "react";

import { FicheProduitGlobale } from "@/components/carte/FicheProduit";
import { BarrePanier } from "@/components/panier/BarrePanier";
import { TiroirPanier } from "@/components/panier/TiroirPanier";
import { ChargeurBoutique } from "@/components/site/ChargeurBoutique";
import { EnTete } from "@/components/site/EnTete";
import { PiedDePage, PiedDePageSquelette } from "@/components/site/PiedDePage";

export default function LayoutSite({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-50 rounded-full bg-braise-500 px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>
      <EnTete />
      <Suspense fallback={null}>
        <ChargeurBoutique />
      </Suspense>
      <main id="contenu">{children}</main>
      <Suspense fallback={<PiedDePageSquelette />}>
        <PiedDePage />
      </Suspense>
      <TiroirPanier />
      <FicheProduitGlobale />
      <Suspense fallback={null}>
        <BarrePanier />
      </Suspense>
    </>
  );
}
