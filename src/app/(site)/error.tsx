"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Bouton } from "@/components/ui/Bouton";

export default function Erreur({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="titre-display text-5xl">Oups, petit souci</h1>
      <p className="mt-3 text-gris">Quelque chose n&apos;a pas fonctionné. Ton panier est conservé : réessaie dans un instant.</p>
      <Bouton taille="lg" className="mt-8" onClick={reset} icone={<RotateCcw className="size-5" aria-hidden />}>
        Réessayer
      </Bouton>
      {error.digest && <p className="mt-6 text-xs text-gris">Référence : {error.digest}</p>}
    </div>
  );
}
