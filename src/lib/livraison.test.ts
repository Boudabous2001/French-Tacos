import { describe, expect, it } from "vitest";

import { distanceKm, fraisLivraison, normaliser, trouverZone, type Zone } from "./livraison";

const zones: Zone[] = [
  {
    id: "z1",
    nom: "Centre",
    communes: [{ nom: "Caen", codePostal: "14000", insee: "14118" }],
    frais: 200,
    minimum: 1500,
    gratuiteDes: 3500,
    trajetMinutes: 15,
    active: true,
  },
  {
    id: "z2",
    nom: "Périphérie",
    communes: [{ nom: "Hérouville-Saint-Clair", codePostal: "14200" }],
    frais: 350,
    minimum: 2000,
    gratuiteDes: null,
    trajetMinutes: 25,
    active: true,
  },
];

describe("zones", () => {
  it("trouve la zone par code INSEE", () => {
    expect(trouverZone(zones, { codePostal: "14000", ville: "Caen", insee: "14118" })?.id).toBe("z1");
  });

  it("trouve la zone par code postal + nom, accents et tirets ignorés", () => {
    expect(trouverZone(zones, { codePostal: "14200", ville: "herouville saint clair" })?.id).toBe("z2");
    expect(normaliser("St-Denis")).toBe("saint denis");
  });

  it("refuse une commune hors zone", () => {
    expect(trouverZone(zones, { codePostal: "75001", ville: "Paris", insee: "75101" })).toBeNull();
  });

  it("offre la livraison au-delà du seuil", () => {
    expect(fraisLivraison(zones[0], 3000)).toBe(200);
    expect(fraisLivraison(zones[0], 3500)).toBe(0);
    expect(fraisLivraison(zones[1], 9000)).toBe(350);
  });

  it("calcule une distance plausible", () => {
    const d = distanceKm({ latitude: 49.1829, longitude: -0.3707 }, { latitude: 49.2014, longitude: -0.3286 });
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(4);
  });
});
