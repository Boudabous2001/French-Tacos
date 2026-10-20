import { describe, expect, it } from "vitest";

import { creneauxDisponibles, etatOuverture, instantParis, partiesParis, type Semaine } from "./horaires";

const semaine: Semaine = {
  lundi: [],
  mardi: [{ debut: "11:30", fin: "14:30" }, { debut: "18:00", fin: "23:00" }],
  mercredi: [{ debut: "11:30", fin: "14:30" }, { debut: "18:00", fin: "23:00" }],
  jeudi: [{ debut: "11:30", fin: "14:30" }],
  vendredi: [{ debut: "18:00", fin: "01:00" }],
  samedi: [{ debut: "18:00", fin: "01:00" }],
  dimanche: [],
};

describe("heure de Paris", () => {
  it("convertit une heure locale en instant, été comme hiver", () => {
    expect(instantParis("2026-07-14", "12:00").toISOString()).toBe("2026-07-14T10:00:00.000Z");
    expect(instantParis("2026-12-24", "12:00").toISOString()).toBe("2026-12-24T11:00:00.000Z");
  });

  it("gère le passage à l'heure d'hiver (25 octobre 2026)", () => {
    expect(instantParis("2026-10-25", "18:00").toISOString()).toBe("2026-10-25T17:00:00.000Z");
    expect(partiesParis(new Date("2026-10-24T22:30:00Z"))).toMatchObject({ date: "2026-10-25", heures: 0, minutes: 30, jour: "dimanche" });
  });
});

describe("ouverture", () => {
  it("ouvert un mardi midi, fermé le lundi", () => {
    // Mardi 20 octobre 2026, 12 h à Paris
    expect(etatOuverture(instantParis("2026-10-20", "12:00"), semaine, []).ouvert).toBe(true);
    const lundi = etatOuverture(instantParis("2026-10-19", "12:00"), semaine, []);
    expect(lundi.ouvert).toBe(false);
    expect(lundi.ouvreA?.toISOString()).toBe(instantParis("2026-10-20", "11:30").toISOString());
  });

  it("un service du vendredi soir reste ouvert après minuit", () => {
    const etat = etatOuverture(instantParis("2026-10-24", "00:30"), semaine, []); // samedi 0 h 30
    expect(etat.ouvert).toBe(true);
    expect(etat.fermeA?.toISOString()).toBe(instantParis("2026-10-24", "01:00").toISOString());
  });

  it("respecte une fermeture exceptionnelle", () => {
    const etat = etatOuverture(instantParis("2026-10-20", "12:00"), semaine, [{ du: "2026-10-20", au: "2026-10-21" }]);
    expect(etat.ouvert).toBe(false);
    expect(etat.ouvreA?.toISOString()).toBe(instantParis("2026-10-22", "11:30").toISOString());
  });
});

describe("créneaux", () => {
  it("commencent après le délai de préparation, par pas de 15 min", () => {
    const creneaux = creneauxDisponibles({
      maintenant: instantParis("2026-10-20", "12:02"),
      semaine,
      fermetures: [],
      delaiMinutes: 20,
      jours: 0,
    });
    expect(creneaux[0].libelle).toBe("12h30");
    expect(creneaux.at(-1)?.libelle).toBe("23h00");
    expect(creneaux.some((c) => c.libelle === "16h00")).toBe(false);
  });

  it("aucun créneau un jour fermé", () => {
    const creneaux = creneauxDisponibles({
      maintenant: instantParis("2026-10-19", "10:00"),
      semaine,
      fermetures: [],
      delaiMinutes: 20,
      jours: 0,
    });
    expect(creneaux).toHaveLength(0);
  });
});
