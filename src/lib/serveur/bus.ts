import "server-only";

import { EventEmitter } from "node:events";

import type { Statut } from "@/lib/commande-schema";

/**
 * Diffusion en direct des commandes vers l'écran cuisine (un seul serveur :
 * un émetteur en mémoire suffit, partagé par toutes les routes du processus).
 */
export interface EvenementCommande {
  id: string;
  numero: number;
  statut: Statut;
  /** Vrai quand la commande vient d'arriver (sonnerie en cuisine). */
  arrivee: boolean;
}

declare global {
  var __frenchTacosBus: EventEmitter | undefined;
}

const bus = (globalThis.__frenchTacosBus ??= (() => {
  const emetteur = new EventEmitter();
  emetteur.setMaxListeners(200);
  return emetteur;
})());

export function publierCommande(evenement: EvenementCommande) {
  bus.emit("commande", evenement);
}

export function ecouterCommandes(rappel: (e: EvenementCommande) => void): () => void {
  bus.on("commande", rappel);
  return () => bus.off("commande", rappel);
}
