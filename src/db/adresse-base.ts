/**
 * Lecture tolérante de DATABASE_URL : les erreurs de collage les plus
 * fréquentes depuis Neon (commande « psql '…' », guillemets, espaces) sont
 * corrigées ; les autres donnent un message clair, sans jamais révéler le
 * mot de passe dans les journaux.
 */
export type AnalyseAdresseBase =
  | { type: "postgres"; url: string }
  | { type: "absente" }
  | { type: "invalide"; raison: string };

const ADRESSE_POSTGRES = /postgres(?:ql)?:\/\/[^\s'"`]+/i;

export function analyserAdresseBase(brute: string | undefined): AnalyseAdresseBase {
  const valeur = (brute ?? "").trim();
  if (!valeur) return { type: "absente" };

  const adresse = valeur.match(ADRESSE_POSTGRES)?.[0];
  if (!adresse) {
    // Indice sans risque : seulement un premier mot fait de lettres (« psql », « host »…).
    const premierMot = valeur.split(/\s/)[0];
    const indice = /^[a-z_]{1,15}$/i.test(premierMot) ? ` (elle commence par « ${premierMot} »)` : "";
    return { type: "invalide", raison: `la valeur ne contient pas d'adresse postgresql://…${indice}` };
  }

  if (/:(\*{3,}|<[^>@]*>)@/.test(adresse)) {
    return {
      type: "invalide",
      raison: "le mot de passe est masqué (****) : dans Neon, cliquer sur « Show password » (ou le bouton Copier) avant de copier la chaîne",
    };
  }

  try {
    if (!new URL(adresse).hostname) throw new Error("hôte absent");
  } catch {
    return { type: "invalide", raison: "l'adresse postgresql://… est incomplète ou mal formée" };
  }

  return { type: "postgres", url: adresse };
}
