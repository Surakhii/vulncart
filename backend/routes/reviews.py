import os
import bleach
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from database import get_db

reviews_bp = Blueprint("reviews", __name__)

SECURE_MODE = os.environ.get("SECURE_MODE", "false").lower() == "true"


@reviews_bp.route("/<int:product_id>", methods=["GET"])
def get_reviews(product_id):
    db = get_db()
    reviews = db.execute(
        "SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC",
        (product_id,)
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in reviews])


@reviews_bp.route("/<int:product_id>", methods=["POST"])
@jwt_required()
def add_review(product_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    username = claims.get("username", "anonymous")
    data = request.get_json()
    content = data.get("content", "").strip()
    rating = data.get("rating", 5)

    if not content:
        return jsonify({"error": "Review content required"}), 400

    if SECURE_MODE:
        # FIX #2: Sanitize input with bleach
        content = bleach.clean(content, tags=[], strip=True)
    # VULN #2 (vulnerable mode): content stored raw, rendered as dangerouslySetInnerHTML in React

    db = get_db()
    db.execute(
        "INSERT INTO reviews (product_id, user_id, username, rating, content) VALUES (?,?,?,?,?)",
        (product_id, user_id, username, rating, content)
    )
    db.commit()
    db.close()
    return jsonify({"message": "Review posted"}), 201
