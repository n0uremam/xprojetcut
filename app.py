import base64
import json
import os
from pathlib import Path

import requests
from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "patterns.db"
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")
IS_SQLITE = DATABASE_URL.startswith("sqlite")

GITHUB_REPO = os.environ.get("GITHUB_PATTERNS_REPO")  # e.g. owner/repo
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_BRANCH = os.environ.get("GITHUB_PATTERNS_BRANCH", "main")
GITHUB_PATH = os.environ.get("GITHUB_PATTERNS_PATH", "data/patterns.json")

app = Flask(__name__)
app.secret_key = os.environ.get("APP_SECRET_KEY", "dev-secret-key")
engine = create_engine(DATABASE_URL, future=True)


# -----------------------------
# Database helpers
# -----------------------------

def init_db():
    id_definition = "INTEGER PRIMARY KEY AUTOINCREMENT" if IS_SQLITE else "SERIAL PRIMARY KEY"

    with engine.begin() as connection:
        connection.execute(
            text(
                f"""
                CREATE TABLE IF NOT EXISTS users (
                    id {id_definition},
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    is_admin INTEGER DEFAULT 0
                )
                """
            )
        )
        connection.execute(
            text(
                f"""
                CREATE TABLE IF NOT EXISTS patterns (
                    id {id_definition},
                    code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    type TEXT,
                    brand TEXT,
                    year TEXT,
                    model TEXT,
                    trim TEXT,
                    tags TEXT,
                    image_url TEXT
                )
                """
            )
        )

        existing_users = connection.execute(
            text("SELECT COUNT(*) FROM users")
        ).scalar_one()
        if existing_users == 0:
            seed_database(connection)


def seed_database(connection):
    connection.execute(
        text(
            "INSERT INTO users (username, password_hash, is_admin) VALUES (:username, :password_hash, :is_admin)"
        ),
        {
            "username": "admin",
            "password_hash": generate_password_hash("admin123"),
            "is_admin": 1,
        },
    )

    sample_patterns = [
        {
            "code": "PAT006",
            "name": "Racing Stripes",
            "description": "Dynamic racing stripe pattern for motorcycles",
            "type": "Motorcycle",
            "brand": "Ducati",
            "year": "2024",
            "model": "Panigale",
            "trim": "R",
            "tags": "stripes,sport",
            "image_url": "https://images.unsplash.com/photo-1502877828070-33b167ad6860?auto=format&fit=crop&w=900&q=80",
        },
        {
            "code": "PAT007",
            "name": "Brushed Aluminum",
            "description": "Elegant brushed aluminum finish for interior trim",
            "type": "Interior",
            "brand": "Skoda",
            "year": "2024",
            "model": "Enyaq IV",
            "trim": "Luxe",
            "tags": "aluminum,elegant,luxury",
            "image_url": "https://images.unsplash.com/photo-1453491945771-a1e904948959?auto=format&fit=crop&w=900&q=80",
        },
        {
            "code": "PAT008",
            "name": "Wood Grain Veneer",
            "description": "Authentic wood grain pattern for luxury interiors",
            "type": "Interior",
            "brand": "BMW",
            "year": "2024",
            "model": "i7",
            "trim": "Executive",
            "tags": "wood,luxury,grain",
            "image_url": "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80",
        },
        {
            "code": "PAT009",
            "name": "Matte Stealth",
            "description": "Low-gloss exterior wrap for modern coupes",
            "type": "Exterior",
            "brand": "Audi",
            "year": "2023",
            "model": "A5",
            "trim": "S-Line",
            "tags": "matte,stealth,coupe",
            "image_url": "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?auto=format&fit=crop&w=900&q=80",
        },
    ]

    for pattern in sample_patterns:
        connection.execute(
            text(
                """
                INSERT INTO patterns (code, name, description, type, brand, year, model, trim, tags, image_url)
                VALUES (:code, :name, :description, :type, :brand, :year, :model, :trim, :tags, :image_url)
                """
            ),
            pattern,
        )


# -----------------------------
# Authentication helpers
# -----------------------------

def current_user():
    if "user_id" not in session:
        return None

    with engine.connect() as connection:
        user = connection.execute(
            text("SELECT id, username, is_admin FROM users WHERE id = :user_id"),
            {"user_id": session["user_id"]},
        ).mappings().first()
        return user


