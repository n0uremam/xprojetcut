import sys
from pathlib import Path

from apig_wsgi import make_lambda_handler

# Ensure the root project is importable when the function is packaged
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app import create_app  # noqa: E402

flask_app = create_app()
lambda_handler = make_lambda_handler(flask_app)


def handler(event, context):
    """Netlify Functions entrypoint backed by the Flask application."""

    return lambda_handler(event, context)
