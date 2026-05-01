import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from database import init_db

SECURE_MODE = os.environ.get("SECURE_MODE", "false").lower() == "true"


def create_app():
    app = Flask(__name__)

    # VULN #5 & #6: debug=True in prod, weak JWT secret, no expiry
    app.config["DEBUG"] = True
    app.config["JWT_SECRET_KEY"] = "secret"
    app.config["PROPAGATE_EXCEPTIONS"] = True

    JWTManager(app)
    CORS(app, origins="*")  # CORS wildcard

    init_db()

    from routes.auth import auth_bp
    from routes.products import products_bp
    from routes.orders import orders_bp
    from routes.reviews import reviews_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(reviews_bp, url_prefix="/api/reviews")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    app.config["SECURE_MODE"] = SECURE_MODE

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
