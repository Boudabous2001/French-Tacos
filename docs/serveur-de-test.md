# Serveur de démonstration gratuit

But : montrer le site au client et le faire tester par n'importe qui, sur une vraie adresse en HTTPS, **sans payer de serveur**. Le site réel ira ensuite sur le serveur du restaurant ([deploiement.md](deploiement.md)).

| Rôle | Service | Offre gratuite |
| ---- | ------- | -------------- |
| Site (image Docker du projet) | [Render](https://render.com) | 512 Mo de RAM, 750 h par mois, mise en veille après 15 min sans visite |
| Base de données PostgreSQL | [Neon](https://neon.com) | 1 Go, mise en veille automatique, sans carte bancaire |

En mode démonstration (`SITE_TEST=1`, déjà réglé) :

- un bandeau jaune indique sur chaque page que les commandes sont fictives ;
- le site est exclu de Google (`robots.txt` et en-tête `X-Robots-Tag`) ;
- sans clés Stripe, le paiement en ligne est **simulé**. Avec des clés Stripe **de test**, le vrai formulaire de paiement fonctionne avec les cartes de test.

## 1. Créer la base sur Neon (5 minutes)

1. Créer un compte sur https://neon.com (connexion avec GitHub possible).
2. Nouveau projet : nom `french-tacos-demo`, PostgreSQL 17, région **AWS Europe Central 1 (Frankfurt)**.
3. Tableau de bord → **Connect** : décocher « Connection pooling », puis copier la chaîne de connexion. Elle ressemble à `postgresql://neondb_owner:…@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`.

Les tables et la carte sont créées automatiquement au premier démarrage du site.

## 2. Créer le site sur Render (10 minutes)

1. Créer un compte sur https://render.com avec le compte GitHub `Boudabous2001`, et autoriser l'accès à la repo `French-Tacos`.
2. **New → Blueprint**, choisir la repo `French-Tacos`. Render lit le fichier `render.yaml` et propose le service `french-tacos-demo`.
3. Renseigner les valeurs demandées :
   - `DATABASE_URL` : la chaîne copiée sur Neon ;
   - `SITE_URL` : `https://french-tacos-demo.onrender.com` (à corriger après la création si Render attribue une autre adresse) ;
   - `ADMIN_EMAIL` et `ADMIN_MOT_DE_PASSE` : le compte du back-office (12 caractères minimum).
4. **Apply**. La première compilation prend environ 5 minutes. Quand le journal affiche « Compte gérant créé », le site est en ligne.
5. Vérifier :
   - `https://…onrender.com` : le site, avec le bandeau jaune ;
   - `https://…onrender.com/api/sante` : `{"ok":true}` ;
   - `https://…onrender.com/admin` : le back-office.

Ensuite, chaque fusion sur `main` redéploie automatiquement, si les vérifications GitHub passent.

## Bon à savoir

- **Mise en veille** : après 15 minutes sans visite, le site s'endort et la visite suivante attend 30 à 60 secondes. Avant une démonstration au client, ouvrir le site une minute à l'avance.
- **Données** : commandes, réglages et modifications de la carte sont conservés dans Neon. Pour repartir de zéro : dans Neon → SQL Editor, exécuter `DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;` puis redémarrer le service sur Render (Manual Deploy → Restart) : les tables, la carte de l'affiche et le compte gérant sont recréés.
- **E-mails** : sans `SMTP_URL`, aucun e-mail n'est envoyé (ils sont seulement écrits dans les journaux Render).
- **Stripe en test** : dès que le client a son compte, ajouter dans Render → Environment `STRIPE_SECRET_KEY` et `STRIPE_PUBLISHABLE_KEY` (clés **test**), plus le webhook `https://…onrender.com/api/stripe/webhook` et son `STRIPE_WEBHOOK_SECRET`. Carte de test : `4242 4242 4242 4242`.
- **Ne jamais** mettre `SITE_TEST=1` sur le serveur réel du restaurant.
