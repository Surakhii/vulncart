import os
import subprocess
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, verify_jwt_in_request
from database import get_db

admin_bp = Blueprint("admin", __name__)

SECURE_MODE = os.environ.get("SECURE_MODE", "false").lower() == "true"

ALLOWED_LOGS = ["app.log", "access.log", "error.log"]


def check_admin():
    """VULN #9: Trusts the 'role' claim in the JWT payload directly.
    No database lookup — if the token says admin, it gets admin access.
    JWT secret is 'secret' (VULN #6), so any attacker who discovers it
    can forge a token with role:admin and bypass this entirely."""
    try:
        verify_jwt_in_request()
        claims = get_jwt()
        return claims.get("role") == "admin"
    except Exception:
        return False


@admin_bp.route("/users", methods=["GET"])
def list_users():
    if not check_admin():
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    users = db.execute("SELECT id, username, email, password, role FROM users").fetchall()
    db.close()
    # Returns MD5 hashes — crackable offline
    return jsonify([dict(u) for u in users])


@admin_bp.route("/orders", methods=["GET"])
def list_orders():
    if not check_admin():
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    orders = db.execute(
        """SELECT o.*, u.username, u.email, p.name as product_name
           FROM orders o JOIN users u ON o.user_id = u.id
           JOIN products p ON o.product_id = p.id"""
    ).fetchall()
    db.close()
    return jsonify([dict(o) for o in orders])


@admin_bp.route("/import-image", methods=["POST"])
def import_image():
    """VULN #7: SSRF — fetches any URL server-side without validation."""
    if not check_admin():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    url = data.get("url", "")

    if not url:
        return jsonify({"error": "URL required"}), 400

    try:
        # VULN #7: No URL validation — attacker can hit internal endpoints, cloud metadata
        resp = requests.get(url, timeout=5)
        return jsonify({
            "status": resp.status_code,
            "content_type": resp.headers.get("Content-Type", ""),
            "body": resp.text[:2000],
            "message": "Image imported successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/coupon", methods=["POST"])
def apply_coupon():
    """VULN #8: Command Injection — coupon code passed to shell."""
    if not check_admin():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    code = data.get("code", "")

    if not code:
        return jsonify({"error": "Coupon code required"}), 400

    try:
        # VULN #8: Raw string interpolation into shell command
        result = subprocess.check_output(
            f"echo Validating coupon: {code}",
            shell=True,
            stderr=subprocess.STDOUT,
            timeout=5
        ).decode()
        return jsonify({"output": result, "valid": "SAVE" in code.upper()})
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Validation timed out"}), 500
    except subprocess.CalledProcessError as e:
        return jsonify({"output": e.output.decode(), "valid": False})


@admin_bp.route("/logs", methods=["GET"])
def read_logs():
    """VULN #10: Path Traversal / LFI — user-supplied filename with no validation."""
    if not check_admin():
        return jsonify({"error": "Unauthorized"}), 401

    filename = request.args.get("file", "app.log")

    if SECURE_MODE:
        # FIX #3: Whitelist validation
        if filename not in ALLOWED_LOGS:
            return jsonify({"error": "Access denied: invalid log file"}), 403
        base_path = "/var/log/vulncart"
        filepath = os.path.join(base_path, filename)
    else:
        # VULN #10: No path validation — ../../etc/passwd works
        filepath = f"/var/log/{filename}"

    try:
        with open(filepath, "r") as f:
            content = f.read(10000)
        return jsonify({"file": filename, "content": content})
    except FileNotFoundError:
        return jsonify({"error": f"File not found: {filepath}"}), 404
    except PermissionError:
        return jsonify({"error": "Permission denied"}), 403
    except Exception as e:
        # VULN #5: Verbose error with internal path
        return jsonify({"error": str(e), "path": filepath}), 500


@admin_bp.route("/stats", methods=["GET"])
def stats():
    if not check_admin():
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    user_count = db.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
    product_count = db.execute("SELECT COUNT(*) as c FROM products").fetchone()["c"]
    order_count = db.execute("SELECT COUNT(*) as c FROM orders").fetchone()["c"]
    revenue = db.execute("SELECT SUM(total) as s FROM orders").fetchone()["s"] or 0
    db.close()
    return jsonify({
        "users": user_count,
        "products": product_count,
        "orders": order_count,
        "revenue": round(revenue, 2)
    })
