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
   - `https://YOUR-SITE.netlify.app/.netlify/functions/app` → displays the full gallery UI (or a Neon-powered dataset when configured)

If the last URL 404s, Netlify did not find `netlify/functions/app.js` during the build (check the Functions tab and deploy logs).

## Optional Neon database

The function can persist patterns to a Neon/Postgres database using [`@netlify/neon`](https://github.com/netlify/neon-client). To enable it:

1. Set an environment variable in Netlify (or locally) named `NETLIFY_DATABASE_URL` with your Neon connection string.
2. Redeploy. The function will create a `patterns` table automatically and seed a few sample rows on first run.
3. When logged in as the admin user (`admin` / `admin123`), new and edited patterns will be upserted to Neon. Deletes also propagate to the table.

If the environment variable is missing, the app falls back to an in-memory store for the current function instance and still renders the gallery using the bundled seed data.

## Using a different backend
Netlify does **not** run Python/Flask functions. If you need Flask, host it on a Python-friendly provider (Render, Railway, etc.) and call it from the frontend. To keep everything on Netlify, rewrite the backend in Node.js as additional functions alongside `netlify/functions/app.js`.

## Pattern data folder

The `patterns/` directory is included for storing exported pattern JSON or assets under version control. The in-browser admin tools keep edits locally (via `localStorage`); copy any saved datasets into `patterns/` if you want them tracked in GitHub.
