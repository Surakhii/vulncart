from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import get_db, md5

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "All fields required"}), 400

    db = get_db()
    try:
        # VULN #6: Password stored as MD5
        db.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (username, email, md5(password))
        )
        db.commit()
        return jsonify({"message": "Registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 409
    finally:
        db.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "")
    password = data.get("password", "")

    db = get_db()
    # No rate limiting (would be VULN #4, but replaced with reflected XSS)
    user = db.execute(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        (username, md5(password))
    ).fetchone()
    db.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    # VULN #6: JWT with weak secret "secret", no expiry set
    token = create_access_token(identity=str(user["id"]), additional_claims={
        "username": user["username"],
        "role": user["role"]
    })
    return jsonify({
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"]
        }
    })


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    db = get_db()
    user = db.execute("SELECT id, username, email, role FROM users WHERE id = ?", (user_id,)).fetchone()
    db.close()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(dict(user))
