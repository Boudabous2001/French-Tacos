"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { Check, Info, Leaf, Minus, Plus, Zap } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

import { Badges } from "@/components/carte/Badges";
import { Compteur } from "@/components/ui/Compteur";
import { Feuille } from "@/components/ui/Feuille";
import { Prix } from "@/components/ui/Prix";
import { euros, supplement } from "@/lib/argent";
import {
  bornesGroupe,
  choixDuGroupe,
  empreinteSelection,
  evaluerSelection,
  groupeVisible,
  selectionInitiale,
  texteResume,
} from "@/lib/catalogue/prix";
import { ALLERGENES, type CleAllergene, type ChoixItem, type GroupeOptions, type ListeChoix, type Produit, type Selection } from "@/lib/catalogue/types";
import { QUANTITE_MAX, usePanier } from "@/stores/panier";
import { useInterface } from "@/stores/interface";

/** Fiche produit unique, ouverte depuis n'importe quelle page. */
export function FicheProduitGlobale() {
  const id = useInterface((e) => e.produitOuvert);
  const carte = useInterface((e) => e.carte);
  const fermer = useInterface((e) => e.fermerProduit);
  const produit = carte?.produits.find((p) => p.id === id) ?? null;

  // Garde le dernier produit affiché pendant l'animation de fermeture.
  const [affiche, setAffiche] = useState<Produit | null>(null);
  if (produit && produit !== affiche) setAffiche(produit);

  return (
    <Feuille
      ouvert={Boolean(produit)}
      onFermer={fermer}
      titre={affiche?.nom ?? "Produit"}
      entete={affiche && <VisuelFiche produit={affiche} />}
    >
      {affiche && carte && <ContenuFiche key={affiche.id} produit={affiche} listes={carte.listes} onAjoute={fermer} />}
    </Feuille>
  );
}

function VisuelFiche({ produit }: { produit: Produit }) {
  return (
    <div className="relative h-52 overflow-hidden bg-gradient-to-b from-sable to-papier sm:h-60">
      <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-braise-200/50 blur-3xl" aria-hidden />
      {produit.image && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0, rotate: -4 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
          className="relative mx-auto mt-4 size-44 overflow-hidden rounded-[2rem] bg-white shadow-carte ring-1 ring-black/5 sm:size-52"
        >
          <Image src={produit.image} alt="" fill sizes="220px" className="object-cover" priority />
        </motion.div>
      )}
    </div>
  );
}

/** Retire les choix des groupes devenus invisibles et respecte les nouvelles bornes. */
function nettoyer(produit: Produit, selection: Selection): Selection {
  const options: Record<string, string[]> = {};
  for (const groupe of produit.groupes) {
    if (!groupeVisible(groupe, { varianteId: selection.varianteId, options })) continue;
    const pris = selection.options[groupe.id];
    if (!pris?.length) continue;
    options[groupe.id] = pris.slice(0, bornesGroupe(groupe, selection.varianteId).max);
  }
  return { varianteId: selection.varianteId, options };
}

