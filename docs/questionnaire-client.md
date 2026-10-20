# French Tacos – Informations à demander au client

Ce document liste tout ce qu'il nous faut pour mettre le site en ligne. Les points marqués **(bloquant)** empêchent la mise en production tant qu'ils ne sont pas fournis ; les autres peuvent arriver pendant la recette.

Le site est déjà fonctionnel en démonstration avec la carte de l'affiche, des horaires et des zones fictives : chaque réponse vient simplement remplacer une valeur provisoire, sans redéveloppement.

---

## 1. Entreprise et mentions légales (bloquant)

- [ ] Raison sociale et forme juridique (SARL, SAS, EI…)
- [ ] SIRET et numéro de TVA intracommunautaire
- [ ] Adresse exacte du restaurant
- [ ] Nom du gérant (responsable de la publication)
- [ ] Téléphone affiché aux clients
- [ ] E-mail de contact public
- [ ] E-mail (ou plusieurs) qui reçoit l'alerte « nouvelle commande »
- [ ] Médiateur de la consommation : obligatoire pour vendre en ligne aux particuliers. S'il n'en a pas, il doit y adhérer (CM2C, Medicys, AME Conso… environ 50 à 150 € par an)
- [ ] Coordonnées du comptable, pour valider les taux de TVA (10 % plats, 5,5 % boissons en canette ou bouteille ; à confirmer)

## 2. Identité visuelle

- [ ] Logo en fichier vectoriel (AI, SVG, EPS ou PDF), sinon PNG haute définition sur fond transparent. Aujourd'hui on n'a qu'une photo de l'enseigne
- [ ] Couleurs officielles si elles existent (on a relevé sur l'affiche : orange `#FB6A0B`, ambre `#EB9C4F`, crème `#F6E0C0`, nuit `#120A06`)
- [ ] Photos des produits en haute définition. Les photos actuelles sont découpées dans l'affiche et restent floues : **on recommande un vrai shooting** (une demi-journée suffit pour toute la carte)
- [ ] Photos de la devanture, de la salle, de l'équipe (page d'accueil, réseaux sociaux, Google)
- [ ] Ton du site : le site **tutoie** le client, comme l'affiche (« Compose ton tacos »). À valider
- [ ] Un court texte « notre histoire » (2 ou 3 phrases), si le client le souhaite

## 3. Nom de domaine, e-mail, présence en ligne (bloquant)

- [ ] Nom de domaine souhaité. Est-il déjà acheté ? Chez quel registrar, et avec quels accès ? Le domaine doit être **au nom du client**
- [ ] Adresse e-mail d'envoi des confirmations (ex. `commandes@domaine.fr`) et le fournisseur SMTP (OVH, Brevo, Google Workspace…)
- [ ] Fiche Google Business Profile : existe-t-elle ? Lien vers les avis Google
- [ ] Liens Instagram, Facebook, TikTok, Snapchat

## 4. La carte (bloquant)

La carte de l'affiche est saisie : 10 catégories, 43 produits. Il faut la relire et compléter :

- [ ] Valider chaque nom et chaque prix
- [ ] Composition exacte de chaque produit (les descriptions actuelles sont provisoires)
- [ ] Tacos : la sauce fromagère et les frites sont-elles toujours incluses ? Combien de sauces au maximum (on a mis 2) ? Peut-on prendre deux fois la même viande ?
- [ ] Suppléments : 1 € pièce pour tous ? Liste identique pour les tacos et les burgers ?
- [ ] Burgers : le menu à +3 € comprend-il des frites et une canette ? Quelle taille ?
- [ ] Sandwichs, paninis, galettes : contenu exact du « Menu » ? Crudités modifiables (sans oignons…) ?
- [ ] Boissons réellement proposées : marques et parfums par format (canette 33 cl, 50 cl, 1,5 L)
- [ ] Menu enfant : quelle boisson, quelle compote ?
- [ ] Desserts : parfums (donut, muffin) ?
- [ ] Produits à ajouter : frites seules, menus tacos, sauces en supplément, offres du moment…
- [ ] Produits à mettre en avant (« Populaire », « Nouveau »)
- [ ] Mention halal : la viande est-elle certifiée ? Si oui, par quel organisme (la mention n'est affichée qu'avec un justificatif)
- [ ] **Allergènes de chaque produit** (14 allergènes réglementaires, obligation légale INCO). Le site affiche « sur demande au restaurant » tant qu'ils ne sont pas renseignés
- [ ] Les prix en ligne sont-ils les mêmes qu'au comptoir ?

