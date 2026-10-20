import type { Metadata } from "next";

import { Logo } from "@/components/marque/Logo";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion" };

export default function PageConnexion() {
  return (
    <main className="grain relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <div className="halo-neon pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="text-center">
          <Logo taille="lg" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-creme/50">Back-office</p>
        </div>
        <FormulaireConnexion />
        <p className="mt-6 text-center text-xs text-creme/40">Accès réservé à l&apos;équipe du restaurant.</p>
      </div>
    </main>
  );
}
