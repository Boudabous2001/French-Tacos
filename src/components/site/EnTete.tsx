"use client";

import { clsx } from "clsx";
import { motion, useAnimationControls } from "motion/react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Logo } from "@/components/marque/Logo";
import { nombreArticles, usePanier } from "@/stores/panier";
import { useInterface } from "@/stores/interface";
import { PastilleOuverture } from "./StatutOuverture";

const LIENS = [
  { href: "/carte", libelle: "La carte" },
  { href: "/infos", libelle: "Infos & livraison" },
  { href: "/allergenes", libelle: "Allergènes" },
];

export function EnTete() {
  const [defile, setDefile] = useState(false);
  const reglages = useInterface((e) => e.reglages);

  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 8);
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
        defile ? "border-white/10 bg-nuit-900/90 shadow-[0_10px_30px_-20px_black] backdrop-blur-xl" : "border-transparent bg-nuit-900",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-[4.5rem] sm:px-6">
        <Link href="/" className="-my-2 shrink-0 rounded-xl px-1 py-1" aria-label="French Tacos, accueil">
          <span className="sm:hidden">
            <Logo taille="sm" />
          </span>
          <span className="hidden sm:block">
            <Logo taille="md" />
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="ml-4 hidden items-center gap-1 md:flex">
          <Suspense fallback={<Liens chemin={null} />}>
            <LiensActifs />
          </Suspense>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {reglages && (
            <PastilleOuverture
              horaires={reglages.horaires}
              fermetures={reglages.fermetures}
              enPause={reglages.commandes.enPause}
              className="hidden min-[400px]:inline-flex"
            />
          )}
          <BoutonPanier />
        </div>
      </div>
    </header>
  );
}

function LiensActifs() {
  return <Liens chemin={usePathname()} />;
}

function Liens({ chemin }: { chemin: string | null }) {
  return LIENS.map((lien) => {
    const actif = chemin?.startsWith(lien.href) ?? false;
    return (
      <Link
        key={lien.href}
        href={lien.href}
        className={clsx("relative rounded-full px-4 py-2 text-sm font-semibold transition-colors", actif ? "text-white" : "text-creme/70 hover:text-white")}
      >
        {actif && (
          <motion.span layoutId="lien-actif" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
        )}
        <span className="relative">{lien.libelle}</span>
      </Link>
    );
  });
}

function BoutonPanier() {
  const lignes = usePanier((e) => e.lignes);
  const hydrate = useInterface((e) => e.panierHydrate);
  const rebond = useInterface((e) => e.rebond);
  const ouvrirPanier = useInterface((e) => e.ouvrirPanier);
  const controles = useAnimationControls();
  const nombre = hydrate ? nombreArticles(lignes) : 0;

  useEffect(() => {
    if (rebond > 0) void controles.start({ scale: [1, 1.22, 0.94, 1.06, 1], rotate: [0, -8, 6, -2, 0], transition: { duration: 0.55 } });
  }, [rebond, controles]);

  return (
    <motion.button
      type="button"
      animate={controles}
      onClick={ouvrirPanier}
      className="relative grid size-11 place-items-center rounded-full bg-braise-500 text-white shadow-[0_0_24px_-4px_rgb(251_106_11/0.9)] transition-colors hover:bg-braise-600"
      aria-label={nombre > 0 ? `Ouvrir le panier, ${nombre} article${nombre > 1 ? "s" : ""}` : "Ouvrir le panier"}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {nombre > 0 && (
        <motion.span
          key={nombre}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-creme px-1 text-[0.7rem] font-extrabold text-nuit-900 ring-2 ring-nuit-900"
        >
          {nombre}
        </motion.span>
      )}
    </motion.button>
  );
}
