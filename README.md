# Netlify function sanity check

Netlify Functions only run JavaScript/TypeScript/Go. This repository ships a minimal Node.js function (`netlify/functions/app.js`) plus a loading page that forwards users to the function URL so you can confirm the deployment works end-to-end.

## Folder layout
```
.
├── Homepage.html        # Root landing page -> redirects to /.netlify/functions/app
├── _redirects           # Sends / to Homepage.html
├── netlify.toml         # Points Netlify at functions/ and the publish root
└── netlify
    └── functions
        └── app.js       # Minimal confirmation handler
```

## Deploying to Netlify
1. Ensure the build settings use `publish = .` and `functions = netlify/functions` (already set in `netlify.toml`).
2. If your Netlify UI build command still runs `pip install -r netlify/functions/requirements.txt`, the repo includes a placeholder file there so the step succeeds even though the function is Node-based.
3. Deploy the repo.
4. After the deploy finishes, open these URLs (replace YOUR-SITE with your domain):
   - `https://YOUR-SITE.netlify.app/` → shows the loading page briefly
   - `https://YOUR-SITE.netlify.app/Homepage.html` → same loading page
   - `https://YOUR-SITE.netlify.app/.netlify/functions/app` → displays the full gallery UI (or a CockroachDB-backed dataset when configured)

If the last URL 404s, Netlify did not find `netlify/functions/app.js` during the build (check the Functions tab and deploy logs).

## Optional CockroachDB database

The function can persist patterns to a CockroachDB Cloud (Postgres-compatible) database using the `pg` client. To enable it:

1. Set an environment variable in Netlify (or locally) named `DATABASE_URL` or `NETLIFY_DATABASE_URL` with your CockroachDB connection string (for example: `postgresql://abdoelamir:<PASSWORD>@corgi-spectre-20069.j77.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full`).
2. Redeploy. The function will create a `patterns` table automatically (no default rows are inserted).
3. When logged in as the admin user (`admin` / `admin123`), new and edited patterns will be upserted to CockroachDB. Uploaded images are stored as Base64 in the `image_data` column alongside `image_url`, and deletes also propagate to the table.

If the environment variable is missing, the app falls back to an in-memory store for the current function instance; patterns start empty until you add some.

## Using a different backend
Netlify does **not** run Python/Flask functions. If you need Flask, host it on a Python-friendly provider (Render, Railway, etc.) and call it from the frontend. To keep everything on Netlify, rewrite the backend in Node.js as additional functions alongside `netlify/functions/app.js`.

## Pattern data folder

The `patterns/` directory is included for storing exported pattern JSON or assets under version control. When CockroachDB is configured, admin edits (including uploaded images) are persisted to the database; otherwise the function keeps changes in memory for the current invocation.
