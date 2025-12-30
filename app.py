import json
import os
import sqlite3
from pathlib import Path

from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "patterns.db"

app = Flask(__name__)
app.secret_key = os.environ.get("APP_SECRET_KEY", "dev-secret-key")

# Ensure database exists when the app starts (including in production servers)
init_db()


# -----------------------------
# Database helpers
# -----------------------------

def get_db_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    should_seed = not DB_PATH.exists()
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    if should_seed:
        seed_database(cursor)

    connection.commit()
    connection.close()


def seed_database(cursor: sqlite3.Cursor):
    cursor.execute(
        "INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)",
        ("admin", generate_password_hash("admin123"), 1),
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
        cursor.execute(
            """
            INSERT INTO patterns (code, name, description, type, brand, year, model, trim, tags, image_url)
            VALUES (:code, :name, :description, :type, :brand, :year, :model, :trim, :tags, :image_url)
            """,
            pattern,
        )


# -----------------------------
# Authentication helpers
# -----------------------------

def current_user():
    if "user_id" not in session:
        return None

    connection = get_db_connection()
    user = connection.execute(
        "SELECT id, username, is_admin FROM users WHERE id = ?", (session["user_id"],)
    ).fetchone()
    connection.close()
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
    connection = get_db_connection()
    query = "SELECT * FROM patterns WHERE 1=1"
    parameters = []

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
            query += f" AND {key} = ?"
            parameters.append(value)

    if search:
        query += " AND (name LIKE ? OR description LIKE ? OR tags LIKE ? OR code LIKE ?)"
        wildcard = f"%{search}%"
        parameters.extend([wildcard, wildcard, wildcard, wildcard])

    query += " ORDER BY id DESC"
    patterns = connection.execute(query, parameters).fetchall()

    raw_options = connection.execute(
        "SELECT DISTINCT type, brand, year, model, trim FROM patterns"
    ).fetchall()
    connection.close()

    options = [dict(row) for row in raw_options]

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

        connection = get_db_connection()
        user = connection.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()
        connection.close()

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

        connection = get_db_connection()
        connection.execute(
            """
            INSERT INTO patterns (code, name, description, type, brand, year, model, trim, tags, image_url)
            VALUES (:code, :name, :description, :type, :brand, :year, :model, :trim, :tags, :image_url)
            """,
            data,
        )
        connection.commit()
        connection.close()

        return redirect(url_for("index"))

    return render_template("admin.html", user=current_user())


@app.route("/api/options")
def api_options():
    connection = get_db_connection()
    rows = connection.execute(
        "SELECT DISTINCT type, brand, year, model, trim FROM patterns"
    ).fetchall()
    connection.close()
    return jsonify([dict(row) for row in rows])


@app.route("/api/patterns")
def api_patterns():
    connection = get_db_connection()
    rows = connection.execute("SELECT * FROM patterns").fetchall()
    connection.close()
    return jsonify([dict(row) for row in rows])


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
