import type { Fermeture, Semaine } from "@/lib/horaires";
import type { Zone } from "@/lib/livraison";

export type ModeCommande = "livraison" | "emporter";

export interface Reglages {
  restaurant: {
    nom: string;
    slogan: string;
    adresse: string;
    codePostal: string;
    ville: string;
    telephone: string;
    email: string;
    latitude: number | null;
    longitude: number | null;
    /** Mentions légales */
    raisonSociale: string;
    siret: string;
    tvaIntracom: string;
    responsablePublication: string;
  };
  horaires: Semaine;
  fermetures: Fermeture[];
  commandes: {
    /** Coupure immédiate des commandes en ligne (coup de feu, rupture…). */
    enPause: boolean;
    messagePause: string;
    /** Commander pour plus tard quand le restaurant est fermé. */
    precommande: boolean;
    preparationMinutes: number;
    pasCreneauMinutes: number;
    joursAvance: number;
    /** Montant minimum pour la vente à emporter (0 = aucun). */
    minimumEmporter: number;
  };
  modes: Record<ModeCommande, boolean>;
  paiement: {
    enLigne: boolean;
    /** Espèces ou carte au livreur / au comptoir. */
    surPlace: boolean;
  };
  zones: Zone[];
  reseaux: {
    instagram: string;
    facebook: string;
    tiktok: string;
    snapchat: string;
    avisGoogle: string;
  };
}

const service = (debut: string, fin: string) => ({ debut, fin });

/**
 * Valeurs de démarrage. TOUT ce qui est marqué « à renseigner » attend les
 * réponses du client (voir docs/questionnaire-client.md) et se modifie
 * ensuite depuis /admin/reglages.
 */
export const REGLAGES_PAR_DEFAUT: Reglages = {
  restaurant: {
    nom: "French Tacos",
    slogan: "Le tacos généreux, gratiné, fait minute.",
    adresse: "Adresse du restaurant à renseigner",
    codePostal: "14000",
    ville: "Caen",
    telephone: "02 00 00 00 00",
    email: "contact@exemple.fr",
    latitude: null,
    longitude: null,
    raisonSociale: "À renseigner",
    siret: "À renseigner",
    tvaIntracom: "À renseigner",
    responsablePublication: "À renseigner",
  },
  horaires: {
    lundi: [service("11:30", "14:30"), service("18:00", "23:00")],
    mardi: [service("11:30", "14:30"), service("18:00", "23:00")],
    mercredi: [service("11:30", "14:30"), service("18:00", "23:00")],
    jeudi: [service("11:30", "14:30"), service("18:00", "23:00")],
    vendredi: [service("11:30", "14:30"), service("18:00", "00:00")],
    samedi: [service("11:30", "00:00")],
    dimanche: [service("18:00", "23:00")],
  },
  fermetures: [],
  commandes: {
    enPause: false,
    messagePause: "Nous sommes en plein coup de feu : les commandes en ligne reprennent dans quelques minutes.",
    precommande: true,
    preparationMinutes: 20,
    pasCreneauMinutes: 15,
    joursAvance: 1,
    minimumEmporter: 0,
  },
  modes: { livraison: true, emporter: true },
  paiement: { enLigne: true, surPlace: true },
  // Zones de démonstration : à remplacer par les communes réellement livrées.
  zones: [
    {
      id: "zone-1",
      nom: "Zone 1",
      communes: [{ nom: "Caen", codePostal: "14000", insee: "14118" }],
      frais: 200,
      minimum: 1500,
      gratuiteDes: 3500,
      trajetMinutes: 15,
      active: true,
    },
    {
      id: "zone-2",
      nom: "Zone 2",
      communes: [
        { nom: "Hérouville-Saint-Clair", codePostal: "14200", insee: "14327" },
        { nom: "Mondeville", codePostal: "14120", insee: "14437" },
        { nom: "Ifs", codePostal: "14123", insee: "14341" },
      ],
      frais: 350,
      minimum: 2000,
      gratuiteDes: 4500,
      trajetMinutes: 25,
      active: true,
    },
  ],
  reseaux: {
    instagram: "",
    facebook: "",
    tiktok: "",
    snapchat: "",
    avisGoogle: "",
  },
};

/** Fusion profonde des réglages enregistrés avec les valeurs par défaut (nouveaux champs). */
export function completerReglages(enregistres: Partial<Reglages> | null | undefined): Reglages {
  const r = enregistres ?? {};
  const d = REGLAGES_PAR_DEFAUT;
  return {
    restaurant: { ...d.restaurant, ...r.restaurant },
    horaires: { ...d.horaires, ...r.horaires },
    fermetures: r.fermetures ?? d.fermetures,
    commandes: { ...d.commandes, ...r.commandes },
    modes: { ...d.modes, ...r.modes },
    paiement: { ...d.paiement, ...r.paiement },
    zones: r.zones ?? d.zones,
    reseaux: { ...d.reseaux, ...r.reseaux },
  };
}

/** Partie des réglages utile au navigateur (aucune donnée interne). */
export type ReglagesPublics = Pick<Reglages, "restaurant" | "horaires" | "fermetures" | "modes" | "paiement" | "zones" | "reseaux"> & {
  commandes: Pick<Reglages["commandes"], "enPause" | "messagePause" | "precommande" | "preparationMinutes" | "pasCreneauMinutes" | "joursAvance" | "minimumEmporter">;
};

export function reglagesPublics(r: Reglages): ReglagesPublics {
  return {
    restaurant: r.restaurant,
    horaires: r.horaires,
    fermetures: r.fermetures,
    modes: r.modes,
    paiement: r.paiement,
    zones: r.zones.filter((z) => z.active),
    reseaux: r.reseaux,
    commandes: r.commandes,
  };
}
