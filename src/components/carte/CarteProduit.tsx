"use client";

import { clsx } from "clsx";
import { Plus } from "lucide-react";
import Image from "next/image";

import { Badges } from "@/components/carte/Badges";
import { Prix } from "@/components/ui/Prix";
import { prixDepart } from "@/lib/catalogue/prix";
import type { Produit } from "@/lib/catalogue/types";
import { useInterface } from "@/stores/interface";

/** Carte produit en ligne (liste façon appli de livraison). */
export function CarteProduit({ produit, prioritaire = false }: { produit: Produit; prioritaire?: boolean }) {
  const ouvrirProduit = useInterface((e) => e.ouvrirProduit);
  const indisponible = !produit.disponible;

  return (
    <button
      type="button"
      onClick={() => ouvrirProduit(produit.id)}
      disabled={indisponible}
      className={clsx(
        "group relative flex w-full gap-4 rounded-[1.6rem] bg-white p-3 text-left shadow-carte ring-1 ring-ligne transition duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgb(31_22_17/0.35)] hover:ring-braise-200 disabled:cursor-not-allowed disabled:hover:translate-y-0",
      )}
      aria-label={`${produit.nom}${indisponible ? ", indisponible" : ""}`}
    >
      <div className={clsx("flex min-w-0 flex-1 flex-col py-1 pl-1", indisponible && "opacity-55")}>
        <Badges badges={produit.badges} className="mb-1.5" />
        <h3 className="text-[1.05rem] font-extrabold leading-snug">{produit.nom}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-gris">{produit.description}</p>
        <div className="mt-auto flex items-end gap-2 pt-2">
          <Prix montant={prixDepart(produit)} depart={produit.variantes.length > 1} className="text-xl font-extrabold text-braise-600" />
          {indisponible && <span className="mb-0.5 text-xs font-bold text-alerte">Victime de son succès</span>}
        </div>
      </div>
      <div className="relative size-28 shrink-0 overflow-hidden rounded-[1.2rem] bg-sable sm:size-32">
        {produit.image && (
          <Image
            src={produit.image}
            alt=""
            fill
            sizes="128px"
            priority={prioritaire}
            className={clsx("object-cover transition duration-500 group-hover:scale-[1.06]", indisponible && "grayscale")}
          />
        )}
        {!indisponible && (
          <span className="absolute bottom-2 right-2 grid size-9 place-items-center rounded-full bg-braise-500 text-white shadow-[0_6px_16px_-4px_rgb(251_106_11/0.9)] transition duration-300 group-hover:scale-110 group-hover:rotate-90">
            <Plus className="size-5" strokeWidth={2.75} aria-hidden />
          </span>
        )}
      </div>
    </button>
  );
}

/** Grande carte verticale (tacos : Simple / Double / Triple, comme sur l'affiche). */
export function CarteVedette({ produit, prioritaire = false }: { produit: Produit; prioritaire?: boolean }) {
  const ouvrirProduit = useInterface((e) => e.ouvrirProduit);
  const indisponible = !produit.disponible;
  const viandes = produit.groupes.find((g) => g.id === "viandes")?.min;

  return (
    <button
      type="button"
      onClick={() => ouvrirProduit(produit.id)}
      disabled={indisponible}
      className="group relative flex w-full flex-col overflow-hidden rounded-[1.75rem] bg-white text-left shadow-carte ring-1 ring-ligne transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgb(251_106_11/0.45)] hover:ring-braise-300 disabled:opacity-60"
    >
      <div className="bg-braise-500 py-2 text-center">
        <span className="titre-display text-2xl text-white">{produit.nom.replace(/^Tacos /, "")}</span>
      </div>
      <div className="relative aspect-[4/3] bg-gradient-to-b from-sable to-white">
        {produit.image && (
          <Image
            src={produit.image}
            alt=""
            fill
            sizes="(min-width: 640px) 30vw, 90vw"
            priority={prioritaire}
            className="object-contain p-3 transition duration-500 group-hover:scale-105 group-hover:-rotate-2"
          />
        )}
        <Badges badges={produit.badges} className="absolute left-3 top-3" />
      </div>
      <div className="flex items-end justify-between gap-3 p-4 pt-2">
        <div>
          {viandes && (
            <p className="titre-display text-sm text-gris">
              {viandes} viande{viandes > 1 ? "s" : ""} · sauce au choix
            </p>
          )}
          <p className="mt-0.5 text-xs text-gris">Frites et sauce fromagère dedans</p>
        </div>
        <span className="rounded-2xl bg-braise-500 px-3.5 py-1.5 text-white shadow-[0_8px_20px_-8px_rgb(251_106_11/0.9)]">
          <Prix montant={prixDepart(produit)} className="titre-display text-2xl" />
        </span>
      </div>
    </button>
  );
}
