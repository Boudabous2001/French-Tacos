"use client";

import { useEffect } from "react";

import type { Carte } from "@/lib/catalogue/types";
import type { ReglagesPublics } from "@/lib/reglages-type";
import { useInterface } from "@/stores/interface";

export function HydrateurBoutique({ carte, reglages }: { carte: Carte | null; reglages: ReglagesPublics | null }) {
  useEffect(() => {
    useInterface.getState().fournirDonnees(carte, reglages);
  }, [carte, reglages]);
  return null;
}