function ContenuFiche({ produit, listes, onAjoute }: { produit: Produit; listes: Record<string, ListeChoix>; onAjoute: () => void }) {
  const ajouter = usePanier((e) => e.ajouter);
  const { notifier, faireRebondir } = useInterface.getState();
  const [selection, setSelection] = useState<Selection>(() => selectionInitiale(produit, listes));
  const [quantite, setQuantite] = useState(1);
  const [tentative, setTentative] = useState(false);
  const [secousse, setSecousse] = useState<{ groupe: string; n: number } | null>(null);
  const defilement = useRef<HTMLDivElement>(null);

  const evaluation = useMemo(() => evaluerSelection(produit, selection, listes), [produit, selection, listes]);
  const erreursParGroupe = useMemo(() => {
    const carte = new Map<string, string>();
    if (!evaluation.ok) for (const e of evaluation.erreurs) if (e.groupe && !carte.has(e.groupe)) carte.set(e.groupe, e.message);
    return carte;
  }, [evaluation]);

  const groupes = produit.groupes.filter((g) => groupeVisible(g, nettoyer(produit, selection)));
  const indisponible = !produit.disponible;

  const changer = (suivante: Selection) => setSelection(nettoyer(produit, suivante));

  const secouer = (groupe: string) => {
    setSecousse((s) => ({ groupe, n: (s?.n ?? 0) + 1 }));
    document.getElementById(`groupe-${groupe}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const valider = () => {
    if (!evaluation.ok) {
      setTentative(true);
      const premiere = evaluation.erreurs.find((e) => e.groupe)?.groupe;
      if (premiere) secouer(premiere);
      else notifier(evaluation.erreurs[0].message, "erreur");
      return;
    }
    ajouter({
      cle: empreinteSelection(produit.id, evaluation.selection),
      produitId: produit.id,
      nom: produit.nom,
      image: produit.image,
      varianteNom: evaluation.varianteNom,
      selection: evaluation.selection,
      details: texteResume(evaluation.resume),
      prixUnitaire: evaluation.prixUnitaire,
      quantite,
    });
    notifier(`${quantite > 1 ? `${quantite} × ` : ""}${produit.nom} ajouté${quantite > 1 ? "s" : ""} au panier`);
    faireRebondir();
    onAjoute();
  };

  const premierManquant = evaluation.ok ? null : (evaluation.erreurs.find((e) => e.groupe) ?? evaluation.erreurs[0]);
  const libelleBouton = indisponible
    ? "Victime de son succès"
    : evaluation.ok
      ? "Ajouter"
      : tentative && premierManquant
        ? premierManquant.message.split(" : ")[0]
        : "Ajouter";

  return (
    <>
      <div ref={defilement} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="px-5 pb-2 pt-4 sm:px-7">
          <Badges badges={produit.badges} className="mb-2" />
          <h2 className="titre-display text-[2.4rem] text-encre" data-focus-initial tabIndex={-1}>
            {produit.nom}
          </h2>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-gris">{produit.description}</p>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-gris">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden />
            {produit.allergenes === null
              ? "Liste des allergènes disponible sur demande au restaurant."
              : produit.allergenes.length === 0
                ? "Aucun des 14 allergènes réglementaires."
                : `Allergènes : ${produit.allergenes.map((a) => ALLERGENES[a as CleAllergene] ?? a).join(", ")}.`}
          </p>
        </div>

        {produit.variantes.length > 0 && (
          <section className="px-5 py-4 sm:px-7" aria-labelledby="titre-variante">
            <EnteteGroupe id="titre-variante" titre="Ta formule" obligatoire complet={Boolean(selection.varianteId)} />
            <div className={clsx("mt-3 grid gap-2.5", produit.variantes.length > 2 ? "grid-cols-3" : "grid-cols-2")} role="radiogroup" aria-labelledby="titre-variante">
              {produit.variantes.map((v) => {
                const actif = selection.varianteId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={actif}
                    onClick={() => changer({ ...selection, varianteId: v.id })}
                    className={clsx(
                      "relative flex flex-col items-center rounded-2xl px-3 py-3.5 text-center transition",
                      actif ? "text-white" : "bg-white ring-1 ring-ligne hover:ring-braise-300",
                    )}
                  >
                    {actif && (
                      <motion.span
                        layoutId={`variante-${produit.id}`}
                        className="absolute inset-0 rounded-2xl bg-braise-500 shadow-[0_10px_24px_-10px_rgb(251_106_11/0.9)]"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className="relative titre-display text-xl">{v.nom}</span>
                    <Prix montant={v.prix} className="relative mt-1 text-lg font-extrabold" />
                    {v.detail && <span className={clsx("relative mt-0.5 text-[0.7rem] font-semibold", actif ? "text-white/85" : "text-gris")}>{v.detail}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {groupes.map((groupe) => (
          <SectionGroupe
            key={groupe.id}
            groupe={groupe}
            items={choixDuGroupe(groupe, listes)}
            selection={selection}
            erreur={tentative ? erreursParGroupe.get(groupe.id) : undefined}
            secousse={secousse?.groupe === groupe.id ? secousse.n : 0}
            onChange={(pris) => changer({ ...selection, options: { ...selection.options, [groupe.id]: pris } })}
            onLimite={() => secouer(groupe.id)}
          />
        ))}
        <div className="h-6" />
      </div>

      <div className="flex items-center gap-3 border-t border-ligne bg-papier/95 px-4 py-3 backdrop-blur sm:px-6">
        <Compteur valeur={quantite} onChange={setQuantite} max={QUANTITE_MAX} libelle="Quantité" />
        <button
          type="button"
          onClick={valider}
          disabled={indisponible}
          className={clsx(
            "flex h-14 flex-1 items-center justify-between gap-3 rounded-full px-6 font-bold text-white transition active:scale-[0.98] disabled:bg-nuit-500",
            evaluation.ok ? "bg-braise-500 shadow-[0_12px_30px_-12px_rgb(251_106_11/0.95)] hover:bg-braise-600" : "bg-nuit-800 hover:bg-nuit-700",
          )}
        >
          <span className="truncate">{libelleBouton}</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={evaluation.prixUnitaire * quantite}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              className="shrink-0 tabular-nums"
            >
              {euros(evaluation.prixUnitaire * quantite)}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </>
  );
}

function EnteteGroupe({
  id,
  titre,
  aide,
  obligatoire,
  complet,
  compte,
}: {
  id: string;
  titre: string;
  aide?: string;
  obligatoire: boolean;
  complet: boolean;
  compte?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 id={id} className="text-lg font-extrabold leading-tight">
          {titre}
        </h3>
        {aide && <p className="mt-0.5 text-sm text-gris">{aide}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {compte && <span className="rounded-full bg-sable px-2 py-0.5 text-xs font-bold tabular-nums text-gris">{compte}</span>}
        <AnimatePresence mode="wait" initial={false}>
          {obligatoire && complet ? (
            <motion.span
              key="ok"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700"
            >
              <Check className="size-3" aria-hidden /> OK
            </motion.span>
          ) : (
            <motion.span
              key="etat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={clsx(
                "rounded-full px-2 py-0.5 text-xs font-bold",
                obligatoire ? "bg-braise-500 text-white" : "bg-sable text-gris",
              )}
            >
              {obligatoire ? "Obligatoire" : "Facultatif"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SectionGroupe({
  groupe,
  items,
  selection,
  erreur,
  secousse,
  onChange,
  onLimite,
}: {
  groupe: GroupeOptions;
  items: ChoixItem[];
  selection: Selection;
  erreur?: string;
  secousse: number;
  onChange: (pris: string[]) => void;
  onLimite: () => void;
}) {
  const pris = selection.options[groupe.id] ?? [];
  const { min, max } = bornesGroupe(groupe, selection.varianteId);
  const unique = max === 1;
  const plein = pris.length >= max;
  const avecImages = items.some((i) => i.image);
  const titreId = `titre-groupe-${groupe.id}`;

  const basculer = (item: ChoixItem) => {
    if (!item.disponible) return;
    const nb = pris.filter((id) => id === item.id).length;
    if (unique) {
      onChange(nb > 0 && min === 0 ? [] : [item.id]);
      return;
    }
    if (groupe.repetition) {
      if (plein) return onLimite();
      onChange([...pris, item.id]);
      return;
    }
    if (nb > 0) onChange(pris.filter((id) => id !== item.id));
    else if (plein) onLimite();
    else onChange([...pris, item.id]);
  };

  const retirerUn = (item: ChoixItem) => {
    const index = pris.lastIndexOf(item.id);
    if (index >= 0) onChange(pris.filter((_, i) => i !== index));
  };

  return (
    <motion.section
      id={`groupe-${groupe.id}`}
      aria-labelledby={titreId}
      className="scroll-mt-4 border-t border-ligne/70 px-5 py-5 sm:px-7"
      animate={secousse ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
      key={`${groupe.id}-${secousse}`}
      transition={{ duration: 0.4 }}
    >
      <EnteteGroupe
        id={titreId}
        titre={groupe.titre}
        aide={groupe.aide}
        obligatoire={min > 0}
        complet={pris.length >= min}
        compte={max > 1 ? `${pris.length}/${max}` : undefined}
      />
      <AnimatePresence>
        {erreur && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 text-sm font-semibold text-alerte"
            role="alert"
          >
            {erreur}
          </motion.p>
        )}
      </AnimatePresence>

      <ul
        role={unique ? "radiogroup" : "group"}
        aria-labelledby={titreId}
        className={clsx("mt-3 grid gap-2", avecImages ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}
      >
        {items.map((item) => {
          const nb = pris.filter((id) => id === item.id).length;
          const choisi = nb > 0;
          const bloque = !item.disponible || (!choisi && plein && !unique);
          return (
            <li key={item.id} className="relative">
              <button
                type="button"
                role={unique ? "radio" : "checkbox"}
                aria-checked={choisi}
                aria-disabled={bloque || undefined}
                onClick={() => basculer(item)}
                className={clsx(
                  "relative flex w-full items-center gap-3 rounded-2xl p-2.5 pr-3 text-left transition duration-200",
                  choisi ? "bg-braise-50 ring-2 ring-braise-500" : "bg-white ring-1 ring-ligne hover:ring-braise-300",
                  !item.disponible && "cursor-not-allowed opacity-45",
                  item.disponible && bloque && "opacity-55",
                  groupe.repetition && choisi && "pb-11",
                )}
              >
                {item.image ? (
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                    <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                ) : (
                  <span
                    className={clsx(
                      "grid size-6 shrink-0 place-items-center border-2 transition",
                      unique ? "rounded-full" : "rounded-md",
                      choisi ? "border-braise-500 bg-braise-500 text-white" : "border-ligne bg-white",
                    )}
                    aria-hidden
                  >
                    {choisi && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className={clsx("block text-sm font-bold leading-tight", !item.disponible && "line-through")}>{item.nom}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-gris">
                    {!item.disponible ? (
                      "Épuisé"
                    ) : (
                      <>
                        {!groupe.inclus && item.prix > 0 && <span className="text-braise-600">{supplement(item.prix)}</span>}
                        {item.tags?.includes("vegetarien") && <Leaf className="size-3 text-emerald-600" aria-label="végétarien" />}
                        {item.tags?.includes("epice") && <Zap className="size-3 text-red-600" aria-label="épicé" />}
                      </>
                    )}
                  </span>
                </span>
                <AnimatePresence>
                  {choisi && item.image && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -right-1.5 -top-1.5 grid min-w-6 place-items-center rounded-full bg-braise-500 px-1.5 py-0.5 text-xs font-extrabold text-white shadow ring-2 ring-papier"
                    >
                      {nb > 1 ? `×${nb}` : <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              {groupe.repetition && choisi && (
                <div className="absolute inset-x-2.5 bottom-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => retirerUn(item)}
                    className="grid size-7 place-items-center rounded-full bg-white text-encre ring-1 ring-ligne active:scale-90"
                    aria-label={`Une ${item.nom} de moins`}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="text-xs font-extrabold tabular-nums text-braise-700">×{nb}</span>
                  <button
                    type="button"
                    onClick={() => (plein ? onLimite() : onChange([...pris, item.id]))}
                    className={clsx(
                      "grid size-7 place-items-center rounded-full bg-braise-500 text-white active:scale-90",
                      plein && "opacity-40",
                    )}
                    aria-label={`Une ${item.nom} de plus`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
