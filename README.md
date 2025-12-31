# Patterns Library

A minimal full-stack Flask app showcasing a patterns database with user/admin access, cascading vehicle filters, and sample data.

## Features
- **Admin-only uploads:** Only authenticated admins can publish new patterns using the dashboard.
- **Cascading filters:** Type → Brand → Year → Model → Trim dropdowns stay in sync to mirror the automotive selection flow.
- **Searchable gallery:** Browse cards with imagery, specs, and tags for each pattern.
- **Seed data:** First launch seeds an admin user (`admin` / `admin`) and example patterns.

## Getting started
1. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```
2. Configure your database
   - Default: SQLite stored at `patterns.db`
   - Neon (or any Postgres): set `DATABASE_URL=postgresql://<user>:<password>@<host>/<db>`
3. Run the app locally (includes a built-in dev server)
   ```bash
   python netlify/functions/app.py
   ```
4. Open http://localhost:5000 and sign in with the admin account to upload new patterns.

Set `SECRET_KEY` in your environment for production deployments.

## Deploying to Netlify (serverless)

Netlify can host the Flask app as a Python function while serving the `static/` assets directly. The included `netlify.toml` keeps deployment simple:

1. Set your environment variables (`DATABASE_URL`, `SECRET_KEY`) in the Netlify site settings if you want to override defaults.
2. Deploy the repository. The build command (`pip install -r netlify/functions/requirements.txt`) vendors Python dependencies for the function.
3. Netlify packages `netlify/functions/app.py` with the included `templates/` and `static/` folders and exposes it at `/.netlify/functions/app`.
4. The `_redirects` file forwards `/` to `Homepage.html`, and `netlify.toml` rewrites everything else to the function so users avoid Netlify's default 404 page.

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
