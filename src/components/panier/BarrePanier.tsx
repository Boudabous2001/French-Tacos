"use client";

import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";

import { euros } from "@/lib/argent";
import { nombreArticles, sousTotalPanier, usePanier } from "@/stores/panier";
import { useInterface } from "@/stores/interface";

const PAGES = ["/", "/carte"];

/** Barre flottante « Voir le panier » sur téléphone. */
export function BarrePanier() {
  const chemin = usePathname();
  const lignes = usePanier((e) => e.lignes);
  const hydrate = useInterface((e) => e.panierHydrate);
  const ouvert = useInterface((e) => e.panierOuvert || e.produitOuvert !== null);
  const ouvrirPanier = useInterface((e) => e.ouvrirPanier);
  const nombre = nombreArticles(lignes);
  const visible = hydrate && nombre > 0 && !ouvert && PAGES.includes(chemin);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"
        >
          <button
            type="button"
            onClick={ouvrirPanier}
            className="flex h-14 w-full items-center gap-3 rounded-full bg-braise-500 pl-2 pr-6 font-bold text-white shadow-[0_18px_40px_-12px_rgb(251_106_11/0.9)] active:scale-[0.98]"
          >
            <span className="relative grid size-10 place-items-center rounded-full bg-white/20">
              <ShoppingBag className="size-5" aria-hidden />
              <motion.span
                key={nombre}
                initial={{ scale: 0.3 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-nuit-900 text-[0.7rem]"
              >
                {nombre}
              </motion.span>
            </span>
            Voir le panier
            <span className="ml-auto tabular-nums">{euros(sousTotalPanier(lignes))}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
