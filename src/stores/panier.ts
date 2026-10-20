"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Selection } from "@/lib/catalogue/types";
import type { AdresseLivraison } from "@/lib/livraison";
import type { ModeCommande } from "@/lib/reglages-type";

export interface LignePanier {
  /** Empreinte de la composition : deux ajouts identiques se cumulent. */
  cle: string;
  produitId: string;
  nom: string;
  image: string | null;
  varianteNom: string | null;
  selection: Selection;
  details: string;
  prixUnitaire: number;
  quantite: number;
}

export interface ZoneChoisie {
  id: string;
  nom: string;
  frais: number;
  minimum: number;
  gratuiteDes: number | null;
  trajetMinutes: number;
}

export type AdresseChoisie = AdresseLivraison & { zone: ZoneChoisie | null };

/** Coordonnées mémorisées sur cet appareil pour les prochaines commandes. */
export interface CoordonneesClient {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
}

interface EtatPanier {
  lignes: LignePanier[];
  mode: ModeCommande;
  adresse: AdresseChoisie | null;
  /** Jeton de la dernière commande passée (pour vider le panier une fois payée). */
  derniereCommande: string | null;
  client: CoordonneesClient;
  ajouter: (ligne: LignePanier) => void;
  changerQuantite: (cle: string, quantite: number) => void;
  retirer: (cle: string) => void;
  remplacerLignes: (lignes: LignePanier[]) => void;
  vider: () => void;
  choisirMode: (mode: ModeCommande) => void;
  choisirAdresse: (adresse: AdresseChoisie | null) => void;
  memoriserCommande: (jeton: string | null) => void;
  modifierClient: (client: Partial<CoordonneesClient>) => void;
}

export const QUANTITE_MAX = 20;

export const usePanier = create<EtatPanier>()(
  persist(
    (set) => ({
      lignes: [],
      mode: "livraison",
      adresse: null,
      derniereCommande: null,
      client: { prenom: "", nom: "", telephone: "", email: "" },
      ajouter: (ligne) =>
        set((etat) => {
          const existante = etat.lignes.find((l) => l.cle === ligne.cle);
          if (existante) {
            return {
              lignes: etat.lignes.map((l) =>
                l.cle === ligne.cle ? { ...l, quantite: Math.min(QUANTITE_MAX, l.quantite + ligne.quantite), prixUnitaire: ligne.prixUnitaire } : l,
              ),
            };
          }
          return { lignes: [...etat.lignes, ligne] };
        }),
      changerQuantite: (cle, quantite) =>
        set((etat) => ({
          lignes:
            quantite <= 0
              ? etat.lignes.filter((l) => l.cle !== cle)
              : etat.lignes.map((l) => (l.cle === cle ? { ...l, quantite: Math.min(QUANTITE_MAX, quantite) } : l)),
        })),
      retirer: (cle) => set((etat) => ({ lignes: etat.lignes.filter((l) => l.cle !== cle) })),
      remplacerLignes: (lignes) => set({ lignes }),
      vider: () => set({ lignes: [] }),
      choisirMode: (mode) => set({ mode }),
      choisirAdresse: (adresse) => set({ adresse }),
      memoriserCommande: (jeton) => set({ derniereCommande: jeton }),
      modifierClient: (client) => set((etat) => ({ client: { ...etat.client, ...client } })),
    }),
    {
      name: "french-tacos-panier",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Réhydraté après le premier rendu (voir Fournisseurs) : pas de décalage avec le HTML serveur.
      skipHydration: true,
      partialize: (etat) => ({
        lignes: etat.lignes,
        mode: etat.mode,
        adresse: etat.adresse,
        derniereCommande: etat.derniereCommande,
        client: etat.client,
      }),
    },
  ),
);

export const sousTotalPanier = (lignes: LignePanier[]) => lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);
export const nombreArticles = (lignes: LignePanier[]) => lignes.reduce((s, l) => s + l.quantite, 0);
