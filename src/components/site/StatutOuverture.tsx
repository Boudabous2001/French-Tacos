"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";

import { etatOuverture, heureParis, jourParis, partiesParis, type Fermeture, type Semaine } from "@/lib/horaires";

export interface ResumeOuverture {
  ton: "ouvert" | "bientot" | "ferme" | "pause";
  texte: string;
}

export function resumerOuverture(maintenant: Date, horaires: Semaine, fermetures: Fermeture[], enPause: boolean): ResumeOuverture {
  const etat = etatOuverture(maintenant, horaires, fermetures);
  if (etat.ouvert && enPause) return { ton: "pause", texte: "Commandes en pause" };
  if (etat.ouvert && etat.fermeA) {
    const reste = (etat.fermeA.getTime() - maintenant.getTime()) / 60_000;
    return reste <= 30
      ? { ton: "bientot", texte: `Ferme à ${heureParis(etat.fermeA)}` }
      : { ton: "ouvert", texte: `Ouvert · jusqu'à ${heureParis(etat.fermeA)}` };
  }
  if (etat.ouvreA) {
    const memeJour = partiesParis(etat.ouvreA).date === partiesParis(maintenant).date;
    const demain = partiesParis(new Date(maintenant.getTime() + 86_400_000)).date === partiesParis(etat.ouvreA).date;
    const quand = memeJour ? heureParis(etat.ouvreA) : demain ? `demain ${heureParis(etat.ouvreA)}` : jourParis(etat.ouvreA);
    return { ton: "ferme", texte: `Fermé · ouvre ${memeJour ? "à " : ""}${quand}` };
  }
  return { ton: "ferme", texte: "Fermé" };
}

/** Recalcule l'état chaque minute ; rien n'est rendu côté serveur (l'heure y serait figée). */
export function useOuverture(horaires: Semaine | undefined, fermetures: Fermeture[] | undefined, enPause = false) {
  const [resume, setResume] = useState<ResumeOuverture | null>(null);
  useEffect(() => {
    if (!horaires) return;
    const maj = () => setResume(resumerOuverture(new Date(), horaires, fermetures ?? [], enPause));
    maj();
    const minuteur = window.setInterval(maj, 30_000);
    return () => window.clearInterval(minuteur);
  }, [horaires, fermetures, enPause]);
  return resume;
}

const TONS = {
  ouvert: "bg-emerald-400 text-emerald-400",
  bientot: "bg-amber-400 text-amber-400",
  pause: "bg-amber-400 text-amber-400",
  ferme: "bg-red-400 text-red-400",
};

export function PastilleOuverture({
  horaires,
  fermetures,
  enPause,
  className,
}: {
  horaires: Semaine;
  fermetures: Fermeture[];
  enPause: boolean;
  className?: string;
}) {
  const resume = useOuverture(horaires, fermetures, enPause);
  return (
    <span
      className={clsx(
        "inline-flex h-8 items-center gap-2 rounded-full bg-white/[0.07] px-3 text-xs font-semibold text-creme ring-1 ring-white/10 transition-opacity",
        resume ? "opacity-100" : "opacity-0",
        className,
      )}
      aria-live="polite"
    >
      <span className={clsx("size-2 rounded-full", resume && TONS[resume.ton], resume?.ton === "ouvert" && "animate-pulsation")} aria-hidden />
      {resume?.texte ?? "…"}
    </span>
  );
}
