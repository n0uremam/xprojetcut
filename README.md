# Cloudflare Pages + Pages Functions sanity check

This repository serves a static landing page plus a Node.js Pages Function (`functions/api/[...all].js`) that renders the gallery UI and exposes the patterns API. It is ready for a GitHub-connected Cloudflare Pages deployment.

## Folder layout
```
.
├── Homepage.html        # Root landing page -> redirects to /api
├── _redirects           # Sends / to Homepage.html
├── netlify.toml         # Legacy Netlify config (not used by Cloudflare)
├── functions
│   └── api
│       └── [...all].js  # Cloudflare Pages Function entry
└── netlify
    └── functions        # Legacy Netlify function folder (unused on Cloudflare)
        └── app.cjs
```

## Deploying to Cloudflare Pages
1. Connect the repository to Cloudflare Pages and keep the publish directory as `.` (no build command is required for the static assets).
2. Pages Functions automatically bundle `functions/api/[...all].js`; no extra configuration is needed.
3. After deploy, test:
   - `https://YOUR-SITE.pages.dev/` → shows the loading page briefly
   - `https://YOUR-SITE.pages.dev/Homepage.html` → same loading page
   - `https://YOUR-SITE.pages.dev/api` → renders the full gallery UI (or a CockroachDB-backed dataset when configured)

## Optional CockroachDB database

The function can persist patterns to a CockroachDB Cloud (Postgres-compatible) database using the `pg` client. To enable it:

1. Set an environment variable in Cloudflare Pages (or locally) named `DATABASE_URL` (preferred) or `NETLIFY_DATABASE_URL` with your CockroachDB connection string (for example: `postgresql://abdoelamir:<PASSWORD>@corgi-spectre-20069.j77.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full`).
2. Redeploy. The function will create a `patterns` table automatically (no default rows are inserted) and will log `DB: cockroach` when connected.
3. When logged in as the admin user (`admin` / `admin123`), new and edited patterns will be upserted to CockroachDB. Uploaded images are stored as Base64 in the `image_data` column alongside `image_url`, and deletes also propagate to the table.

If the environment variable is missing, the app falls back to an in-memory store for the current function instance; patterns start empty until you add some. When CockroachDB is configured but unreachable, the function returns a 500 error instead of silently falling back.

## Using a different backend
Netlify does **not** run Python/Flask functions. If you need Flask, host it on a Python-friendly provider (Render, Railway, etc.) and call it from the frontend. To keep everything on Netlify, rewrite the backend in Node.js as additional functions alongside `netlify/functions/app.cjs`.

## Render start command

When deploying to Render Web Services, set the **Start Command** to `npm start` so it invokes `node netlify/functions/app.cjs` via the existing script. The function entrypoint is CommonJS-only (`app.cjs`), so avoid pointing Render or local starts at `app.js`.

## Pattern data folder

The `patterns/` directory is included for storing exported pattern JSON or assets under version control. When CockroachDB is configured, admin edits (including uploaded images) are persisted to the database; otherwise the function keeps changes in memory for the current invocation.
