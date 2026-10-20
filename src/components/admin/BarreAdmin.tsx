"use client";

import { clsx } from "clsx";
import { motion } from "motion/react";
import { ClipboardList, ExternalLink, LogOut, Pause, Play, Settings, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, useTransition } from "react";

import { basculerPause, seDeconnecter } from "@/app/admin/actions";
import { Couronne } from "@/components/marque/Logo";

const LIENS = [
  { href: "/admin/commandes", libelle: "Commandes", Icone: ClipboardList },
  { href: "/admin/carte", libelle: "Carte", Icone: UtensilsCrossed },
  { href: "/admin/reglages", libelle: "Réglages", Icone: Settings },
];

export function BarreAdmin({ nom, enPause }: { nom: string; enPause: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-nuit-900/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-3 sm:gap-4 sm:px-5">
        <Link href="/admin/commandes" className="flex items-center gap-2" aria-label="Back-office French Tacos">
          <Couronne className="h-5 w-8 text-ambre-400" />
          <span className="titre-display hidden text-lg text-white lg:inline">Back-office</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Back-office">
          <Suspense fallback={<Onglets chemin={null} />}>
            <OngletsActifs />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <InterrupteurPause enPauseInitial={enPause} />
          <Link
            href="/"
            target="_blank"
            className="hidden size-10 place-items-center rounded-full text-creme/60 hover:bg-white/5 hover:text-white sm:grid"
            aria-label="Voir le site"
            title="Voir le site"
          >
            <ExternalLink className="size-[1.1rem]" />
          </Link>
          <form action={seDeconnecter}>
            <button
              type="submit"
              className="grid size-10 place-items-center rounded-full text-creme/60 hover:bg-white/5 hover:text-white"
              aria-label={`Se déconnecter (${nom})`}
              title={`Se déconnecter (${nom})`}
            >
              <LogOut className="size-[1.1rem]" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function OngletsActifs() {
  return <Onglets chemin={usePathname()} />;
}

function Onglets({ chemin }: { chemin: string | null }) {
  return LIENS.map(({ href, libelle, Icone }) => {
    const actif = chemin?.startsWith(href) ?? false;
    return (
      <Link
        key={href}
        href={href}
        className={clsx("relative flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold transition sm:px-4", actif ? "text-nuit-900" : "text-creme/70 hover:text-white")}
        aria-current={actif ? "page" : undefined}
      >
        {actif && <motion.span layoutId="onglet-admin" className="absolute inset-0 rounded-full bg-ambre-400" />}
        <Icone className="relative size-4" aria-hidden />
        <span className="relative hidden sm:inline">{libelle}</span>
      </Link>
    );
  });
}

function InterrupteurPause({ enPauseInitial }: { enPauseInitial: boolean }) {
  const [enPause, setEnPause] = useState(enPauseInitial);
  const [enCours, demarrer] = useTransition();

  const basculer = () =>
    demarrer(async () => {
      const suivant = !enPause;
      setEnPause(suivant);
      const resultat = await basculerPause(suivant);
      if (!resultat?.ok) setEnPause(!suivant);
    });

  return (
    <button
      type="button"
      onClick={basculer}
      disabled={enCours}
      className={clsx(
        "flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-extrabold transition sm:px-4",
        enPause ? "bg-amber-400 text-nuit-900 hover:bg-amber-300" : "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25",
      )}
      aria-pressed={enPause}
      title={enPause ? "Les clients ne peuvent plus commander. Cliquer pour reprendre." : "Mettre les commandes en ligne en pause (coup de feu, rupture…)"}
    >
      {enPause ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
      <span className="hidden sm:inline">{enPause ? "Commandes en pause" : "Commandes ouvertes"}</span>
      <span className="sm:hidden">{enPause ? "Pause" : "Ouvert"}</span>
    </button>
  );
}
