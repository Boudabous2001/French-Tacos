"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Bike, ShoppingBag, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Compteur } from "@/components/ui/Compteur";
import { Feuille } from "@/components/ui/Feuille";
import { Prix } from "@/components/ui/Prix";
import { euros } from "@/lib/argent";
import { prixDepart } from "@/lib/catalogue/prix";
import { sousTotalPanier, usePanier } from "@/stores/panier";
import { useInterface } from "@/stores/interface";

export function TiroirPanier() {
  const ouvert = useInterface((e) => e.panierOuvert);
  const fermer = useInterface((e) => e.fermerPanier);
  return (
    <Feuille ouvert={ouvert} onFermer={fermer} titre="Ton panier" position="droite" className="sm:rounded-none">
      <ContenuPanier onFermer={fermer} />
    </Feuille>
  );
}

function ContenuPanier({ onFermer }: { onFermer: () => void }) {
  const router = useRouter();
  const { lignes, mode, adresse, changerQuantite, choisirMode } = usePanier();
  const reglages = useInterface((e) => e.reglages);
  const sousTotal = sousTotalPanier(lignes);
  const zone = mode === "livraison" ? adresse?.zone : null;
  const minimum = mode === "livraison" ? (zone?.minimum ?? 0) : (reglages?.commandes.minimumEmporter ?? 0);
  const manque = Math.max(0, minimum - sousTotal);
  const frais = zone ? (zone.gratuiteDes !== null && sousTotal >= zone.gratuiteDes ? 0 : zone.frais) : 0;
  const versGratuite = zone?.gratuiteDes ? Math.max(0, zone.gratuiteDes - sousTotal) : 0;
  const modesActifs = reglages?.modes ?? { livraison: true, emporter: true };

  return (
    <>
      <div className="border-b border-ligne px-5 pb-4 pt-6 sm:pt-5">
        <h2 className="titre-display text-3xl" data-focus-initial tabIndex={-1}>
          Ton panier
        </h2>
        {modesActifs.livraison && modesActifs.emporter && (
          <div className="mt-4 grid grid-cols-2 rounded-full bg-sable p-1" role="radiogroup" aria-label="Mode de commande">
            {(
              [
                { id: "livraison", libelle: "Livraison", Icone: Bike },
                { id: "emporter", libelle: "À emporter", Icone: Store },
              ] as const
            ).map(({ id, libelle, Icone }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                onClick={() => choisirMode(id)}
                className={clsx("relative flex h-10 items-center justify-center gap-2 rounded-full text-sm font-bold transition", mode === id ? "text-white" : "text-gris")}
              >
                {mode === id && <motion.span layoutId="mode-panier" className="absolute inset-0 rounded-full bg-nuit-900" />}
                <Icone className="relative size-4" aria-hidden />
                <span className="relative">{libelle}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {lignes.length === 0 ? (
          <PanierVide onFermer={onFermer} />
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {lignes.map((ligne) => (
                <motion.li
                  key={ligne.cle}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 60, height: 0, marginTop: 0, transition: { duration: 0.22 } }}
                  className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-ligne"
                >
                  {ligne.image && (
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-sable">
                      <Image src={ligne.image} alt="" fill sizes="64px" className="object-cover" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-tight">
                        {ligne.nom}
                        {ligne.varianteNom && <span className="font-semibold text-gris"> · {ligne.varianteNom}</span>}
                      </p>
                      <Prix montant={ligne.prixUnitaire * ligne.quantite} className="text-base font-extrabold" />
                    </div>
                    {ligne.details && <p className="mt-1 line-clamp-2 text-xs leading-snug text-gris">{ligne.details}</p>}
                    <Compteur
                      valeur={ligne.quantite}
                      onChange={(q) => changerQuantite(ligne.cle, q)}
                      taille="sm"
                      corbeille
                      libelle={`Quantité de ${ligne.nom}`}
                      className="mt-2"
                    />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        {lignes.length > 0 && <Suggestions />}
      </div>

      {lignes.length > 0 && (
        <div className="border-t border-ligne bg-white px-5 pb-5 pt-4">
          {mode === "livraison" && zone && versGratuite > 0 && (
            <Progression texte={`Plus que ${euros(versGratuite)} pour la livraison offerte`} valeur={sousTotal / (zone.gratuiteDes ?? 1)} />
          )}
          {manque > 0 && <Progression texte={`Minimum de commande : encore ${euros(manque)}`} valeur={sousTotal / minimum} alerte />}
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-gris">Sous-total</dt>
              <dd className="font-semibold tabular-nums">{euros(sousTotal)}</dd>
            </div>
            {mode === "livraison" && (
              <div className="flex justify-between">
                <dt className="text-gris">Livraison</dt>
                <dd className="font-semibold tabular-nums">{zone ? (frais === 0 ? "Offerte" : euros(frais)) : "selon l'adresse"}</dd>
              </div>
            )}
          </dl>
          <button
            type="button"
            disabled={manque > 0}
            onClick={() => {
              onFermer();
              router.push("/commande");
            }}
            className="mt-4 flex h-14 w-full items-center justify-between rounded-full bg-braise-500 px-6 font-bold text-white shadow-[0_12px_30px_-12px_rgb(251_106_11/0.95)] transition hover:bg-braise-600 active:scale-[0.98] disabled:bg-nuit-500 disabled:shadow-none"
          >
            <span className="flex items-center gap-2">
              Commander <ArrowRight className="size-5" aria-hidden />
            </span>
            <span className="tabular-nums">{euros(sousTotal + frais)}</span>
          </button>
        </div>
      )}
    </>
  );
}

function Progression({ texte, valeur, alerte = false }: { texte: string; valeur: number; alerte?: boolean }) {
  return (
    <div className="mb-4">
      <p className={clsx("text-xs font-bold", alerte ? "text-braise-700" : "text-emerald-700")}>{texte}</p>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sable">
        <motion.div
          className={clsx("h-full rounded-full", alerte ? "bg-braise-500" : "bg-emerald-500")}
          initial={false}
          animate={{ width: `${Math.min(100, Math.round(valeur * 100))}%` }}
        />
      </div>
    </div>
  );
}

function PanierVide({ onFermer }: { onFermer: () => void }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <motion.div
        initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        className="grid size-24 place-items-center rounded-full bg-sable"
      >
        <ShoppingBag className="size-10 text-braise-500" aria-hidden />
      </motion.div>
      <p className="mt-5 text-lg font-extrabold">Ton panier est vide</p>
      <p className="mt-1 max-w-[16rem] text-sm text-gris">Un tacos bien gratiné, ça te dit ? La carte t&apos;attend.</p>
      <Link
        href="/carte"
        onClick={onFermer}
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-nuit-900 px-6 font-bold text-creme transition hover:bg-nuit-800"
      >
        Voir la carte <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

/** Petites envies de dernière minute : boissons et desserts. */
function Suggestions() {
  const carte = useInterface((e) => e.carte);
  const ouvrirProduit = useInterface((e) => e.ouvrirProduit);
  const lignes = usePanier((e) => e.lignes);
  if (!carte) return null;
  const dansPanier = new Set(lignes.map((l) => l.produitId));
  const idees = carte.produits
    .filter((p) => ["desserts", "boissons", "tex-mex"].includes(p.categorieId) && p.disponible && !dansPanier.has(p.id))
    .slice(0, 8);
  if (idees.length === 0) return null;
  return (
    <section className="mt-6" aria-labelledby="titre-suggestions">
      <h3 id="titre-suggestions" className="font-pinceau text-lg text-braise-600">
        Une petite envie en plus ?
      </h3>
      <ul className="barre-defilement-fine -mx-5 mt-2 flex gap-2.5 overflow-x-auto px-5 pb-1">
        {idees.map((p) => (
          <li key={p.id} className="shrink-0">
            <button
              type="button"
              onClick={() => ouvrirProduit(p.id)}
              className="flex w-32 flex-col rounded-2xl bg-white p-2 text-left ring-1 ring-ligne transition hover:ring-braise-300"
            >
              {p.image && (
                <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-sable">
                  <Image src={p.image} alt="" fill sizes="128px" className="object-cover" />
                </span>
              )}
              <span className="mt-2 line-clamp-1 text-xs font-bold">{p.nom}</span>
              <Prix montant={prixDepart(p)} className="text-sm font-extrabold text-braise-600" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
