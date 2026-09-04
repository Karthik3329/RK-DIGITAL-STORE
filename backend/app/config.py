import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    DATABASE_NAME: str = os.getenv(
        "DATABASE_NAME",
        "digital_store"
    )

    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = os.getenv(
        "JWT_ALGORITHM",
        "HS256"
    )
    JWT_EXPIRE_MINUTES: int = int(
        os.getenv(
            "JWT_EXPIRE_MINUTES",
            "60"
        )
    )

    FRONTEND_URL: str = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    PAYMENT_UPI_ID: str = os.getenv(
    "PAYMENT_UPI_ID",
    ""
)

    PAYMENT_ACCOUNT_NAME: str = os.getenv(
    "PAYMENT_ACCOUNT_NAME",
    "DigitalStore"
)

    PAYMENT_QR_PATH: str = os.getenv(
    "PAYMENT_QR_PATH",
    "payment_qr.png"
)

    DIGITAL_FILES_DIR: str = os.getenv(
    "DIGITAL_FILES_DIR",
    "storage/products"
)


settings = Settings()