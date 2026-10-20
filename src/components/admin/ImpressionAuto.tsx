"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";

/** Ouvre la boîte d'impression dès l'affichage du ticket. */
export function ImpressionAuto() {
  useEffect(() => {
    const minuteur = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(minuteur);
  }, []);
  return (
    <div className="no-print mx-auto mb-4 flex w-[72mm] justify-center">
      <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
        <Printer className="size-4" aria-hidden /> Imprimer
      </button>
    </div>
  );
}
