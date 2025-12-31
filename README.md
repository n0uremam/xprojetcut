# Patterns Library

A minimal full-stack Flask app showcasing a patterns database with user/admin access, cascading vehicle filters, and sample data.

## Features
- **Admin-only uploads:** Only authenticated admins can publish new patterns using the dashboard.
- **Cascading filters:** Type → Brand → Year → Model → Trim dropdowns stay in sync to mirror the automotive selection flow.
- **Searchable gallery:** Browse cards with imagery, specs, and tags for each pattern.
- **Seed data:** First launch seeds an admin user (`admin` / `admin123`) and example patterns.

## Getting started
1. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```
2. Configure your database
   - Default: SQLite stored at `patterns.db`
   - Neon (or any Postgres): set `DATABASE_URL=postgresql://<user>:<password>@<host>/<db>`
3. Run the app
   ```bash
   python netlify/functions/app.py
   ```
4. Open http://localhost:5000 and sign in with the admin account to upload new patterns.

Set `APP_SECRET_KEY` in your environment for production deployments.

### Optional: sync patterns to GitHub
Provide these variables to automatically publish a JSON snapshot of all patterns whenever an admin uploads a new one:
- `GITHUB_PATTERNS_REPO` — `owner/repo` to write into (must already exist)
- `GITHUB_TOKEN` — token with `contents:write` scope
- `GITHUB_PATTERNS_BRANCH` — branch to write to (default: `main`)
- `GITHUB_PATTERNS_PATH` — path inside the repo for the JSON (default: `data/patterns.json`)

## Deploying to Netlify (serverless)

Netlify can host the Flask app as a Python function while serving the `static/` assets directly. This prevents the default 404 page and keeps routing aligned with the Flask views:

1. Set your environment variables (`DATABASE_URL`, `APP_SECRET_KEY`, and any GitHub sync keys) in the Netlify site settings.
2. Deploy the repository. Netlify will package `netlify/functions/app.py` with the included `templates/` and `static/` folders and expose it at `/.netlify/functions/app`.
3. The `netlify.toml` redirect forwards all routes to the function while letting Netlify serve static files from the `static/` directory.
4. If Neon is used, ensure Netlify can reach it (e.g., allowlisting IPs or using a pooled connection string).

Local test with the Netlify CLI:

```bash
netlify dev --port 8888
```


## Deploying with GitHub Actions + GHCR
1. Publish the repo to GitHub and create a [fine-grained personal access token](https://github.com/settings/tokens) with `write:packages` scope. Save it as the `GHCR_TOKEN` secret in your repository settings.
2. Push to `main` (or trigger the workflow manually). The included workflow will:
   - run `python -m compileall .` for a quick syntax check
   - build a Docker image from the `Dockerfile`
   - push the image to `ghcr.io/<OWNER>/<REPO>:latest` and `:COMMIT_SHA`
3. Run the container anywhere Docker is available:
   ```bash
   docker run -p 5000:5000 -e APP_SECRET_KEY="change-me" ghcr.io/<OWNER>/<REPO>:latest
   ```
   The app will initialize its configured database on first start.
