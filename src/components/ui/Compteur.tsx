"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, Trash2 } from "lucide-react";

interface Props {
  valeur: number;
  onChange: (valeur: number) => void;
  min?: number;
  max?: number;
  taille?: "sm" | "md";
  /** Affiche une corbeille quand on descend à zéro. */
  corbeille?: boolean;
  libelle: string;
  className?: string;
}

export function Compteur({ valeur, onChange, min = 1, max = 20, taille = "md", corbeille = false, libelle, className }: Props) {
  const petit = taille === "sm";
  const bouton = clsx(
    "grid place-items-center rounded-full transition active:scale-90 disabled:opacity-35 disabled:active:scale-100",
    petit ? "size-8" : "size-11",
  );
  const versZero = corbeille && valeur <= 1;
  return (
    <div
      role="group"
      aria-label={libelle}
      className={clsx("inline-flex items-center rounded-full bg-white p-1 ring-1 ring-ligne", className)}
    >
      <button
        type="button"
        className={clsx(bouton, versZero ? "text-alerte hover:bg-red-50" : "hover:bg-sable")}
        onClick={() => onChange(valeur - 1)}
        disabled={!corbeille && valeur <= min}
        aria-label={versZero ? "Retirer" : "Diminuer"}
      >
        {versZero ? <Trash2 className={petit ? "size-3.5" : "size-4"} /> : <Minus className={petit ? "size-3.5" : "size-4"} />}
      </button>
      <span className={clsx("relative grid overflow-hidden text-center font-extrabold tabular-nums", petit ? "w-6 text-sm" : "w-8 text-base")}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={valeur}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.16 }}
            aria-live="polite"
          >
            {valeur}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        className={clsx(bouton, "bg-nuit-900 text-creme hover:bg-nuit-800")}
        onClick={() => onChange(valeur + 1)}
        disabled={valeur >= max}
        aria-label="Augmenter"
      >
        <Plus className={petit ? "size-3.5" : "size-4"} />
      </button>
    </div>
  );
}
