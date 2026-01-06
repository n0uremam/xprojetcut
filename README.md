# Render-ready patterns library

This repository hosts a full Express server for Render Web Services. It serves the pattern gallery UI and a CockroachDB-backed API from the same process that listens on `process.env.PORT`.

## Project layout
```
.
├── server.js          # Express entrypoint for Render
├── index.html         # Redirects to /api (optional entry)
├── static/            # CSS/JS assets used by the inline UI
└── patterns/          # Optional version-controlled exports
```

## Running locally
1. Install dependencies: `npm install`
2. Set `DATABASE_URL` (or `NETLIFY_DATABASE_URL`) to your CockroachDB connection string, e.g.
   `postgresql://USER:PASSWORD@host:26257/defaultdb?sslmode=verify-full`
3. Start the server: `npm start`
4. Open `http://localhost:3000/api` to use the app.

The server will log `DB: cockroach` when connected to CockroachDB, or `DB: memory` if no database URL is provided. Tables are created automatically; no seed data is inserted. To allow the legacy in-memory fallback (not recommended for production), set `ALLOW_MEMORY_FALLBACK=1`. When running without a database, the service loads/saves `patterns/backup.json` so data survives restarts on the same instance; with CockroachDB enabled, backups mirror the remote data after each read/write.

## Deploying to Render
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- Make sure `DATABASE_URL` (or `NETLIFY_DATABASE_URL`) is configured in Render environment variables.

Routes:
- `/` and `/api` render the gallery UI.
- `/api/patterns` provides JSON GET/POST/DELETE for pattern data.

If the database URL is present but unavailable, API calls return `500` errors rather than silently falling back to memory.
