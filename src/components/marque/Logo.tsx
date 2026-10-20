import { clsx } from "clsx";

export function Couronne({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 30" className={className} aria-hidden fill="currentColor">
      <path d="M3 22 6.5 4.5l10 9L24 1l7.5 12.5 10-9L45 22Z" />
      <rect x="4" y="24.5" width="40" height="4.5" rx="2.25" />
    </svg>
  );
}

/**
 * Logo typographique reprenant l'enseigne : couronne, « French » au pinceau,
 * « TACOS » en capitales. À remplacer par le fichier vectoriel officiel dès réception.
 */
export function Logo({ taille = "md", className }: { taille?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const tailles = {
    sm: { couronne: "h-2.5 w-4", french: "text-lg", tacos: "text-[0.6rem] tracking-[0.32em]" },
    md: { couronne: "h-3 w-5", french: "text-2xl", tacos: "text-[0.7rem] tracking-[0.34em]" },
    lg: { couronne: "h-5 w-8", french: "text-4xl", tacos: "text-sm tracking-[0.36em]" },
    xl: { couronne: "h-9 w-14", french: "text-7xl", tacos: "text-2xl tracking-[0.38em]" },
  }[taille];

  return (
    <span className={clsx("inline-flex select-none flex-col items-center leading-none", className)} role="img" aria-label="French Tacos">
      <Couronne className={clsx(tailles.couronne, "text-ambre-400 drop-shadow-[0_0_6px_rgb(251_106_11/0.6)]")} />
      <span className={clsx(tailles.french, "font-pinceau -rotate-[4deg] text-creme drop-shadow-[0_2px_0_rgb(0_0_0/0.35)]")}>French</span>
      <span className={clsx(tailles.tacos, "titre-display mt-0.5 pl-[0.34em] text-ambre-400")}>Tacos</span>
    </span>
  );
}
