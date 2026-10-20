import "server-only";

/* ---------- Limitation du nombre de requêtes (un seul serveur : mémoire locale) ---------- */

interface Seau {
  compte: number;
  reinitialisation: number;
}

declare global {
  var __frenchTacosLimites: Map<string, Seau> | undefined;
}

const seaux = (globalThis.__frenchTacosLimites ??= new Map<string, Seau>());

export interface ResultatLimite {
  autorise: boolean;
  reessayerDansSecondes: number;
}

/** Autorise `max` actions par fenêtre glissante de `fenetreSecondes` pour une clé donnée. */
export function limiter(cle: string, max: number, fenetreSecondes: number): ResultatLimite {
  const maintenant = Date.now();
  if (seaux.size > 10_000) {
    for (const [k, s] of seaux) if (s.reinitialisation < maintenant) seaux.delete(k);
  }
  const seau = seaux.get(cle);
  if (!seau || seau.reinitialisation < maintenant) {
    seaux.set(cle, { compte: 1, reinitialisation: maintenant + fenetreSecondes * 1000 });
    return { autorise: true, reessayerDansSecondes: 0 };
  }
  seau.compte += 1;
  if (seau.compte > max) {
    return { autorise: false, reessayerDansSecondes: Math.ceil((seau.reinitialisation - maintenant) / 1000) };
  }
  return { autorise: true, reessayerDansSecondes: 0 };
}

export function reinitialiserLimite(cle: string) {
  seaux.delete(cle);
}

/* ---------- Identification de la requête ---------- */

/**
 * Adresse IP du client. En production, Caddy remplace l'en-tête
 * X-Forwarded-For par l'IP réelle (il ignore celui envoyé par le client).
 */
export function ipClient(entetes: Headers): string {
  const transmis = entetes.get("x-forwarded-for");
  if (transmis) return transmis.split(",")[0].trim();
  return entetes.get("x-real-ip") ?? "inconnue";
}

/**
 * Refuse les requêtes d'écriture venant d'un autre site (protection CSRF des
 * routes API ; les Server Actions sont déjà protégées par Next.js).
 */
export function origineAutorisee(entetes: Headers): boolean {
  const origine = entetes.get("origin");
  if (!origine) return false;
  let hoteOrigine: string;
  try {
    hoteOrigine = new URL(origine).host;
  } catch {
    return false;
  }
  const hotes = new Set<string>();
  const hote = entetes.get("x-forwarded-host") ?? entetes.get("host");
  if (hote) hotes.add(hote);
  if (process.env.SITE_URL) {
    try {
      hotes.add(new URL(process.env.SITE_URL).host);
    } catch {
      /* SITE_URL mal formée : on s'en tient à l'hôte de la requête */
    }
  }
  return hotes.has(hoteOrigine);
}

/** Réponse JSON d'erreur homogène. */
export function erreurJson(message: string, statut: number, extra: Record<string, unknown> = {}) {
  return Response.json({ erreur: message, ...extra }, { status: statut, headers: { "Cache-Control": "no-store" } });
}

/** URL publique du site (liens dans les e-mails, retour de paiement). */
export function urlSite(entetes?: Headers): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const hote = entetes?.get("x-forwarded-host") ?? entetes?.get("host") ?? "localhost:3000";
  const protocole = entetes?.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${protocole}://${hote}`;
}
