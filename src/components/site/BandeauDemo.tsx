import { FlaskConical } from "lucide-react";
import { connection } from "next/server";

import { estSiteDeTest } from "@/lib/environnement";

/** Bandeau du serveur de démonstration : personne ne doit croire à une vraie commande. */
export async function BandeauDemo() {
  await connection();
  if (!estSiteDeTest()) return null;
  return (
    <div className="relative z-50 bg-amber-300 px-4 py-2 text-center text-xs font-bold text-nuit-900 sm:text-sm" role="note">
      <FlaskConical className="mr-1.5 inline size-4 align-[-3px]" aria-hidden />
      Site de démonstration : les commandes sont fictives et aucun paiement réel n&apos;est effectué.
    </div>
  );
}
