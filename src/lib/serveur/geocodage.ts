import "server-only";

import type { AdresseLivraison } from "@/lib/livraison";

/**
 * Service national d'adresses (Géoplateforme IGN, gratuit, sans clé).
 * Appelé uniquement depuis notre serveur : le navigateur ne parle qu'à /api/adresse.
 */
const API = "https://data.geopf.fr/geocodage/search";

interface Feature {
  geometry: { coordinates: [number, number] };
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    street?: string;
    name?: string;
    postcode: string;
    citycode: string;
    city: string;
    type: string;
  };
}

function versAdresse(f: Feature): AdresseLivraison {
  const p = f.properties;
  return {
    libelle: p.label,
    numero: p.housenumber,
    rue: p.street ?? p.name,
    codePostal: p.postcode,
    ville: p.city,
    insee: p.citycode,
    longitude: f.geometry.coordinates[0],
    latitude: f.geometry.coordinates[1],
  };
}

async function interroger(params: Record<string, string>): Promise<Feature[]> {
  const url = new URL(API);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const reponse = await fetch(url, { signal: AbortSignal.timeout(4000), cache: "no-store" });
  if (!reponse.ok) throw new Error(`Géocodage indisponible (${reponse.status})`);
  const json = (await reponse.json()) as { features?: Feature[] };
  return json.features ?? [];
}

export async function rechercherAdresses(
  texte: string,
  pres?: { latitude: number | null; longitude: number | null },
): Promise<AdresseLivraison[]> {
  const params: Record<string, string> = { q: texte, limit: "6", autocomplete: "1", index: "address" };
  if (pres?.latitude != null && pres.longitude != null) {
    params.lat = String(pres.latitude);
    params.lon = String(pres.longitude);
  }
  const features = await interroger(params);
  return features.filter((f) => f.properties.type === "housenumber" || f.properties.type === "street").map(versAdresse);
}

export type Verification =
  | { statut: "ok"; adresse: AdresseLivraison }
  | { statut: "introuvable" }
  | { statut: "indisponible" };

/**
 * Re-vérifie côté serveur l'adresse choisie par le client : le code commune
 * qui décide de la zone (et donc des frais) ne vient jamais du navigateur.
 */
export async function verifierAdresse(adresse: Pick<AdresseLivraison, "libelle" | "codePostal">): Promise<Verification> {
  try {
    const features = await interroger({ q: adresse.libelle, limit: "1", index: "address", postcode: adresse.codePostal });
    const meilleure = features[0];
    if (!meilleure || meilleure.properties.score < 0.5) return { statut: "introuvable" };
    return { statut: "ok", adresse: versAdresse(meilleure) };
  } catch {
    return { statut: "indisponible" };
  }
}
