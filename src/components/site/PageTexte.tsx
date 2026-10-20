import type { ReactNode } from "react";

/** Gabarit des pages de contenu (infos, mentions légales, CGV…). */
export function PageTexte({ surtitre, titre, introduction, children }: { surtitre?: string; titre: string; introduction?: ReactNode; children: ReactNode }) {
  return (
    <>
      <section className="grain relative overflow-hidden bg-nuit-900 pb-10 pt-8 text-creme sm:pb-14 sm:pt-12">
        <div className="halo-neon pointer-events-none absolute -top-24 right-0 h-72 w-[40rem] opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          {surtitre && <p className="animate-apparition font-pinceau text-xl text-ambre-400">{surtitre}</p>}
          <h1 className="animate-apparition titre-display mt-1 text-5xl text-white [animation-delay:80ms] sm:text-6xl">{titre}</h1>
          {introduction && <div className="animate-apparition mt-3 max-w-xl text-creme/75 [animation-delay:160ms]">{introduction}</div>}
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">{children}</div>
    </>
  );
}

/** Mise en forme des textes juridiques. */
export function Article({ children }: { children: ReactNode }) {
  return (
    <article className="space-y-4 text-[0.95rem] leading-relaxed text-encre/85 [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-encre [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-encre">
      {children}
    </article>
  );
}

export function AValider() {
  return (
    <p className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
      Texte type fourni à titre de base de travail : à compléter et à faire valider par le restaurant avant la mise en ligne.
    </p>
  );
}