## 5. Horaires

- [ ] Horaires par jour (midi et soir), jours de fermeture
- [ ] Les horaires de livraison sont-ils différents des horaires d'ouverture ?
- [ ] Jusqu'à quelle heure accepte-t-on une commande avant la fermeture ?
- [ ] Autorise-t-on la commande à l'avance (pour plus tard dans la journée, pour le lendemain) ?
- [ ] Congés et fermetures exceptionnelles déjà prévus
- [ ] Temps de préparation moyen (on a mis 20 min) et capacité en pleine heure de rush (faut-il limiter le nombre de commandes par créneau de 15 min ?)

## 6. Livraison

- [ ] Le restaurant livre-t-il lui-même ? Combien de livreurs ?
- [ ] Sinon ou en complément : faut-il connecter un service de coursiers (Uber Direct, Stuart) ? C'est un développement séparé, facturé à la course par le prestataire
- [ ] Communes ou quartiers livrés
- [ ] Pour chaque zone : frais de livraison, minimum de commande, montant à partir duquel la livraison est offerte, temps de trajet moyen
- [ ] Distance maximale de livraison
- [ ] Le livreur encaisse-t-il (espèces, terminal de paiement mobile) ?

## 7. Paiement (bloquant pour le paiement en ligne)

- [ ] Création du compte **Stripe au nom du restaurant**. Il faut : pièce d'identité du gérant, Kbis, IBAN, adresse du site. Frais Stripe : environ 1,5 % + 0,25 € par paiement par carte européenne, sans abonnement
- [ ] Autorise-t-on le paiement sur place (au livreur ou au comptoir) en plus du paiement en ligne ?
- [ ] Titres-restaurant (Swile, Edenred, Up, Pluxee…) : ils s'encaissent aujourd'hui au comptoir ou au livreur sur terminal. Le paiement en ligne de titres-restaurant demande un contrat spécifique : à étudier si c'est important pour la clientèle
- [ ] Faut-il une facture ou un reçu détaillé avec TVA envoyé au client ?

## 8. Organisation en cuisine

- [ ] Sur quel appareil l'équipe reçoit-elle les commandes ? Tablette en cuisine conseillée (l'écran cuisine sonne et reste allumé)
- [ ] Imprimante de tickets : en ont-ils une ? Modèle (Epson TM-m30, Star TSP100…) ? Le ticket 80 mm est prêt ; l'impression automatique sans clic est une option
- [ ] Logiciel de caisse actuel : faut-il y faire remonter les commandes ?
- [ ] Combien de personnes doivent accéder au back-office ? Une adresse e-mail par personne

## 9. Messages aux clients

- [ ] E-mails de confirmation : inclus
- [ ] SMS de confirmation et « commande prête » : en option, environ 0,05 à 0,08 € le SMS (Brevo, Twilio). Souhaité ?

## 10. Fidélité et marketing (phase 2, à chiffrer)

- [ ] Compte client et historique des commandes
- [ ] Programme de fidélité (points, 10e tacos offert…)
- [ ] Codes promo et offre de lancement
- [ ] Newsletter (avec consentement RGPD)
- [ ] Avis clients après commande
- [ ] Pages « livraison tacos à [commune] » pour le référencement local : quelles communes viser en priorité ?

## 11. Hébergement et maintenance

- [ ] Serveur dédié (VPS) : environ 6 à 15 € par mois chez OVHcloud, Hetzner, Scaleway… Le compte doit être **au nom du client**, nous y avons un accès technique
- [ ] Nom de domaine : environ 10 à 15 € par an
- [ ] Contrat de maintenance : mises à jour de sécurité, surveillance, sauvegardes, petites évolutions, support. Formule à proposer
- [ ] Qui est l'interlocuteur technique côté restaurant ?

## 12. Planning

- [ ] Date de lancement souhaitée
- [ ] Une semaine de recette avec de vraies commandes test (paiement Stripe en mode test) avant l'ouverture
- [ ] Formation de l'équipe au back-office (environ 30 min) : date à caler

---

**À renvoyer de préférence en un seul envoi : fichiers du logo et des photos, tableau des allergènes, et réponses à ce questionnaire.**
