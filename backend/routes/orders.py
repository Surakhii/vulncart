from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/", methods=["GET"])
@jwt_required()
def my_orders():
    user_id = get_jwt_identity()
    db = get_db()
    orders = db.execute(
        """SELECT o.*, p.name as product_name, p.image_url
           FROM orders o JOIN products p ON o.product_id = p.id
           WHERE o.user_id = ?""",
        (user_id,)
    ).fetchall()
    db.close()
    return jsonify([dict(o) for o in orders])


@orders_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):
    db = get_db()
    # VULN #3: IDOR — no ownership check, any authenticated user can view any order
    order = db.execute(
        """SELECT o.*, p.name as product_name, p.image_url, u.username as buyer
           FROM orders o
           JOIN products p ON o.product_id = p.id
           JOIN users u ON o.user_id = u.id
           WHERE o.id = ?""",
        (order_id,)
    ).fetchone()
    db.close()

    if not order:
        return jsonify({"error": "Order not found"}), 404

    return jsonify(dict(order))


@orders_bp.route("/", methods=["POST"])
@jwt_required()
def place_order():
    user_id = get_jwt_identity()
    data = request.get_json()
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)
    address = data.get("address", "")
    card_last4 = data.get("card_last4", "0000")

    db = get_db()
    product = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    if not product:
        db.close()
        return jsonify({"error": "Product not found"}), 404

    total = product["price"] * quantity
    db.execute(
        "INSERT INTO orders (user_id, product_id, quantity, total, address, card_last4) VALUES (?,?,?,?,?,?)",
        (user_id, product_id, quantity, total, address, card_last4)
    )
    db.commit()
    order_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.close()

    return jsonify({"message": "Order placed", "order_id": order_id, "total": total}), 201
