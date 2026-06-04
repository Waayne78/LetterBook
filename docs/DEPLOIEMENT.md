# Déploiement LetterBook (production)

Guide pour publier l’API Symfony et le frontend React sur un même domaine (recommandé).

## Prérequis serveur

- PHP 8.2+ (extensions : ctype, iconv, pdo, json, mbstring, openssl, tokenizer, xml)
- Composer
- Node.js 20+ (build frontend uniquement)
- MySQL 8+ (ou MariaDB équivalent)
- Nginx ou Caddy en reverse proxy

## 1. Backend (Symfony)

```bash
cd backend
composer install --no-dev --optimize-autoloader
php bin/console lexik:jwt:generate-keypair --skip-if-exists
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console cache:clear --env=prod
```

Important: n'utilisez jamais de secrets reels dans des fichiers versionnes (`.env`, `.env.dev`, `.env.example`).

### Variables d’environnement (`.env.local`, ne pas commiter)

| Variable | Description |
|----------|-------------|
| `APP_ENV` | `prod` |
| `APP_SECRET` | Clé secrète Symfony (générer une valeur unique) |
| `DATABASE_URL` | Connexion MySQL |
| `JWT_SECRET_KEY` / `JWT_PUBLIC_KEY` / `JWT_PASSPHRASE` | Paire JWT Lexik |
| `CORS_ALLOW_ORIGIN` | Origine du frontend (ex. `https://letterbook.example`) |
| `GOOGLE_BOOKS_API_KEY` | Optionnel — recherche étendue de livres |

### Variables obligatoires vs optionnelles (prod)

- Obligatoires:
  - `APP_ENV=prod`
  - `APP_SECRET`
  - `DATABASE_URL`
  - `JWT_SECRET_KEY`
  - `JWT_PUBLIC_KEY`
  - `JWT_PASSPHRASE`
  - `CORS_ALLOW_ORIGIN` (si frontend sur origine differente)
- Optionnelles:
  - `GOOGLE_BOOKS_API_KEY` (active la recherche Google Books)

Le document root HTTP doit pointer vers `backend/public/`.

## 2. Frontend (React / Vite)

```bash
cd frontend
npm ci
npm run build
```

Les fichiers statiques se trouvent dans `frontend/dist/`. En production, l’API est servie sous le même hôte en `/api` (pas de proxy Vite).

### Développement local

Le proxy Vite (`vite.config.ts`) redirige `/api` vers le backend. Variable optionnelle :

```bash
VITE_PROXY_API=http://127.0.0.1:8000 npm run dev
```

Voir `frontend/.env.example`.

## 3. Exemple Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name letterbook.example;

    root /var/www/letterbook/frontend/dist;
    index index.html;

    location /api {
        try_files $uri /index.php$is_args$args;
        alias /var/www/letterbook/backend/public;
        # Alternative : fastcgi vers PHP-FPM avec SCRIPT_FILENAME = .../backend/public/index.php
    }

    location /uploads/ {
        alias /var/www/letterbook/backend/public/uploads/;
        access_log off;
        expires 7d;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ ^/api/index\.php(/|$) {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/letterbook/backend/public/index.php;
        fastcgi_param PATH_INFO $fastcgi_path_info;
    }
}
```

Configuration type Symfony : toutes les requêtes `/api/*` passent par `backend/public/index.php` (voir la [doc Symfony deployment](https://symfony.com/doc/current/setup/web_server_configuration.html)).

## 4. Caddy (alternative)

```caddy
letterbook.example {
    root * /var/www/letterbook/frontend/dist
    try_files {path} /index.html

    handle /api* {
        root * /var/www/letterbook/backend/public
        php_fastcgi unix//run/php/php8.2-fpm.sock
        try_files {path} /index.php{uri}
    }

    handle /uploads/* {
        root * /var/www/letterbook/backend/public
        file_server
    }
}
```

## 5. Uploads et persistance

- Les avatars sont ecrits dans `backend/public/uploads/avatars`.
- En production:
  - montez `backend/public/uploads` sur un volume persistant (ou stockage objet/S3),
  - sauvegardez ce volume comme les donnees DB,
  - gardez les permissions d'ecriture pour l'utilisateur PHP-FPM.
- Sans persistance, les images disparaissent lors d'un redeploiement.

## 6. Sauvegardes base de donnees

Mettez en place une sauvegarde reguliere avec retention (exemple quotidien + retention 14 jours) et test de restauration.

Exemple simple MySQL:

```bash
mysqldump --single-transaction --routines --triggers \
  -h 127.0.0.1 -u letterbook -p letterbook > /backups/letterbook_$(date +%F).sql
```

Checklist backup:

- [ ] dump quotidien automatise (cron/systemd timer)
- [ ] retention documentee
- [ ] restauration testee au moins une fois par mois
- [ ] stockage backup hors serveur applicatif

## 7. CORS selon topologie

- Front et API sur meme domaine: CORS peut rester restrictif (ou desactive selon infra).
- Front sur domaine separe: `CORS_ALLOW_ORIGIN` doit cibler explicitement l'origine frontend.

## 8. Checklist Go/No-Go

- [ ] Aucun secret reel dans fichiers versionnes
- [ ] Migrations appliquees
- [ ] Endpoints `/api/*` et `/uploads/*` servis correctement
- [ ] Volume persistant pour uploads actif
- [ ] Sauvegardes DB automatisees + restauration testee
- [ ] `npm run build` et `php bin/phpunit` au vert

## 9. Checklist pré-release manuelle

### Invité (non connecté)

- [ ] Page d’accueil marketing
- [ ] Fil « Communauté » accessible
- [ ] Fiche livre et profil public consultables
- [ ] Recherche de livres

### Utilisateur connecté

- [ ] Accueil + fil (Pour vous / Amis / Communauté)
- [ ] Abonnement mutuel → statut « Ami »
- [ ] Bibliothèque : ajout, statut, progression
- [ ] Avis et likes
- [ ] Notifications (nouvel abonné, ami mutuel)
- [ ] Mon réseau (`/network`) et Découvrir (`/discover`)

### Mobile

- [ ] Menu : Fil, Bibliothèque, Réseau, Lecteurs, Profil
- [ ] Cloche notifications
- [ ] Onglets du fil

### Modération

- [ ] Compte suspendu : message clair à la connexion

### Technique

- [ ] `npm run build` sans erreur
- [ ] `php bin/phpunit` vert
- [ ] Migrations appliquées en prod
- [ ] Pas de `.env.local` ni clés JWT dans le dépôt
