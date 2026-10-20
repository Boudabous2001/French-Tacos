/**
 * Moteur de composition et de prix.
 *
 * Le même code tourne dans le navigateur (affichage du prix en direct) et sur
 * le serveur, qui recalcule TOUT au moment de la commande : un prix envoyé par
 * le navigateur n'est jamais cru.
 */
import type { Centimes } from "@/lib/argent";
import type { GroupeOptions, ListeChoix, Produit, Selection } from "./types";

export const QUANTITE_MAX_LIGNE = 20;

export interface ErreurSelection {
  groupe: string | null;
  message: string;
}

export interface ResumeGroupe {
  groupe: string;
  titre: string;
  choix: { id: string; nom: string; quantite: number; prix: Centimes }[];
}

export type Evaluation =
  | {
      ok: true;
      prixUnitaire: Centimes;
      varianteNom: string | null;
      resume: ResumeGroupe[];
      /** Sélection nettoyée : seuls les groupes visibles sont gardés. */
      selection: Selection;
    }
  | { ok: false; erreurs: ErreurSelection[]; prixUnitaire: Centimes };

export function bornesGroupe(groupe: GroupeOptions, varianteId: string | null) {
  const min = varianteId ? (groupe.minParVariante?.[varianteId] ?? groupe.min) : groupe.min;
  const max = varianteId ? (groupe.maxParVariante?.[varianteId] ?? groupe.max) : groupe.max;
  return { min, max: Math.max(min, max) };
}

export function groupeVisible(groupe: GroupeOptions, selection: Selection): boolean {
  if (groupe.siVariante && !groupe.siVariante.includes(selection.varianteId ?? "")) {
    return false;
  }
  if (groupe.siChoix) {
    const pris = selection.options[groupe.siChoix.groupe] ?? [];
    if (!pris.includes(groupe.siChoix.choix)) return false;
  }
  return true;
}

export function groupesVisibles(produit: Produit, selection: Selection): GroupeOptions[] {
  return produit.groupes.filter((g) => groupeVisible(g, selection));
}

/** Sélection de départ : première variante et choix par défaut encore disponibles. */
export function selectionInitiale(produit: Produit, listes: Record<string, ListeChoix>): Selection {
  const selection: Selection = {
    varianteId: produit.variantes[0]?.id ?? null,
    options: {},
  };
  for (const groupe of produit.groupes) {
    if (!groupe.defaut) continue;
    const disponibles = new Set(listes[groupe.listeId]?.items.filter((i) => i.disponible).map((i) => i.id));
    const defaut = groupe.defaut.filter((id) => disponibles.has(id));
    if (defaut.length > 0) selection.options[groupe.id] = defaut;
  }
  return selection;
}

function compter(ids: string[]): Map<string, number> {
  const compte = new Map<string, number>();
  for (const id of ids) compte.set(id, (compte.get(id) ?? 0) + 1);
  return compte;
}

export function evaluerSelection(
  produit: Produit,
  selectionBrute: Selection,
  listes: Record<string, ListeChoix>,
): Evaluation {
  const erreurs: ErreurSelection[] = [];
  const options = selectionBrute.options ?? {};
  let prix = produit.prix;
  let varianteNom: string | null = null;
  let varianteId: string | null = null;

  if (!produit.actif || !produit.disponible) {
    erreurs.push({ groupe: null, message: `${produit.nom} n'est plus disponible pour le moment.` });
  }

  if (produit.variantes.length > 0) {
    const variante = produit.variantes.find((v) => v.id === selectionBrute.varianteId);
    if (!variante) {
      erreurs.push({ groupe: "variante", message: "Choisis une formule." });
    } else {
      prix = variante.prix;
      varianteNom = variante.nom;
      varianteId = variante.id;
    }
  }

  const groupesConnus = new Set(produit.groupes.map((g) => g.id));
  for (const cle of Object.keys(options)) {
    if (!groupesConnus.has(cle)) {
      erreurs.push({ groupe: cle, message: "Option inconnue." });
    }
  }

  const selection: Selection = { varianteId, options: {} };
  const resume: ResumeGroupe[] = [];

  // Ordre de la fiche : un groupe conditionnel dépend des groupes précédents.
  for (const groupe of produit.groupes) {
    // Seuls les choix déjà validés des groupes précédents peuvent ouvrir un groupe.
    if (!groupeVisible(groupe, { varianteId, options: selection.options })) continue;

    const liste = listes[groupe.listeId];
    const pris = Array.isArray(options[groupe.id]) ? options[groupe.id] : [];
    const { min, max } = bornesGroupe(groupe, varianteId);

    if (pris.length < min) {
      const reste = min - pris.length;
      erreurs.push({
        groupe: groupe.id,
        message: min === 1 && max === 1 ? `${groupe.titre} : fais ton choix.` : `${groupe.titre} : encore ${reste} à choisir.`,
      });
    }
    if (pris.length > max) {
      erreurs.push({ groupe: groupe.id, message: `${groupe.titre} : ${max} choix maximum.` });
    }

    const compte = compter(pris);
    const choixResume: ResumeGroupe["choix"] = [];
    for (const [id, quantite] of compte) {
      const item = groupe.filtre && !groupe.filtre.includes(id) ? undefined : liste?.items.find((i) => i.id === id);
      if (!item) {
        erreurs.push({ groupe: groupe.id, message: `${groupe.titre} : choix inconnu.` });
        continue;
      }
      if (!item.disponible) {
        erreurs.push({ groupe: groupe.id, message: `${item.nom} est en rupture.` });
      }
      if (quantite > 1 && !groupe.repetition) {
        erreurs.push({ groupe: groupe.id, message: `${item.nom} ne peut être pris qu'une fois.` });
      }
      const prixItem = groupe.inclus ? 0 : item.prix;
      prix += prixItem * quantite;
      choixResume.push({ id, nom: item.nom, quantite, prix: prixItem });
    }

    if (pris.length > 0) {
      selection.options[groupe.id] = [...pris];
      resume.push({ groupe: groupe.id, titre: groupe.titre, choix: choixResume });
    }
  }

  if (erreurs.length > 0) return { ok: false, erreurs, prixUnitaire: prix };
  return { ok: true, prixUnitaire: prix, varianteNom, resume, selection };
}

/** Choix proposés dans un groupe, dans l'ordre de la liste. */
export function choixDuGroupe(groupe: GroupeOptions, listes: Record<string, ListeChoix>) {
  const items = listes[groupe.listeId]?.items ?? [];
  return groupe.filtre ? items.filter((i) => groupe.filtre!.includes(i.id)) : items;
}

/** Prix « à partir de » affiché sur la carte. */
export function prixDepart(produit: Produit): Centimes {
  if (produit.variantes.length === 0) return produit.prix;
  return Math.min(...produit.variantes.map((v) => v.prix));
}

/** Texte court d'une ligne : « Kebab ×2 · Algérienne · Cheddar ». */
export function texteResume(resume: ResumeGroupe[]): string {
  return resume
    .flatMap((g) => g.choix.map((c) => (c.quantite > 1 ? `${c.nom} ×${c.quantite}` : c.nom)))
    .join(" · ");
}

/** Empreinte stable d'une composition : deux lignes identiques fusionnent dans le panier. */
export function empreinteSelection(produitId: string, selection: Selection): string {
  const options = Object.keys(selection.options)
    .sort()
    .map((cle) => `${cle}=${[...selection.options[cle]].sort().join(",")}`)
    .join("|");
  return `${produitId}#${selection.varianteId ?? ""}#${options}`;
}
