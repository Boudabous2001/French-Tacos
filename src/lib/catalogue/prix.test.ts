import { describe, expect, it } from "vitest";

import { LISTES, PRODUITS } from "./donnees";
import { empreinteSelection, evaluerSelection, prixDepart, selectionInitiale } from "./prix";
import type { ListeChoix, Produit } from "./types";

const listes: Record<string, ListeChoix> = Object.fromEntries(LISTES.map((l) => [l.id, l]));
const produit = (id: string) => PRODUITS.find((p) => p.id === id) as Produit;

describe("tacos", () => {
  it("compte le bon nombre de viandes et facture les suppléments", () => {
    const resultat = evaluerSelection(
      produit("tacos-double"),
      { varianteId: null, options: { viandes: ["kebab", "kebab"], sauces: ["algerienne"], supplements: ["cheddar", "bacon"] } },
      listes,
    );
    expect(resultat.ok).toBe(true);
    expect(resultat.prixUnitaire).toBe(950 + 200);
  });

  it("refuse un tacos double avec une seule viande", () => {
    const resultat = evaluerSelection(produit("tacos-double"), { varianteId: null, options: { viandes: ["poulet"] } }, listes);
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) expect(resultat.erreurs[0].message).toContain("encore 1");
  });

  it("refuse trop de sauces et un choix inventé", () => {
    const trop = evaluerSelection(
      produit("tacos-simple"),
      { varianteId: null, options: { viandes: ["steak"], sauces: ["blanche", "curry", "ketchup"] } },
      listes,
    );
    expect(trop.ok).toBe(false);
    const invente = evaluerSelection(produit("tacos-simple"), { varianteId: null, options: { viandes: ["caviar"] } }, listes);
    expect(invente.ok).toBe(false);
  });

  it("refuse un choix en rupture", () => {
    const enRupture = { ...listes, viandes: { ...listes.viandes, items: listes.viandes.items.map((i) => (i.id === "kefta" ? { ...i, disponible: false } : i)) } };
    const resultat = evaluerSelection(produit("tacos-simple"), { varianteId: null, options: { viandes: ["kefta"] } }, enRupture);
    expect(resultat.ok).toBe(false);
  });
});

describe("burgers", () => {
  it("le menu coûte 3 € de plus et exige une boisson", () => {
    const sansBoisson = evaluerSelection(produit("burger-bacon"), { varianteId: "double", options: { formule: ["menu"] } }, listes);
    expect(sansBoisson.ok).toBe(false);

    const menu = evaluerSelection(
      produit("burger-bacon"),
      { varianteId: "double", options: { formule: ["menu"], boisson: ["coca"], supplements: ["oeuf"] } },
      listes,
    );
    expect(menu.ok).toBe(true);
    expect(menu.prixUnitaire).toBe(800 + 300 + 100);
  });

  it("ignore la boisson quand le burger est pris seul", () => {
    const seul = evaluerSelection(produit("burger-cheese"), { varianteId: "simple", options: { formule: ["seul"], boisson: ["coca"] } }, listes);
    expect(seul.ok).toBe(true);
    if (seul.ok) expect(seul.selection.options.boisson).toBeUndefined();
  });

  it("refuse un supplément absent des burgers", () => {
    const resultat = evaluerSelection(
      produit("burger-cheese"),
      { varianteId: "simple", options: { formule: ["seul"], supplements: ["jambon"] } },
      listes,
    );
    expect(resultat.ok).toBe(false);
  });

  it("pré-sélectionne la formule seule", () => {
    expect(selectionInitiale(produit("burger-big"), listes)).toEqual({ varianteId: "simple", options: { formule: ["seul"] } });
  });
});

describe("sandwichs", () => {
  it("menu : boisson obligatoire, prix de la variante", () => {
    const resultat = evaluerSelection(produit("sandwich-kebab"), { varianteId: "menu", options: { boisson: ["sprite"] } }, listes);
    expect(resultat.ok).toBe(true);
    expect(resultat.prixUnitaire).toBe(850);
  });

  it("refuse une variante inconnue", () => {
    const resultat = evaluerSelection(produit("sandwich-kebab"), { varianteId: "geant", options: {} }, listes);
    expect(resultat.ok).toBe(false);
  });
});

describe("outils", () => {
  it("prix de départ = plus petite variante", () => {
    expect(prixDepart(produit("burger-cheese"))).toBe(550);
    expect(prixDepart(produit("assiette-steak"))).toBe(1100);
  });

  it("deux compositions identiques ont la même empreinte", () => {
    const a = empreinteSelection("tacos-double", { varianteId: null, options: { viandes: ["kebab", "poulet"], sauces: ["blanche"] } });
    const b = empreinteSelection("tacos-double", { varianteId: null, options: { sauces: ["blanche"], viandes: ["poulet", "kebab"] } });
    expect(a).toBe(b);
  });

  it("chaque produit de la carte a une image et des groupes cohérents", () => {
    for (const p of PRODUITS) {
      expect(p.image, p.id).toBeTruthy();
      for (const g of p.groupes) expect(listes[g.listeId], `${p.id}/${g.id}`).toBeDefined();
    }
  });
});
