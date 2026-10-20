import { clsx } from "clsx";
import { Crown, Flame, Leaf, Sparkles, Zap } from "lucide-react";

import type { Badge } from "@/lib/catalogue/types";

const BADGES: Record<Badge, { libelle: string; Icone: typeof Flame; classe: string }> = {
  populaire: { libelle: "Populaire", Icone: Flame, classe: "bg-braise-100 text-braise-700" },
  gourmand: { libelle: "Gourmand", Icone: Crown, classe: "bg-amber-100 text-amber-800" },
  nouveau: { libelle: "Nouveau", Icone: Sparkles, classe: "bg-violet-100 text-violet-700" },
  vegetarien: { libelle: "Végétarien", Icone: Leaf, classe: "bg-emerald-100 text-emerald-700" },
  epice: { libelle: "Épicé", Icone: Zap, classe: "bg-red-100 text-red-700" },
};

export function Badges({ badges, className }: { badges: Badge[]; className?: string }) {
  if (badges.length === 0) return null;
  return (
    <ul className={clsx("flex flex-wrap gap-1.5", className)}>
      {badges.map((b) => {
        const { libelle, Icone, classe } = BADGES[b];
        return (
          <li key={b} className={clsx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-bold", classe)}>
            <Icone className="size-3" aria-hidden />
            {libelle}
          </li>
        );
      })}
    </ul>
  );
}
