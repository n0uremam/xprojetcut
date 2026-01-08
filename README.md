# Fly.io-ready patterns library

This repository hosts a full Express server for Fly.io. It serves the pattern gallery UI and a CockroachDB-backed API from the same process that listens on `process.env.PORT`.

## Project layout
```
.
├── server.js          # Express entrypoint for Fly.io
├── index.html         # Redirects to /api (optional entry)
├── static/            # CSS/JS assets used by the inline UI
└── patterns/          # Optional version-controlled exports
```

## Running locally
1. Install dependencies: `npm install`
2. Set `DATABASE_URL` to your CockroachDB connection string, e.g.
   `postgresql://USER:PASSWORD@host:26257/defaultdb?sslmode=verify-full`
3. Start the server: `npm start`
4. Open `http://localhost:3000/api` to use the app.

The server logs `DB: cockroach` when connected to CockroachDB. If no database URL is provided, the server falls back to in-memory storage.

## Deploying to Fly.io
- Deploy with the included `fly.toml` and `Dockerfile`.
- Configure `DATABASE_URL` in Fly.io secrets (CockroachDB connection string).
- The app listens on port `3000` and is exposed via Fly.io's HTTP service.

Quick commands:
- `fly launch`
- `fly secrets set DATABASE_URL="postgresql://USER:PASSWORD@HOST:26257/defaultdb?sslmode=verify-full"`
- `fly deploy`

Routes:
- `/` and `/api` render the gallery UI.
- `/api/patterns` provides JSON GET/POST/DELETE for pattern data.

If the database URL is present but unavailable, API calls return `500` errors rather than silently falling back to memory.
