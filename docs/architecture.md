# Architecture technique

## Pile

| Couche | Choix | Pourquoi |
| ------ | ----- | -------- |
| Application | Next.js 16 (App Router, Cache Components) + React 19 + TypeScript | Pages rendues côté serveur pour le référencement, coque statique instantanée, une seule base de code pour le site et le back-office |
| Style | Tailwind CSS 4, polices auto-hébergées (Anton, Permanent Marker, Plus Jakarta Sans) | Aucun appel à Google Fonts depuis le navigateur (RGPD) |
| Animations | Motion | Feuilles glissantes, transitions, compteurs ; respect de « réduire les animations » |
| Base de données | PostgreSQL 17 + Drizzle ORM | Requêtes typées, migrations SQL versionnées dans `drizzle/` |
| Développement local | PGlite (PostgreSQL embarqué) | Rien à installer : `npm run dev` suffit |
| Paiement | Stripe Payment Element | Carte, Apple Pay, Google Pay, 3D Secure ; aucune donnée bancaire chez nous |
| Adresses | Géoplateforme IGN (service public, gratuit) | Autocomplétion, code INSEE de la commune pour la zone de livraison |
| E-mails | SMTP (nodemailer) | Fonctionne avec n'importe quel fournisseur |
| Hébergement | Docker Compose : site + PostgreSQL + Caddy + sauvegardes | Un VPS à quelques euros, HTTPS automatique |

## Organisation du code

```
src/
  app/
    (site)/          pages publiques : accueil, carte, commande, suivi, infos, allergènes, pages légales
    admin/           back-office : connexion, commandes (écran cuisine), carte, réglages, ticket
    api/             commandes, suivi, adresses, disponibilités, webhook Stripe, flux temps réel, santé
  components/        interface (carte, panier, commande, admin, ui)
  db/                schéma, connexion, initialisation de la carte
  lib/
    catalogue/       types, carte initiale, moteur de composition et de prix (+ tests)
    horaires.ts      ouverture et créneaux à l'heure de Paris (+ tests)
    livraison.ts     zones, frais (+ tests)
    serveur/         code serveur uniquement : commandes, paiement, auth, e-mails, sécurité
  stores/            panier (persistant sur l'appareil) et état de l'interface
  proxy.ts           filtre d'accès au back-office
```

## Parcours d'une commande

1. Le client compose ses produits : le moteur `lib/catalogue/prix.ts` calcule le prix en direct.
2. À la validation, le navigateur envoie **uniquement** les produits, les choix et les quantités. Le serveur recharge la carte depuis la base, revérifie chaque choix (existence, disponibilité, nombre), recalcule tous les prix, vérifie l'adresse auprès du service national, la zone, le minimum, l'horaire et le créneau.
3. Paiement en ligne : la commande est créée « en attente de paiement » et un PaymentIntent Stripe du montant calculé côté serveur est ouvert. La commande ne passe en « reçue » qu'après confirmation par le webhook signé de Stripe (avec contrôle du montant), ou après vérification directe auprès de Stripe si le webhook tarde. Les paiements abandonnés sont annulés au bout de 30 minutes.
4. La cuisine est prévenue en direct (flux SSE) : sonnerie, notification, titre d'onglet clignotant. Elle accepte avec un temps de préparation, puis fait avancer la commande ; une annulation rembourse automatiquement le paiement Stripe.
5. Le client suit sa commande sur une page privée (lien secret de 192 bits) actualisée toutes les 6 secondes.

## Sécurité

- **Prix et règles côté serveur** : rien de ce que calcule le navigateur n'est cru. Validation stricte des entrées (Zod) avec identifiants en liste blanche.
- **Paiement** : aucune donnée de carte ne transite par le serveur ; webhook vérifié par signature ; traitement idempotent ; contrôle du montant payé.
- **Back-office** : mots de passe hachés avec bcrypt (coût 12) ; sessions aléatoires dont seule l'empreinte SHA-256 est stockée ; cookie `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax` ; expiration à 12 h ; temps de réponse identique que le compte existe ou non ; limite de 5 essais par compte et 10 par IP sur 15 minutes. Chaque page et chaque action serveur revérifie la session.
- **CSRF** : contrôle de l'en-tête `Origin` sur les routes d'écriture ; protection native de Next sur les Server Actions.
- **Limitation de débit** : commandes (8 par 10 min par IP), recherche d'adresse, suivi.
- **En-têtes** : Content-Security-Policy (seul Stripe est autorisé en externe), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Conteneur** : utilisateur non root, système de fichiers en lecture seule, aucune capacité Linux, `no-new-privileges`. Base non exposée sur Internet.
- **Données personnelles** : minimum nécessaire, aucun traceur publicitaire ni outil de mesure d'audience, pas de bannière cookies nécessaire.

## Limites connues et suites

- Un seul serveur : la limitation de débit et le flux temps réel sont en mémoire. Si un jour plusieurs serveurs sont nécessaires, passer à Redis ou à `LISTEN/NOTIFY` de PostgreSQL.
- Pas encore de compte client, de fidélité ni de codes promo (phase 2).
- Impression automatique sans clic : nécessite le modèle d'imprimante du restaurant (Epson ePOS ou Star CloudPRNT).
