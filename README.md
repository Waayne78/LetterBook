# LetterBook

[![LetterBook CI](https://github.com/Waayne78/LetterBook/actions/workflows/ci.yml/badge.svg)](https://github.com/Waayne78/LetterBook/actions/workflows/ci.yml)

Application web communautaire pour lecteurs : bibliothèque personnelle, avis, fil d’actualité et administration.

## Architecture

- **Backend** : Symfony 7 (API REST, Doctrine, MySQL, JWT via LexikJWTAuthenticationBundle).
- **Frontend** : React 19 + Vite + Tailwind CSS 4.
- **Données** : schéma MERISE (tables `utilisateur`, `livre`, `avis`, `commentaire`, `like`, `bibliotheque`).
- **Externe** : Google Books API pour la recherche de métadonnées (variable `GOOGLE_BOOKS_API_KEY`).

## Prérequis

- PHP 8.2+, Composer, Node.js 20+.
- MySQL 8 (ou Docker, voir `docker-compose.yml`).

## Démarrage rapide

### Base MySQL

```bash
docker compose up -d mysql
```

La base `letterbook` et l’utilisateur `letterbook` / `letterbook` correspondent au fichier `backend/.env` (DATABASE_URL).

### Backend

```bash
cd backend
composer install
php bin/console lexik:jwt:generate-keypair --skip-if-exists
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console app:seed-admin
symfony server:start
# ou : php -S 127.0.0.1:8000 -t public
```

Compte administrateur par défaut (après `app:seed-admin`) :

- **Email** : `admin@letterbook.local`
- **Mot de passe** : `AdminLetterBook!2026`

Documentation : [`docs/DOCUMENTATION_TECHNIQUE.md`](docs/DOCUMENTATION_TECHNIQUE.md), [`docs/DOCUMENTATION_UTILISATEUR.md`](docs/DOCUMENTATION_UTILISATEUR.md).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le proxy Vite envoie `/api` vers `http://127.0.0.1:8000`. Pour changer la cible :

```bash
VITE_PROXY_API=http://127.0.0.1:8099 npm run dev
```

### Tests backend

```bash
cd backend
php bin/console doctrine:schema:drop --force --env=test
php bin/console doctrine:schema:create --env=test
php bin/phpunit
```

(En test, SQLite via `.env.test` ; les migrations MySQL peuvent être appliquées en prod avec `doctrine:migrations:migrate`.)

### Smoke tests frontend (Playwright)

```bash
cd frontend
npm install
npx playwright install
npm run test:e2e
```

### Intégration continue (GitHub Actions)

Chaque push et chaque Pull Request sur `main` déclenche le workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) :

1. **lint** — PHP CS Fixer (`--dry-run`) + PHPStan niveau 5  
2. **phpunit** — ~47 tests unitaires et fonctionnels (SQLite)  
3. **playwright** — smoke tests e2e (Chromium)

En local, les mêmes commandes :

```bash
# Backend
cd backend
vendor/bin/php-cs-fixer fix --dry-run --diff
php bin/console cache:warmup --env=dev
vendor/bin/phpstan analyse
php bin/phpunit

# Frontend
cd frontend
npm run test:e2e
```

## Variables d’environnement

Voir `backend/.env.example` et `.env.example` à la racine. Principales clés :

- `DATABASE_URL`
- `JWT_*` (clés générées par `lexik:jwt:generate-keypair`)
- `GOOGLE_BOOKS_API_KEY` (optionnel mais recommandé pour la recherche Google Books)
- `CORS_ALLOW_ORIGIN` (origines autorisées pour le front)

## Documentation

- [Guide utilisateur](docs/DOCUMENTATION_UTILISATEUR.md)
- [Déploiement production](docs/DEPLOIEMENT.md) (build SPA, Nginx/Caddy, variables, checklist pré-release)
- [Checklist Go/No-Go release](docs/DEPLOIEMENT.md#8-checklist-go-no-go)
