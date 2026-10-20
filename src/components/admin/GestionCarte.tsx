"use client";

import { clsx } from "clsx";
import { Eye, EyeOff, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";

import { modifierChoix, modifierProduit } from "@/app/admin/actions";
import type { Carte, ChoixItem, Produit } from "@/lib/catalogue/types";

/** « 7,50 » ⇄ 750 */
const versTexte = (centimes: number) => (centimes / 100).toFixed(2).replace(".", ",");
const versCentimes = (texte: string) => {
  const valeur = Number(texte.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(valeur) ? Math.round(valeur * 100) : NaN;
};

export function GestionCarte({ carte: initiale }: { carte: Carte }) {
  const [carte, setCarte] = useState(initiale);
  const [recherche, setRecherche] = useState("");
  const [retour, setRetour] = useState<{ texte: string; ok: boolean } | null>(null);
  const [, demarrer] = useTransition();

  const signaler = (ok: boolean, texte: string) => {
    setRetour({ ok, texte });
    window.setTimeout(() => setRetour(null), 2500);
  };

  const majProduit = (produit: Produit, modifications: Parameters<typeof modifierProduit>[1], local: Partial<Produit>) => {
    const precedent = carte;
    setCarte((c) => ({ ...c, produits: c.produits.map((p) => (p.id === produit.id ? { ...p, ...local } : p)) }));
    demarrer(async () => {
      const r = await modifierProduit(produit.id, modifications);
      if (!r?.ok) {
        setCarte(precedent);
        signaler(false, r?.message ?? "Modification refusée");
      } else signaler(true, "Enregistré");
    });
  };

  const majChoix = (listeId: string, item: ChoixItem, modifications: { disponible?: boolean; prix?: number }) => {
    const precedent = carte;
    setCarte((c) => ({
      ...c,
      listes: { ...c.listes, [listeId]: { ...c.listes[listeId], items: c.listes[listeId].items.map((i) => (i.id === item.id ? { ...i, ...modifications } : i)) } },
    }));
    demarrer(async () => {
      const r = await modifierChoix(listeId, item.id, modifications);
      if (!r?.ok) {
        setCarte(precedent);
        signaler(false, r?.message ?? "Modification refusée");
      } else signaler(true, "Enregistré");
    });
  };

  const filtre = recherche.trim().toLowerCase();
  const produitsFiltres = useMemo(() => carte.produits.filter((p) => !filtre || p.nom.toLowerCase().includes(filtre)), [carte.produits, filtre]);
  const enRupture = carte.produits.filter((p) => !p.disponible).length + Object.values(carte.listes).flatMap((l) => l.items).filter((i) => !i.disponible).length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titre-display text-4xl text-white">La carte</h1>
          <p className="mt-1 text-sm text-creme/60">
            Touchez un interrupteur pour mettre un produit en rupture : il disparaît aussitôt des commandes possibles.
            {enRupture > 0 && <strong className="text-amber-300"> {enRupture} élément(s) en rupture.</strong>}
          </p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-creme/40" aria-hidden />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un produit"
            className="h-11 w-full rounded-full bg-nuit-900 pl-10 pr-4 text-sm outline-none ring-1 ring-white/10 focus:ring-ambre-400"
            aria-label="Rechercher un produit"
          />
        </label>
      </div>

      <div className={clsx("fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-bold shadow-flottant transition", retour ? "opacity-100" : "pointer-events-none opacity-0", retour?.ok ? "bg-emerald-500 text-white" : "bg-red-500 text-white")} role="status">
        {retour?.texte}
      </div>

      <section className="mt-8" aria-labelledby="titre-ingredients">
        <h2 id="titre-ingredients" className="text-sm font-extrabold uppercase tracking-wider text-creme/60">
          Ingrédients et options partagés
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {Object.values(carte.listes).map((liste) => (
            <div key={liste.id} className="rounded-2xl bg-nuit-900 p-4 ring-1 ring-white/5">
              <h3 className="font-extrabold text-white">{liste.nom}</h3>
              <ul className="mt-2 divide-y divide-white/5">
                {liste.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2">
                    <span className={clsx("flex-1 text-sm font-semibold", !item.disponible && "text-creme/40 line-through")}>{item.nom}</span>
                    {(item.prix > 0 || liste.id === "supplements") && (
                      <ChampPrix valeur={item.prix} onValider={(prix) => majChoix(liste.id, item, { prix })} libelle={`Prix de ${item.nom}`} />
                    )}
                    <Interrupteur actif={item.disponible} onChange={(disponible) => majChoix(liste.id, item, { disponible })} libelle={`${item.nom} disponible`} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {carte.categories.map((categorie) => {
        const produits = produitsFiltres.filter((p) => p.categorieId === categorie.id);
        if (produits.length === 0) return null;
        return (
          <section key={categorie.id} className="mt-8" aria-labelledby={`admin-cat-${categorie.id}`}>
            <h2 id={`admin-cat-${categorie.id}`} className="text-sm font-extrabold uppercase tracking-wider text-creme/60">
              {categorie.nom}
            </h2>
            <ul className="mt-3 divide-y divide-white/5 overflow-hidden rounded-2xl bg-nuit-900 ring-1 ring-white/5">
              {produits.map((produit) => (
                <li key={produit.id} className={clsx("flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap", !produit.actif && "opacity-50")}>
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-nuit-700">
                    {produit.image && <Image src={produit.image} alt="" fill sizes="48px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={clsx("font-bold text-white", !produit.disponible && "line-through opacity-60")}>{produit.nom}</p>
                    {!produit.disponible && <p className="text-xs font-bold text-amber-300">En rupture</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {produit.variantes.length > 0 ? (
                      produit.variantes.map((v) => (
                        <span key={v.id} className="flex items-center gap-1.5 text-xs font-semibold text-creme/60">
                          {v.nom}
                          <ChampPrix
                            valeur={v.prix}
                            libelle={`Prix ${produit.nom} ${v.nom}`}
                            onValider={(prix) =>
                              majProduit(produit, { prixVariantes: { [v.id]: prix } }, { variantes: produit.variantes.map((x) => (x.id === v.id ? { ...x, prix } : x)) })
                            }
                          />
                        </span>
                      ))
                    ) : (
                      <ChampPrix valeur={produit.prix} libelle={`Prix ${produit.nom}`} onValider={(prix) => majProduit(produit, { prix }, { prix })} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => majProduit(produit, { actif: !produit.actif }, { actif: !produit.actif })}
                    className="grid size-10 place-items-center rounded-full text-creme/60 hover:bg-white/5 hover:text-white"
                    aria-label={produit.actif ? `Masquer ${produit.nom} de la carte` : `Afficher ${produit.nom} sur la carte`}
                    title={produit.actif ? "Visible sur la carte" : "Masqué de la carte"}
                  >
                    {produit.actif ? <Eye className="size-[1.1rem]" /> : <EyeOff className="size-[1.1rem]" />}
                  </button>
                  <Interrupteur actif={produit.disponible} onChange={(disponible) => majProduit(produit, { disponible }, { disponible })} libelle={`${produit.nom} disponible`} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Interrupteur({ actif, onChange, libelle }: { actif: boolean; onChange: (v: boolean) => void; libelle: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      onClick={() => onChange(!actif)}
      className={clsx("relative h-7 w-12 shrink-0 rounded-full transition-colors", actif ? "bg-emerald-500" : "bg-white/15")}
    >
      <span className={clsx("absolute top-1 size-5 rounded-full bg-white shadow transition-transform", actif ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

function ChampPrix({ valeur, onValider, libelle }: { valeur: number; onValider: (centimes: number) => void; libelle: string }) {
  const [texte, setTexte] = useState(versTexte(valeur));
  const [precedente, setPrecedente] = useState(valeur);
  if (valeur !== precedente) {
    setPrecedente(valeur);
    setTexte(versTexte(valeur));
  }
  const valider = () => {
    const centimes = versCentimes(texte);
    if (Number.isNaN(centimes) || centimes < 0 || centimes > 100_000) {
      setTexte(versTexte(valeur));
      return;
    }
    setTexte(versTexte(centimes));
    if (centimes !== valeur) onValider(centimes);
  };
  return (
    <span className="relative">
      <input
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onBlur={valider}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        inputMode="decimal"
        aria-label={libelle}
        className="h-9 w-20 rounded-xl bg-nuit-950 pl-3 pr-6 text-right text-sm font-bold tabular-nums text-white outline-none ring-1 ring-white/10 focus:ring-ambre-400"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-creme/50">€</span>
    </span>
  );
}
