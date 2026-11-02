import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { LISTES, PRODUITS } from "./donnees";
import { empreinteSelection, evaluerSelection, prixDepart, selectionInitiale } from "./prix";
import type { ListeChoix, Produit } from "./types";

const listes: Record<string, ListeChoix> = Object.fromEntries(LISTES.map((l) => [l.id, l]));
const produit = (id: string) => PRODUITS.find((p) => p.id === id) as Produit;

describe("tacos", () => {
  it("prix seul ou menu, suppléments et lardons à 2 €", () => {
    const resultat = evaluerSelection(
      produit("tacos-double"),
      { varianteId: "seul", options: { viandes: ["kebab", "kebab"], sauces: ["algerienne"], supplements: ["cheddar", "lardon"] } },
      listes,
    );
    expect(resultat.ok).toBe(true);
    expect(resultat.prixUnitaire).toBe(900 + 100 + 200);
  });

  it("le menu exige une boisson", () => {
    const sansBoisson = evaluerSelection(produit("tacos-simple"), { varianteId: "menu", options: { viandes: ["steak"] } }, listes);
    expect(sansBoisson.ok).toBe(false);
    const menu = evaluerSelection(produit("tacos-simple"), { varianteId: "menu", options: { viandes: ["steak"], boisson: ["oasis"] } }, listes);
    expect(menu.prixUnitaire).toBe(1000);
  });

  it("le gratiné coûte 2,00 / 2,50 / 3,00 € selon la taille", () => {
    const gratine = (id: string, viandes: string[]) =>
      evaluerSelection(produit(id), { varianteId: "seul", options: { viandes, gratine: ["chevre-miel"] } }, listes).prixUnitaire;
    expect(gratine("tacos-simple", ["kebab"])).toBe(800 + 200);
    expect(gratine("tacos-double", ["kebab", "farmer"])).toBe(900 + 250);
    expect(gratine("tacos-maxi", ["kebab", "farmer", "nuggets"])).toBe(1100 + 300);
  });

  it("refuse un tacos double avec une seule viande", () => {
    const resultat = evaluerSelection(produit("tacos-double"), { varianteId: "seul", options: { viandes: ["poulet-curry"] } }, listes);
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) expect(resultat.erreurs[0].message).toContain("encore 1");
  });

  it("refuse trop de sauces, un choix inventé et un choix en rupture", () => {
    expect(
      evaluerSelection(produit("tacos-simple"), { varianteId: "seul", options: { viandes: ["steak"], sauces: ["blanche", "curry", "biggy"] } }, listes).ok,
    ).toBe(false);
    expect(evaluerSelection(produit("tacos-simple"), { varianteId: "seul", options: { viandes: ["caviar"] } }, listes).ok).toBe(false);
    const enRupture = { ...listes, viandes: { ...listes.viandes, items: listes.viandes.items.map((i) => (i.id === "farmer" ? { ...i, disponible: false } : i)) } };
    expect(evaluerSelection(produit("tacos-simple"), { varianteId: "seul", options: { viandes: ["farmer"] } }, enRupture).ok).toBe(false);
  });
});

describe("burgers", () => {
  it("menu +2 € avec boisson, naan +1 €", () => {
    const resultat = evaluerSelection(
      produit("burger-supreme"),
      { varianteId: null, options: { pain: ["naan"], formule: ["menu"], boisson: ["coca"] } },
      listes,
    );
    expect(resultat.ok).toBe(true);
    expect(resultat.prixUnitaire).toBe(800 + 100 + 200);
  });

  it("ignore la boisson quand le burger est pris seul", () => {
    const seul = evaluerSelection(produit("burger-cheese"), { varianteId: null, options: { pain: ["bun"], formule: ["seul"], boisson: ["coca"] } }, listes);
    expect(seul.ok).toBe(true);
    expect(seul.prixUnitaire).toBe(600);
    if (seul.ok) expect(seul.selection.options.boisson).toBeUndefined();
  });

  it("pré-sélectionne le pain burger et la formule seule", () => {
    expect(selectionInitiale(produit("burger-baps"), listes)).toEqual({ varianteId: null, options: { pain: ["bun"], formule: ["seul"] } });
  });
});

describe("kapsalon et assiettes", () => {
  it("le nombre de viandes suit la formule, canette à +1 €", () => {
    const deux = evaluerSelection(produit("kapsalon"), { varianteId: "v2", options: { viandes: ["kebab", "tenders"], boisson: ["perrier"] } }, listes);
    expect(deux.ok).toBe(true);
    expect(deux.prixUnitaire).toBe(1200 + 100);
    const incomplet = evaluerSelection(produit("assiette"), { varianteId: "v3", options: { viandes: ["kebab"] } }, listes);
    expect(incomplet.ok).toBe(false);
    expect(evaluerSelection(produit("assiette"), { varianteId: "v3", options: { viandes: ["kebab", "kebab", "steak"] } }, listes).prixUnitaire).toBe(1350);
  });
});

describe("sandwichs", () => {
  it("pain maison par défaut, suppléments payants", () => {
    const initiale = selectionInitiale(produit("sandwich-mistral"), listes);
    expect(initiale.options.pain).toEqual(["pain-maison"]);
    const resultat = evaluerSelection(produit("sandwich-mistral"), { varianteId: null, options: { pain: ["cheese-naan"], supplements: ["oeuf"] } }, listes);
    expect(resultat.prixUnitaire).toBe(1000 + 100);
  });
});

describe("outils", () => {
  it("prix de départ = plus petite variante", () => {
    expect(prixDepart(produit("tacos-maxi"))).toBe(1100);
    expect(prixDepart(produit("texmex-nuggets"))).toBe(500);
    expect(prixDepart(produit("burger-chicken"))).toBe(700);
  });

  it("deux compositions identiques ont la même empreinte", () => {
    const a = empreinteSelection("tacos-double", { varianteId: "seul", options: { viandes: ["kebab", "steak"], sauces: ["blanche"] } });
    const b = empreinteSelection("tacos-double", { varianteId: "seul", options: { sauces: ["blanche"], viandes: ["steak", "kebab"] } });
    expect(a).toBe(b);
  });

  it("chaque produit et chaque choix ont une image présente sur le disque", () => {
    const images = [...PRODUITS.map((p) => p.image), ...LISTES.flatMap((l) => l.items.map((i) => i.image)).filter(Boolean)];
    for (const image of images) expect(existsSync(`public${image}`), image ?? "image absente").toBe(true);
    for (const p of PRODUITS) for (const g of p.groupes) expect(listes[g.listeId], `${p.id}/${g.id}`).toBeDefined();
  });
});
