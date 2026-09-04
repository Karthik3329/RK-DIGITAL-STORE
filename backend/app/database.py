from pymongo import MongoClient
from app.config import settings
import certifi


client = None
db = None


# ==========================================
# CONNECT DATABASE
# ==========================================

def connect_to_database():

    global client, db

    if not settings.MONGODB_URI:
        raise ValueError(
            "MONGODB_URI is not configured."
        )

    client = MongoClient(
        settings.MONGODB_URI,

        # TLS / SSL
        tls=True,
        tlsCAFile=certifi.where(),

        # Connection timeout
        serverSelectionTimeoutMS=10000,

        # Socket timeout
        socketTimeoutMS=20000,

        # Connection timeout
        connectTimeoutMS=20000,

        # Keep connections healthy
        retryWrites=True
    )

    # Test connection
    client.admin.command("ping")

    db = client[
        settings.DATABASE_NAME
    ]

    # ==========================================
    # ORDER INDEXES
    # ==========================================

    db.orders.create_index(
        [
            ("user_id", 1),
            ("created_at", -1)
        ]
    )

    db.orders.create_index(
        "order_number",
        unique=True
    )

    # ==========================================
    # PRODUCT ID UNIQUE INDEX
    # ==========================================

    db.products.create_index(
        "product_id",
        unique=True,
        sparse=True
    )

    print(
        "✅ Connected to MongoDB successfully!"
    )


# ==========================================
# CLOSE DATABASE
# ==========================================

def close_database_connection():

    global client

    if client:
        client.close()

        print(
            "MongoDB connection closed."
        )


# ==========================================
# GET DATABASE
# ==========================================

def get_database():

    if db is None:
        raise RuntimeError(
            "Database is not connected."
        )

    return db