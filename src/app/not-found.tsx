import Link from "next/link";

import { Logo } from "@/components/marque/Logo";
import { classesBouton } from "@/components/ui/Bouton";

export default function Introuvable() {
  return (
    <main className="grain relative grid min-h-dvh place-items-center overflow-hidden bg-nuit-900 px-4 text-center text-creme">
      <div className="halo-neon pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="relative">
        <Logo taille="lg" />
        <p className="titre-display mt-8 text-[7rem] leading-none text-braise-500">404</p>
        <h1 className="titre-display text-4xl text-white">Cette page s&apos;est fait la malle</h1>
        <p className="mx-auto mt-3 max-w-sm text-creme/70">Pas de panique, les tacos, eux, sont toujours là.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/carte" className={classesBouton("primaire", "lg")}>
            Voir la carte
          </Link>
          <Link href="/" className={classesBouton("contour", "lg", "text-creme")}>
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
