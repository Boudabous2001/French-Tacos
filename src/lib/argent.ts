/** Tous les montants du site sont des entiers en centimes : jamais de flottants. */
export type Centimes = number;

const formateur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/** 750 → « 7,50 € » */
export function euros(montant: Centimes): string {
  return formateur.format(montant / 100);
}

/** 750 → « 7€50 », à la façon de l'affiche du restaurant. */
export function prixAffiche(montant: Centimes): { entier: string; decimales: string } {
  const entier = Math.floor(montant / 100);
  const decimales = String(montant % 100).padStart(2, "0");
  return { entier: String(entier), decimales };
}

/** « +1,00 € » pour un supplément, chaîne vide quand c'est gratuit. */
export function supplement(montant: Centimes): string {
  return montant > 0 ? `+${euros(montant)}` : "";
}
