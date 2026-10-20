/**
 * Serveur de démonstration (SITE_TEST=1) : bandeau visible sur toutes les pages,
 * site exclu des moteurs de recherche et paiement simulé tant que Stripe
 * n'est pas configuré. Jamais sur le site réel du restaurant.
 */
export function estSiteDeTest(): boolean {
  return process.env.SITE_TEST === "1";
}
