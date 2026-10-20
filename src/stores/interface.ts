"use client";

import { create } from "zustand";

import type { Carte } from "@/lib/catalogue/types";
import type { ReglagesPublics } from "@/lib/reglages-type";

export interface Notification {
  id: number;
  texte: string;
  ton: "succes" | "info" | "erreur";
}

interface EtatInterface {
  /** Carte et réglages publics, fournis par la page affichée. */
  carte: Carte | null;
  reglages: ReglagesPublics | null;
  panierOuvert: boolean;
  produitOuvert: string | null;
  panierHydrate: boolean;
  notifications: Notification[];
  /** Incrémenté à chaque ajout : déclenche l'animation du bouton panier. */
  rebond: number;
  fournirDonnees: (carte: Carte | null, reglages: ReglagesPublics | null) => void;
  ouvrirPanier: () => void;
  fermerPanier: () => void;
  ouvrirProduit: (id: string) => void;
  fermerProduit: () => void;
  marquerHydrate: () => void;
  notifier: (texte: string, ton?: Notification["ton"]) => void;
  retirerNotification: (id: number) => void;
  faireRebondir: () => void;
}

let compteur = 0;

export const useInterface = create<EtatInterface>()((set) => ({
  carte: null,
  reglages: null,
  panierOuvert: false,
  produitOuvert: null,
  panierHydrate: false,
  notifications: [],
  rebond: 0,
  fournirDonnees: (carte, reglages) =>
    set((etat) => ({ carte: carte ?? etat.carte, reglages: reglages ?? etat.reglages })),
  ouvrirPanier: () => set({ panierOuvert: true, produitOuvert: null }),
  fermerPanier: () => set({ panierOuvert: false }),
  ouvrirProduit: (id) => set({ produitOuvert: id }),
  fermerProduit: () => set({ produitOuvert: null }),
  marquerHydrate: () => set({ panierHydrate: true }),
  notifier: (texte, ton = "succes") => {
    compteur += 1;
    const id = compteur;
    set((etat) => ({ notifications: [...etat.notifications.slice(-2), { id, texte, ton }] }));
    setTimeout(() => set((etat) => ({ notifications: etat.notifications.filter((n) => n.id !== id) })), 3200);
  },
  retirerNotification: (id) => set((etat) => ({ notifications: etat.notifications.filter((n) => n.id !== id) })),
  faireRebondir: () => set((etat) => ({ rebond: etat.rebond + 1 })),
}));
