"use client";

import { clsx } from "clsx";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { CarteProduit, CarteVedette } from "@/components/carte/CarteProduit";
import type { Carte } from "@/lib/catalogue/types";

export function CarteInteractive({ carte }: { carte: Carte }) {
  const categories = useMemo(
    () => carte.categories.filter((c) => carte.produits.some((p) => p.categorieId === c.id)),
    [carte],
  );
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const nav = useRef<HTMLDivElement>(null);
  const clicEnCours = useRef(false);

  // Surligne la catégorie visible à l'écran.
  useEffect(() => {
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (clicEnCours.current) return;
        const visibles = entrees.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibles[0]) setActive(visibles[0].target.id);
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    for (const c of categories) {
      const el = document.getElementById(c.id);
      if (el) observateur.observe(el);
    }
    return () => observateur.disconnect();
  }, [categories]);

  // Garde l'onglet actif visible dans la barre.
  useEffect(() => {
    const onglet = nav.current?.querySelector<HTMLElement>(`[data-categorie="${active}"]`);
    if (onglet && nav.current) {
      const { offsetLeft, offsetWidth } = onglet;
      nav.current.scrollTo({ left: offsetLeft - nav.current.clientWidth / 2 + offsetWidth / 2, behavior: "smooth" });
    }
  }, [active]);

  const allerA = (id: string) => {
    setActive(id);
    clicEnCours.current = true;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    window.setTimeout(() => (clicEnCours.current = false), 900);
  };

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-ligne/80 bg-papier/90 backdrop-blur-xl sm:top-[4.5rem]">
        <nav ref={nav} aria-label="Catégories" className="barre-defilement-fine mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 py-3 sm:px-6">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              data-categorie={c.id}
              onClick={() => allerA(c.id)}
              aria-current={active === c.id ? "true" : undefined}
              className={clsx(
                "relative shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                active === c.id ? "text-white" : "text-gris hover:text-encre",
              )}
            >
              {active === c.id && (
                <motion.span
                  layoutId="categorie-active"
                  className="absolute inset-0 rounded-full bg-nuit-900"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative">{c.nom}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {categories.map((categorie, indexCategorie) => {
          const produits = carte.produits.filter((p) => p.categorieId === categorie.id);
          const vedette = categorie.id === "tacos";
          return (
            <section key={categorie.id} id={categorie.id} aria-labelledby={`titre-${categorie.id}`} className="scroll-mt-36 pt-10">
              <motion.header
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                className="relative mb-5 flex h-28 items-end overflow-hidden rounded-[1.75rem] bg-nuit-900 p-5 sm:h-36 sm:p-7"
              >
                {categorie.image && (
                  <Image
                    src={categorie.image}
                    alt=""
                    fill
                    sizes="(min-width: 1152px) 1100px, 100vw"
                    priority={indexCategorie === 0}
                    className="object-cover object-[70%_50%] opacity-90"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-nuit-900 via-nuit-900/80 to-nuit-900/0" aria-hidden />
                <div className="relative">
                  {categorie.accroche && <p className="font-pinceau text-base text-ambre-400 sm:text-lg">{categorie.accroche}</p>}
                  <h2 id={`titre-${categorie.id}`} className="titre-display text-4xl text-white sm:text-5xl">
                    {categorie.nom}
                  </h2>
                </div>
              </motion.header>

              <ul className={clsx("grid gap-3 sm:gap-4", vedette ? "grid-cols-1 sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
                {produits.map((produit, i) => (
                  <motion.li
                    key={produit.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: Math.min(i, 5) * 0.05 }}
                  >
                    {vedette ? (
                      <>
                        <div className="sm:hidden">
                          <CarteProduit produit={produit} prioritaire={indexCategorie === 0} />
                        </div>
                        <div className="hidden h-full sm:block">
                          <CarteVedette produit={produit} />
                        </div>
                      </>
                    ) : (
                      <CarteProduit produit={produit} prioritaire={indexCategorie === 0 && i < 4} />
                    )}
                  </motion.li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
