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
2. Run the app
   ```bash
   python app.py
   ```
3. Open http://localhost:5000 and sign in with the admin account to upload new patterns.

Set `APP_SECRET_KEY` in your environment for production deployments.
