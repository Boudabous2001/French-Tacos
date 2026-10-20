# Mise en ligne sur le serveur du client

Cible : un VPS Linux (Ubuntu 24.04 LTS, 2 vCPU, 2 à 4 Go de RAM : largement suffisant pour un restaurant). Tout tourne dans Docker : le site, PostgreSQL, Caddy (HTTPS automatique) et les sauvegardes.

## 1. Préparer le serveur (une seule fois)

```bash
# Utilisateur dédié, connexion par clé SSH uniquement
adduser deploiement && usermod -aG sudo deploiement
# Copier sa clé publique dans ~deploiement/.ssh/authorized_keys, puis dans /etc/ssh/sshd_config :
#   PasswordAuthentication no
#   PermitRootLogin no
systemctl restart ssh

# Pare-feu : SSH, HTTP, HTTPS seulement
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp && ufw enable

# Mises à jour de sécurité automatiques et protection contre les attaques par force brute
apt update && apt install -y unattended-upgrades fail2ban
dpkg-reconfigure -plow unattended-upgrades

# Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploiement
```

## 2. Le nom de domaine

Chez le registrar, créer deux enregistrements DNS pointant vers l'IP du serveur :

| Type | Nom | Valeur |
| ---- | --- | ------ |
| A | `@` | IP du VPS |
| A | `www` | IP du VPS |

(et `AAAA` si le serveur a une IPv6). Caddy obtient le certificat HTTPS tout seul au premier démarrage.

## 3. Installer le site

```bash
git clone https://github.com/Boudabous2001/French-Tacos.git /srv/french-tacos
cd /srv/french-tacos
cp .env.example .env
nano .env          # DOMAINE, EMAIL_ACME, POSTGRES_PASSWORD, ADMIN_*, STRIPE_*, SMTP_URL…
chmod 600 .env
docker compose up -d --build
docker compose logs -f site   # « Carte initiale installée », « Compte gérant créé »
```

Une fois connecté au back-office (`https://DOMAINE/admin`), **retirer `ADMIN_MOT_DE_PASSE` du fichier `.env`**.

## 4. Stripe

1. Tableau de bord Stripe → Développeurs → Clés API : copier `sk_…` et `pk_…` dans `.env`.
2. Développeurs → Webhooks → Ajouter un point de terminaison : `https://DOMAINE/api/stripe/webhook`, événements `payment_intent.succeeded` et `payment_intent.canceled`. Copier le secret `whsec_…` dans `STRIPE_WEBHOOK_SECRET`.
3. Paramètres → Moyens de paiement : activer Carte, Apple Pay, Google Pay. Pour Apple Pay, Stripe demande de vérifier le domaine (Paramètres → Domaines de paiement).
4. `docker compose up -d` pour relire la configuration.

Recette : utiliser d'abord les clés **test** (carte `4242 4242 4242 4242`, toute date future, tout CVC), puis passer aux clés live le jour du lancement.

## 5. Mises à jour

```bash
cd /srv/french-tacos && git pull && docker compose up -d --build
```

Les migrations de base de données s'appliquent automatiquement au démarrage.

## 6. Comptes du back-office

```bash
# Créer un compte, ou réinitialiser un mot de passe oublié (affiché une seule fois)
docker compose exec site node scripts/create-admin.mjs prenom@restaurant.fr "Prénom Nom"
```

## 7. Sauvegardes

- Un `pg_dump` est fait chaque jour dans `/srv/french-tacos/sauvegardes` (30 jours conservés par défaut).
- **À mettre en place en plus : une copie hors du serveur** (ex. `rclone` vers un stockage S3 / Backblaze, ou la sauvegarde automatique du fournisseur de VPS). Une sauvegarde sur la même machine ne protège pas d'une panne du serveur.
- Restauration :

```bash
docker compose exec -T base pg_restore --clean --if-exists -U frenchtacos -d frenchtacos < sauvegardes/frenchtacos-AAAA-MM-JJ-HHMM.dump
```

## 8. Surveillance

- `https://DOMAINE/api/sante` répond `{"ok":true}` quand le site et la base fonctionnent : à brancher sur un service gratuit de surveillance (UptimeRobot, Better Stack…) qui prévient par SMS ou e-mail.
- Journaux : `docker compose logs --tail 200 site`.
