"""Netlify Function entrypoint for the Patterns Library Flask app."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, List, Optional

from apig_wsgi import make_lambda_handler
from flask import Flask, redirect, render_template, request, session, url_for
from sqlalchemy import Column, Integer, String, create_engine, or_, select
from sqlalchemy.orm import DeclarativeBase, Session


ROOT_DIR = Path(__file__).resolve().parents[1]
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{ROOT_DIR / 'patterns.db'}")


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    is_admin = Column(Integer, default=0)


class Pattern(Base):
    __tablename__ = "patterns"
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    type = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    year = Column(String, nullable=False)
    model = Column(String, nullable=False)
    trim = Column(String, nullable=False)
    tags = Column(String, default="")
    image_url = Column(String, default="https://via.placeholder.com/600x360?text=Pattern")


engine = create_engine(DATABASE_URL, future=True)
Base.metadata.create_all(engine)


def seed_data() -> None:
    with Session(engine) as db:
        if not db.scalar(select(User).where(User.username == "admin")):
            db.add(User(username="admin", password="admin", is_admin=1))

        if not db.scalar(select(Pattern)):
            sample_patterns: List[Pattern] = [
                Pattern(
                    code="EXT-AUDI-01",
                    name="Audi Exterior Template",
                    description="Base exterior pattern for Audi vehicles.",
                    type="Exterior",
                    brand="Audi",
                    year="2024",
                    model="A4",
                    trim="Premium",
                    tags="audi,exterior,sedan",
                ),
                Pattern(
                    code="INT-TESLA-02",
                    name="Tesla Interior Model",
                    description="Dashboard and console pattern for Model 3.",
                    type="Interior",
                    brand="Tesla",
                    year="2023",
                    model="Model 3",
                    trim="Long Range",
                    tags="tesla,interior,electric",
                ),
            ]
            db.add_all(sample_patterns)
        db.commit()


seed_data()


def create_app() -> Flask:
    app = Flask(
        __name__, template_folder=str(ROOT_DIR / "templates"), static_folder=str(ROOT_DIR / "static")
    )
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")

    @app.context_processor
    def inject_user():
        username = session.get("username")
        if not username:
            return {"user": None}
        with Session(engine) as db:
            user = db.scalar(select(User).where(User.username == username))
            return {"user": {"username": user.username, "is_admin": bool(user.is_admin)} if user else None}

    @app.route("/")
    def index():
        filters: Dict[str, Optional[str]] = {
            "type": request.args.get("type") or None,
            "brand": request.args.get("brand") or None,
            "year": request.args.get("year") or None,
            "model": request.args.get("model") or None,
            "trim": request.args.get("trim") or None,
        }
        search = request.args.get("search", "")

        query = select(Pattern)
        if search:
            like = f"%{search}%"
            query = query.where(
                or_(
                    Pattern.name.ilike(like),
                    Pattern.description.ilike(like),
                    Pattern.tags.ilike(like),
                    Pattern.code.ilike(like),
                )
            )
        for field, value in filters.items():
            if value:
                query = query.where(getattr(Pattern, field) == value)

        with Session(engine) as db:
            patterns = db.scalars(query).all()
            all_patterns = db.scalars(select(Pattern)).all()

        options = [
            {
                "type": p.type,
                "brand": p.brand,
                "year": p.year,
                "model": p.model,
                "trim": p.trim,
            }
            for p in all_patterns
        ]

        def pattern_dict(p: Pattern) -> Dict[str, str]:
            return {
                "code": p.code,
                "name": p.name,
                "description": p.description,
                "type": p.type,
                "brand": p.brand,
                "year": p.year,
                "model": p.model,
                "trim": p.trim,
                "tags": p.tags,
                "image_url": p.image_url,
            }

        return render_template(
            "index.html",
            patterns=[pattern_dict(p) for p in patterns],
            filters=filters,
            search=search,
            options=options,
        )

    @app.route("/login", methods=["GET", "POST"])
    def login():
        error = None
        if request.method == "POST":
            username = request.form.get("username", "").strip()
            password = request.form.get("password", "")
            with Session(engine) as db:
                user = db.scalar(select(User).where(User.username == username))
                if user and user.password == password:
                    session["username"] = user.username
                    return redirect(url_for("index"))
            error = "Invalid credentials"
        return render_template("login.html", error=error)

    @app.route("/logout")
    def logout():
        session.pop("username", None)
        return redirect(url_for("index"))

    @app.route("/admin/patterns/new", methods=["GET", "POST"])
    def create_pattern():
        if not session.get("username"):
            return redirect(url_for("login"))
        with Session(engine) as db:
            user = db.scalar(select(User).where(User.username == session["username"]))
            if not user or not user.is_admin:
                return redirect(url_for("index"))

        error = None
        if request.method == "POST":
            payload = {key: request.form.get(key, "").strip() for key in [
                "code",
                "name",
                "description",
                "type",
                "brand",
                "year",
                "model",
                "trim",
                "tags",
                "image_url",
            ]}

            if not all(payload.values()):
                error = "All fields are required."
            else:
                with Session(engine) as db:
                    db.add(Pattern(**payload))
                    db.commit()
                return redirect(url_for("index"))

        return render_template("admin.html", error=error)

    return app


flask_app = create_app()
handler = make_lambda_handler(flask_app)


if __name__ == "__main__":
    flask_app.run(debug=True)
