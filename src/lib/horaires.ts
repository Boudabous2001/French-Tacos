/**
 * Horaires d'ouverture, toujours calculés à l'heure de Paris, quel que soit
 * le fuseau du serveur ou du téléphone du client (changements d'heure compris).
 */

export const FUSEAU = "Europe/Paris";

export const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
export type Jour = (typeof JOURS)[number];

/** « 11:30 » → « 14:30 ». Une fin avant le début déborde sur le lendemain (18:00 → 01:00). */
export interface Plage {
  debut: string;
  fin: string;
}

export type Semaine = Record<Jour, Plage[]>;

/** Fermeture exceptionnelle, bornes incluses (AAAA-MM-JJ). */
export interface Fermeture {
  du: string;
  au: string;
  motif?: string;
}

export interface Intervalle {
  debut: Date;
  fin: Date;
}

const MINUTE = 60_000;

const lecteur = new Intl.DateTimeFormat("en-GB", {
  timeZone: FUSEAU,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

const JOUR_ANGLAIS: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export interface PartiesParis {
  date: string; // AAAA-MM-JJ
  heures: number;
  minutes: number;
  jour: Jour;
}

export function partiesParis(instant: Date): PartiesParis {
  const p = Object.fromEntries(lecteur.formatToParts(instant).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    heures: Number(p.hour),
    minutes: Number(p.minute),
    jour: JOURS[JOUR_ANGLAIS[p.weekday]],
  };
}

/** Décalage (en minutes) entre l'heure de Paris et l'heure UTC à cet instant. */
function decalageParis(instant: Date): number {
  const p = Object.fromEntries(lecteur.formatToParts(instant).map((x) => [x.type, x.value]));
  const commeUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((commeUtc - Math.floor(instant.getTime() / 1000) * 1000) / MINUTE);
}

/** « 2026-10-20 » + « 11:30 » (heure de Paris) → instant réel. */
export function instantParis(date: string, heure: string): Date {
  const [a, m, j] = date.split("-").map(Number);
  const [h, min] = heure.split(":").map(Number);
  const naif = Date.UTC(a, m - 1, j, h, min);
  // Deux passes suffisent, y compris autour des changements d'heure.
  let instant = new Date(naif - decalageParis(new Date(naif)) * MINUTE);
  instant = new Date(naif - decalageParis(instant) * MINUTE);
  return instant;
}

export function ajouterJours(date: string, jours: number): string {
  const [a, m, j] = date.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j + jours));
  return d.toISOString().slice(0, 10);
}

function jourDeLaDate(date: string): Jour {
  const [a, m, j] = date.split("-").map(Number);
  const index = (new Date(Date.UTC(a, m - 1, j)).getUTCDay() + 6) % 7;
  return JOURS[index];
}

export function estFermeExceptionnellement(date: string, fermetures: Fermeture[]): Fermeture | null {
  return fermetures.find((f) => date >= f.du && date <= f.au) ?? null;
}

/** Intervalles d'ouverture d'une journée (heure de Paris), fermetures exceptionnelles déduites. */
export function intervallesDuJour(date: string, semaine: Semaine, fermetures: Fermeture[]): Intervalle[] {
  if (estFermeExceptionnellement(date, fermetures)) return [];
  return (semaine[jourDeLaDate(date)] ?? [])
    .filter((p) => p.debut && p.fin)
    .map((p) => {
      const debut = instantParis(date, p.debut);
      const finDate = p.fin <= p.debut ? ajouterJours(date, 1) : date;
      return { debut, fin: instantParis(finDate, p.fin) };
    })
    .sort((x, y) => x.debut.getTime() - y.debut.getTime());
}

