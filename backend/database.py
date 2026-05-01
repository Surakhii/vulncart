import sqlite3
import hashlib
import os

DB_PATH = os.environ.get("DB_PATH", "/tmp/vulncart.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def md5(password):
    return hashlib.md5(password.encode()).hexdigest()


def init_db():
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            category TEXT,
            image_url TEXT,
            stock INTEGER DEFAULT 100
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            total REAL NOT NULL,
            address TEXT,
            card_last4 TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            rating INTEGER DEFAULT 5,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(product_id) REFERENCES products(id)
        );
    """)

    # Seed users (passwords in MD5 — vuln by design)
    users = [
        ("alice", "alice@vulncart.io", md5("password123"), "user"),
        ("bob", "bob@vulncart.io", md5("letmein"), "user"),
        ("admin", "admin@vulncart.io", md5("admin"), "admin"),
    ]
    c.executemany(
        "INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?,?,?,?)",
        users
    )

    # Seed products
    products = [
        ("StellarBuds Pro", "Wireless earbuds with 40hr battery and ANC", 129.99, "Audio", "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400", 50),
        ("NexaPhone 15", "6.7\" OLED, 200MP camera, 5G flagship", 999.99, "Phones", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400", 30),
        ("VisionX Headset", "Mixed reality headset with 4K per-eye display", 2499.99, "XR", "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400", 10),
        ("SlimBook Air", "13\" laptop, 20hr battery, 2kg ultrabook", 1199.99, "Laptops", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400", 25),
        ("ClearCam 4K", "Mirrorless camera with dual-stabilization", 849.99, "Cameras", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400", 15),
        ("PowerStation 20K", "20,000mAh GaN charger, 140W output", 79.99, "Accessories", "https://images.unsplash.com/photo-1609592806596-b55a2a27e6b8?w=400", 200),
        ("ArcWatch Ultra", "Titanium smartwatch, ECG, SpO2, GPS", 499.99, "Wearables", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400", 40),
        ("DeskPad XL", "900x400mm desk mat, RGB edge lighting", 39.99, "Accessories", "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400", 300),
        ("SoundBar X7", "7.1.4 Dolby Atmos soundbar with wireless sub", 599.99, "Audio", "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400", 20),
        ("TabPro 12", "12\" AMOLED tablet, S-Pen included, 12GB RAM", 749.99, "Tablets", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400", 35),
        ("MechKeys TKL", "Tenkeyless mechanical keyboard, tactile switches", 149.99, "Accessories", "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400", 80),
        ("StreamCam Pro", "4K webcam with AI background removal", 199.99, "Cameras", "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400", 60),
        ("GamingMouse X", "26K DPI, 8 programmable buttons, wireless", 89.99, "Accessories", "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400", 120),
        ("NoisePods 3", "In-ear ANC pods with spatial audio", 249.99, "Audio", "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400", 70),
        ("DroneX Mini", "249g foldable drone, 4K, 30min flight time", 399.99, "Drones", "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400", 18),
        ("LED Desk Lamp", "Circadian rhythm lamp, wireless charging base", 59.99, "Accessories", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400", 150),
        ("ProMonitor 27", "27\" 4K IPS, 144Hz, HDR600, USB-C 90W", 699.99, "Monitors", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400", 22),
        ("CableKit Pro", "Magnetic USB-C cables, 240W, 6-pack", 29.99, "Accessories", "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400", 500),
        ("SSD Vault 2TB", "Portable NVMe SSD, 2TB, 2000MB/s", 179.99, "Storage", "https://images.unsplash.com/photo-1597138804456-e7dca7f59d54?w=400", 45),
        ("HomeHub 4", "Smart home controller, Matter/Thread, 16 device support", 129.99, "Smart Home", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", 55),
    ]
    c.executemany(
        "INSERT OR IGNORE INTO products (name, description, price, category, image_url, stock) VALUES (?,?,?,?,?,?)",
        products
    )

    # Seed orders
    orders = [
        (1, 1, 2, 259.98, "123 Main St, Springfield", "4242"),
        (1, 3, 1, 2499.99, "123 Main St, Springfield", "4242"),
        (2, 5, 1, 849.99, "99 Oak Ave, Portland", "1337"),
        (2, 2, 1, 999.99, "99 Oak Ave, Portland", "1337"),
    ]
    c.executemany(
        "INSERT OR IGNORE INTO orders (user_id, product_id, quantity, total, address, card_last4) VALUES (?,?,?,?,?,?)",
        orders
    )

    # Seed reviews
    reviews = [
        (1, 2, "bob", 5, "These earbuds are amazing! Battery life is insane."),
        (1, 1, "alice", 4, "Great sound quality, ANC could be better."),
        (2, 1, "alice", 5, "Best phone I've ever owned. Camera is unreal."),
    ]
    c.executemany(
        "INSERT OR IGNORE INTO reviews (product_id, user_id, username, rating, content) VALUES (?,?,?,?,?)",
        reviews
    )

    conn.commit()
    conn.close()
