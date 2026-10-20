# French Tacos – commande en ligne

Site de commande pour le restaurant French Tacos : carte interactive, composition des tacos, panier, livraison ou à emporter, paiement sécurisé, suivi de commande en direct et back-office pour la cuisine.

## Ce que fait le site

**Pour les clients (pensé d'abord pour le téléphone)**
- Carte complète avec photos, onglets qui suivent le défilement, produits en rupture signalés
- Composition guidée : taille, viandes (avec doublement), sauces, suppléments, formule menu ; prix mis à jour en direct
- Panier conservé sur l'appareil, suggestions, minimum de commande et livraison offerte affichés
- Livraison avec autocomplétion d'adresse et zone détectée automatiquement, ou retrait au comptoir
- « Dès que possible » ou créneau programmé, calculé selon les horaires et le temps de préparation
- Paiement par carte, Apple Pay, Google Pay (Stripe), ou sur place
- Page de suivi en temps réel et e-mail de confirmation
- Installable sur l'écran d'accueil comme une application

**Pour le restaurant (`/admin`)**
- Écran cuisine en direct : sonnerie, notifications, écran maintenu allumé, colonnes par étape, temps de préparation, itinéraire Google Maps / Waze, ticket 80 mm
- Bouton « pause » pour couper les commandes pendant un coup de feu
- Ruptures et prix modifiables en un geste, effet immédiat sur le site
- Horaires, fermetures exceptionnelles, zones et frais de livraison, moyens de paiement, mentions légales
- Annulation avec remboursement Stripe automatique

## Démarrer en local

Prérequis : Node.js 20.9 ou plus récent.

```bash
npm install
cp .env.example .env.local   # renseigner au moins ADMIN_EMAIL et ADMIN_MOT_DE_PASSE
npm run dev
```

- Site : http://localhost:3000
- Back-office : http://localhost:3000/admin
- Sans clés Stripe, le paiement en ligne passe en **mode démonstration** (paiement simulé, développement uniquement).
- La base de données locale (PostgreSQL embarqué) est créée dans `.donnees/` avec la carte de l'affiche.

## Commandes utiles

| Commande | Rôle |
| -------- | ---- |
| `npm run dev` | Serveur de développement |
| `npm test` | Tests du moteur de prix, des horaires et des zones |
| `npm run lint` / `npm run typecheck` | Qualité du code |
| `npm run build` | Compilation de production |
| `npm run db:generate` | Nouvelle migration SQL après modification de `src/db/schema.ts` |
| `npm run admin:create -- email "Nom"` | Créer un compte back-office ou réinitialiser un mot de passe |
| `npm run images:menu` | Régénérer les photos provisoires à partir de l'affiche |

## Documentation

- [Questionnaire client](docs/questionnaire-client.md) : tout ce qu'il faut demander au restaurant
- [Architecture et sécurité](docs/architecture.md)
- [Mise en ligne sur le serveur](docs/deploiement.md)

## État

Les photos, descriptions, horaires, zones de livraison et mentions légales sont **provisoires** en attendant les réponses du client (voir le questionnaire).
