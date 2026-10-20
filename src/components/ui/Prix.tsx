import { clsx } from "clsx";

import { euros, prixAffiche, type Centimes } from "@/lib/argent";

/** Prix façon affiche : « 7€50 ». Lu « 7,50 € » par les lecteurs d'écran. */
export function Prix({ montant, className, depart = false }: { montant: Centimes; className?: string; depart?: boolean }) {
  const { entier, decimales } = prixAffiche(montant);
  return (
    <span className={clsx("inline-flex items-baseline whitespace-nowrap tabular-nums", className)}>
      <span className="sr-only">
        {depart ? "à partir de " : ""}
        {euros(montant)}
      </span>
      <span aria-hidden className="inline-flex items-baseline">
        {depart && <span className="mr-1 text-[0.62em] font-semibold normal-case opacity-70">dès</span>}
        {entier}
        <span className="text-[0.62em] font-bold">€{decimales}</span>
      </span>
    </span>
  );
}
