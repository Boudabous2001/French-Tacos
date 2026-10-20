import type { Centimes } from "@/lib/argent";

/** Une commune desservie. Le code INSEE évite les confusions entre homonymes. */
export interface CommuneDesservie {
  nom: string;
  codePostal: string;
  insee?: string;
}

export interface Zone {
  id: string;
  nom: string;
  communes: CommuneDesservie[];
  frais: Centimes;
  minimum: Centimes;
  /** Livraison offerte à partir de ce montant (null = jamais). */
  gratuiteDes: Centimes | null;
  /** Temps de trajet ajouté à la préparation. */
  trajetMinutes: number;
  active: boolean;
}

/** Adresse telle que renvoyée par le géocodage national (Géoplateforme IGN). */
export interface AdresseLivraison {
  libelle: string;
  numero?: string;
  rue?: string;
  codePostal: string;
  ville: string;
  insee?: string;
  latitude?: number;
  longitude?: number;
}

export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^(st|ste) /, (m) => (m === "st " ? "saint " : "sainte "));
}

export function trouverZone(zones: Zone[], adresse: Pick<AdresseLivraison, "codePostal" | "ville" | "insee">): Zone | null {
  for (const zone of zones) {
    if (!zone.active) continue;
    const trouvee = zone.communes.some((c) => {
      if (c.insee && adresse.insee) return c.insee === adresse.insee;
      return c.codePostal === adresse.codePostal && normaliser(c.nom) === normaliser(adresse.ville);
    });
    if (trouvee) return zone;
  }
  return null;
}

export function fraisLivraison(zone: Zone, sousTotal: Centimes): Centimes {
  if (zone.gratuiteDes !== null && sousTotal >= zone.gratuiteDes) return 0;
  return zone.frais;
}

/** Distance à vol d'oiseau en km (formule de haversine). */
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
