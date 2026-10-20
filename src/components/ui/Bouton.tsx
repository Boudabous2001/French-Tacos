import { clsx } from "clsx";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type VarianteBouton = "primaire" | "sombre" | "contour" | "fantome" | "clair" | "danger";
export type TailleBouton = "sm" | "md" | "lg";

const VARIANTES: Record<VarianteBouton, string> = {
  primaire:
    "bg-braise-500 text-white shadow-[0_10px_30px_-10px_rgb(251_106_11/0.8)] hover:bg-braise-600 active:bg-braise-700 disabled:bg-braise-300 disabled:shadow-none",
  sombre: "bg-nuit-900 text-creme hover:bg-nuit-800 active:bg-nuit-950 disabled:bg-nuit-600",
  contour: "border-2 border-current bg-transparent hover:bg-black/5 disabled:opacity-50",
  fantome: "bg-transparent hover:bg-black/5 disabled:opacity-50",
  clair: "bg-white text-encre shadow-carte ring-1 ring-ligne hover:bg-sable disabled:opacity-60",
  danger: "bg-alerte text-white hover:bg-red-700 disabled:opacity-60",
};

const TAILLES: Record<TailleBouton, string> = {
  sm: "h-9 gap-1.5 px-3.5 text-sm",
  md: "h-12 gap-2 px-5 text-[0.95rem]",
  lg: "h-14 gap-2.5 px-7 text-base",
};

export function classesBouton(variante: VarianteBouton = "primaire", taille: TailleBouton = "md", className?: string) {
  return clsx(
    "relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-bold tracking-[0.01em]",
    "transition-[background-color,box-shadow,transform,opacity] duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100",
    VARIANTES[variante],
    TAILLES[taille],
    className,
  );
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBouton;
  taille?: TailleBouton;
  chargement?: boolean;
  icone?: ReactNode;
}

export function Bouton({ variante, taille, chargement, icone, className, children, disabled, type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={classesBouton(variante, taille, className)}
      disabled={disabled || chargement}
      aria-busy={chargement || undefined}
      {...props}
    >
      {chargement ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : icone}
      {children}
    </button>
  );
}
