import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    DATABASE_NAME: str = os.getenv(
        "DATABASE_NAME",
        "digital_store"
    )

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = os.getenv(
        "JWT_ALGORITHM",
        "HS256"
    )
    JWT_EXPIRE_MINUTES: int = int(
        os.getenv("JWT_EXPIRE_MINUTES", "60")
    )

    # Frontend
    FRONTEND_URL: str = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    # Backend public URL
    PUBLIC_API_URL: str = os.getenv(
        "PUBLIC_API_URL",
        "http://127.0.0.1:8000"
    )

    # Compatibility with existing admin.py
    BACKEND_PUBLIC_URL: str = os.getenv(
        "BACKEND_PUBLIC_URL",
        PUBLIC_API_URL
    )

    # Payment
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

    # Digital files
    DIGITAL_FILES_DIR: str = os.getenv(
        "DIGITAL_FILES_DIR",
        "storage/products"
    )

    # Download token
    DOWNLOAD_TOKEN_EXPIRE_HOURS: int = int(
        os.getenv(
            "DOWNLOAD_TOKEN_EXPIRE_HOURS",
            "48"
        )
    )

    # Gmail SMTP
    SMTP_HOST: str = os.getenv(
        "SMTP_HOST",
        "smtp.gmail.com"
    )

    SMTP_PORT: int = int(
        os.getenv(
            "SMTP_PORT",
            "587"
        )
    )

    SMTP_USERNAME: str = os.getenv(
        "SMTP_USERNAME",
        ""
    )

    SMTP_PASSWORD: str = os.getenv(
        "SMTP_PASSWORD",
        ""
    )

    SMTP_FROM_EMAIL: str = os.getenv(
        "SMTP_FROM_EMAIL",
        ""
    )

    SMTP_FROM_NAME: str = os.getenv(
        "SMTP_FROM_NAME",
        "DigitalStore"
    )

    # Password reset
    PASSWORD_RESET_EXPIRE_MINUTES: int = int(
        os.getenv(
            "PASSWORD_RESET_EXPIRE_MINUTES",
            "30"
        )
    )


settings = Settings()