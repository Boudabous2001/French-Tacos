"use client";

import type { ReactNode } from "react";

import { useInterface } from "@/stores/interface";

/** Ouvre la fiche d'un produit depuis une page serveur. */
export function BoutonProduit({ produitId, className, children, libelle }: { produitId: string; className?: string; children: ReactNode; libelle?: string }) {
  const ouvrirProduit = useInterface((e) => e.ouvrirProduit);
  return (
    <button type="button" onClick={() => ouvrirProduit(produitId)} className={className} aria-label={libelle}>
      {children}
    </button>
  );
}
