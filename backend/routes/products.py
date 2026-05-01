import os
import sqlite3
import requests
from flask import Blueprint, request, jsonify, current_app
from database import get_db

products_bp = Blueprint("products", __name__)

SECURE_MODE = os.environ.get("SECURE_MODE", "false").lower() == "true"


@products_bp.route("/", methods=["GET"])
def list_products():
    category = request.args.get("category", "")
    db = get_db()
    if category:
        products = db.execute(
            "SELECT * FROM products WHERE category = ?", (category,)
        ).fetchall()
    else:
        products = db.execute("SELECT * FROM products").fetchall()
    db.close()
    return jsonify([dict(p) for p in products])


@products_bp.route("/search", methods=["GET"])
def search():
    q = request.args.get("q", "")

    if not q:
        return jsonify([])

    db = get_db()

    if SECURE_MODE:
        # FIX #1: Parameterized query
        try:
            products = db.execute(
                "SELECT * FROM products WHERE name LIKE ? OR description LIKE ?",
                (f"%{q}%", f"%{q}%")
            ).fetchall()
            db.close()
            return jsonify([dict(p) for p in products])
        except Exception as e:
            db.close()
            return jsonify({"error": "Search failed"}), 500
    else:
        # VULN #1: SQL Injection — raw f-string in query
        # VULN #4: Reflected XSS — q reflected in error message without encoding
        try:
            products = db.execute(
                f"SELECT * FROM products WHERE name LIKE '%{q}%' OR description LIKE '%{q}%'"
            ).fetchall()
            db.close()
            return jsonify([dict(p) for p in products])
        except sqlite3.OperationalError as e:
            db.close()
            # VULN #4 + #5: Raw query error returned + q reflected unencoded
            return jsonify({
                "error": f"Search failed for query: {q}",
                "detail": str(e)
            }), 500


@products_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    db = get_db()
    product = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    db.close()
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(dict(product))


@products_bp.route("/categories", methods=["GET"])
def categories():
    db = get_db()
    cats = db.execute("SELECT DISTINCT category FROM products").fetchall()
    db.close()
    return jsonify([c["category"] for c in cats])