def require_admin():
    user = current_user()
    if not user or not user["is_admin"]:
        return redirect(url_for("login"))
    return None


# -----------------------------
# Routes
# -----------------------------

@app.route("/")
def index():
    query = "SELECT * FROM patterns"
    parameters = {}
    conditions = []

    filters = {
        "type": request.args.get("type"),
        "brand": request.args.get("brand"),
        "year": request.args.get("year"),
        "model": request.args.get("model"),
        "trim": request.args.get("trim"),
    }

    search = request.args.get("search")

    for key, value in filters.items():
        if value:
            conditions.append(f"{key} = :{key}")
            parameters[key] = value

    if search:
        wildcard = f"%{search.lower()}%"
        conditions.append(
            "(" +
            " OR ".join(
                [
                    "LOWER(name) LIKE :search",
                    "LOWER(description) LIKE :search",
                    "LOWER(tags) LIKE :search",
                    "LOWER(code) LIKE :search",
                ]
            ) +
            ")"
        )
        parameters["search"] = wildcard

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY id DESC"

    with engine.connect() as connection:
        patterns = connection.execute(text(query), parameters).mappings().all()
        options = connection.execute(
            text("SELECT DISTINCT type, brand, year, model, trim FROM patterns")
        ).mappings().all()

    return render_template(
        "index.html",
        patterns=patterns,
        options=json.dumps(options),
        filters=filters,
        search=search or "",
        user=current_user(),
    )


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        with engine.connect() as connection:
            user = connection.execute(
                text("SELECT * FROM users WHERE username = :username"),
                {"username": username},
            ).mappings().first()

        if user and check_password_hash(user["password_hash"], password):
            session["user_id"] = user["id"]
            return redirect(url_for("index"))

        return render_template("login.html", error="Invalid credentials"), 401

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))


@app.route("/admin/patterns/new", methods=["GET", "POST"])
def create_pattern():
    redirect_response = require_admin()
    if redirect_response:
        return redirect_response

    if request.method == "POST":
        data = {
            "code": request.form.get("code"),
            "name": request.form.get("name"),
            "description": request.form.get("description"),
            "type": request.form.get("type"),
            "brand": request.form.get("brand"),
            "year": request.form.get("year"),
            "model": request.form.get("model"),
            "trim": request.form.get("trim"),
            "tags": request.form.get("tags"),
            "image_url": request.form.get("image_url"),
        }

        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    INSERT INTO patterns (code, name, description, type, brand, year, model, trim, tags, image_url)
                    VALUES (:code, :name, :description, :type, :brand, :year, :model, :trim, :tags, :image_url)
                    """
                ),
                data,
            )
            patterns = connection.execute(text("SELECT * FROM patterns")).mappings().all()
            sync_patterns_to_github(patterns)

        return redirect(url_for("index"))

    return render_template("admin.html", user=current_user())


@app.route("/api/options")
def api_options():
    with engine.connect() as connection:
        rows = connection.execute(
            text("SELECT DISTINCT type, brand, year, model, trim FROM patterns")
        ).mappings().all()
    return jsonify(rows)


@app.route("/api/patterns")
def api_patterns():
    with engine.connect() as connection:
        rows = connection.execute(text("SELECT * FROM patterns")).mappings().all()
    return jsonify(rows)


def sync_patterns_to_github(patterns):
    """Persist patterns to GitHub as a JSON artifact when credentials are provided."""

    if not GITHUB_REPO or not GITHUB_TOKEN:
        return

    try:
        payload = json.dumps(patterns, indent=2)
        encoded_content = base64.b64encode(payload.encode()).decode()

        headers = {
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
        }
        url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{GITHUB_PATH}"

        existing = requests.get(url, headers=headers, params={"ref": GITHUB_BRANCH})
        sha = existing.json().get("sha") if existing.ok else None

        response = requests.put(
            url,
            headers=headers,
            json={
                "message": "chore: sync patterns",
                "content": encoded_content,
                "branch": GITHUB_BRANCH,
                **({"sha": sha} if sha else {}),
            },
            timeout=10,
        )
        response.raise_for_status()
    except (requests.RequestException, SQLAlchemyError) as exc:
        print(f"GitHub sync skipped: {exc}")


def create_app():
    """Flask application factory for Gunicorn and Flask CLI."""

    init_db()
    return app


# Ensure database exists when the app starts (including in production servers)
init_db()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