/** Intervalles de la veille (service qui déborde après minuit) jusqu'à J + n. */
export function intervallesAutour(maintenant: Date, semaine: Semaine, fermetures: Fermeture[], joursApres = 7): Intervalle[] {
  const aujourdHui = partiesParis(maintenant).date;
  const resultat: Intervalle[] = [];
  for (let i = -1; i <= joursApres; i += 1) {
    resultat.push(...intervallesDuJour(ajouterJours(aujourdHui, i), semaine, fermetures));
  }
  return resultat;
}

export interface EtatOuverture {
  ouvert: boolean;
  /** Fin du service en cours. */
  fermeA: Date | null;
  /** Prochain début de service quand c'est fermé. */
  ouvreA: Date | null;
}

export function etatOuverture(maintenant: Date, semaine: Semaine, fermetures: Fermeture[]): EtatOuverture {
  const intervalles = intervallesAutour(maintenant, semaine, fermetures);
  const t = maintenant.getTime();
  const enCours = intervalles.find((i) => i.debut.getTime() <= t && t < i.fin.getTime());
  if (enCours) return { ouvert: true, fermeA: enCours.fin, ouvreA: null };
  const prochain = intervalles.find((i) => i.debut.getTime() > t);
  return { ouvert: false, fermeA: null, ouvreA: prochain?.debut ?? null };
}

export interface Creneau {
  /** Instant ISO du créneau. */
  iso: string;
  libelle: string;
  jour: string;
}

const formatHeure = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit" });
const formatJour = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, weekday: "long", day: "numeric", month: "long" });

export function heureParis(instant: Date): string {
  return formatHeure.format(instant).replace(":", "h");
}

export function jourParis(instant: Date): string {
  return formatJour.format(instant);
}

/**
 * Créneaux proposés au client : tous les `pas` minutes, à partir de
 * maintenant + `delai` (préparation, + trajet en livraison), pendant les
 * heures d'ouverture des `jours` prochains jours.
 */
export function creneauxDisponibles(options: {
  maintenant: Date;
  semaine: Semaine;
  fermetures: Fermeture[];
  delaiMinutes: number;
  pasMinutes?: number;
  jours?: number;
}): Creneau[] {
  const { maintenant, semaine, fermetures, delaiMinutes } = options;
  const pas = (options.pasMinutes ?? 15) * MINUTE;
  const plusTot = maintenant.getTime() + delaiMinutes * MINUTE;
  const limite = instantParis(ajouterJours(partiesParis(maintenant).date, (options.jours ?? 1) + 1), "00:00").getTime();
  const creneaux: Creneau[] = [];

  for (const intervalle of intervallesAutour(maintenant, semaine, fermetures, (options.jours ?? 1) + 1)) {
    // Le premier créneau d'un service tombe après la préparation de la première commande.
    const depart = Math.max(intervalle.debut.getTime() + delaiMinutes * MINUTE, plusTot);
    let t = Math.ceil(depart / pas) * pas;
    while (t <= intervalle.fin.getTime() && t < limite) {
      const instant = new Date(t);
      creneaux.push({ iso: instant.toISOString(), libelle: heureParis(instant), jour: partiesParis(instant).date });
      t += pas;
    }
  }
  // Dédoublonnage si deux services se chevauchent.
  return creneaux.filter((c, i) => i === 0 || c.iso !== creneaux[i - 1].iso);
}

/** Vérifie côté serveur qu'un créneau demandé est réellement proposable. */
export function creneauValide(iso: string, options: Parameters<typeof creneauxDisponibles>[0]): boolean {
  const demande = new Date(iso).getTime();
  if (Number.isNaN(demande)) return false;
  return creneauxDisponibles(options).some((c) => new Date(c.iso).getTime() === demande);
}

/** Texte des horaires d'un jour : « 11h30 – 14h30 · 18h00 – 23h00 ». */
export function texteJour(plages: Plage[]): string {
  if (plages.length === 0) return "Fermé";
  return plages.map((p) => `${p.debut.replace(":", "h")} – ${p.fin.replace(":", "h")}`).join(" · ");
}
