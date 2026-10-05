from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import smtplib
from email.message import EmailMessage

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.database import get_database
from app.config import settings
from app.schemas.user_schema import (
    UserRegister,
    UserLogin
)
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token
)
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


@router.post("/register")
def register(user: UserRegister):

    db = get_database()

    existing_user = db.users.find_one({
        "email": user.email.lower()
    })

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = {
        "name": user.name,
        "email": user.email.lower(),
        "password": hash_password(user.password),
        "phone": user.phone,
        "role": "customer",
        "created_at": datetime.now(timezone.utc)
    }

    result = db.users.insert_one(new_user)

    return {
        "message": "Registration successful",
        "user_id": str(result.inserted_id)
    }


@router.post("/login")
def login(user: UserLogin):

    db = get_database()

    existing_user = db.users.find_one({
        "email": user.email.lower()
    })

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    password_valid = verify_password(
        user.password,
        existing_user["password"]
    )

    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "sub": str(existing_user["_id"]),
        "role": existing_user["role"],
        "email": existing_user["email"]
    })

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(existing_user["_id"]),
            "name": existing_user["name"],
            "email": existing_user["email"],
            "role": existing_user["role"]
        }
    }


@router.get("/me")
def get_me(
    current_user=Depends(get_current_user)
):

    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"]
    }


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):

    db = get_database()

    email = data.email.lower()

    user = db.users.find_one({
        "email": email
    })

    # Always return the same response so users cannot
    # discover whether an email exists.
    success_response = {
        "message": "If an account exists, a reset link has been sent."
    }

    if not user:
        return success_response

    raw_token = secrets.token_urlsafe(48)

    token_hash = hashlib.sha256(
        raw_token.encode("utf-8")
    ).hexdigest()

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES
        )
    )

    db.users.update_one(
        {
            "_id": user["_id"]
        },
        {
            "$set": {
                "password_reset_token": token_hash,
                "password_reset_expires": expires_at
            }
        }
    )

    reset_link = (
        f"{settings.FRONTEND_URL}"
        f"/reset-password/{raw_token}"
    )

    message = EmailMessage()

    message["Subject"] = "Reset Your DigitalStore Password"
    message["From"] = (
        settings.SMTP_FROM_EMAIL
        or settings.SMTP_USERNAME
    )
    message["To"] = email

    message.set_content(
        f"""Hello {user["name"]},

We received a request to reset your DigitalStore password.

Click the link below to create a new password:

{reset_link}

This link will expire in {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
{settings.SMTP_FROM_NAME}
"""
    )

    try:

        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT
        ) as smtp:

            smtp.starttls()

            smtp.login(
                settings.SMTP_USERNAME,
                settings.SMTP_PASSWORD
            )

            smtp.send_message(message)

    except Exception as error:

        print("PASSWORD RESET EMAIL ERROR:", error)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send password reset email"
        )

    return success_response


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):

    if len(data.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password cannot be longer than 72 bytes."
        )

    db = get_database()

    token_hash = hashlib.sha256(
        data.token.encode("utf-8")
    ).hexdigest()

    user = db.users.find_one({
        "password_reset_token": token_hash
    })

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link"
        )

    expires_at = user.get(
        "password_reset_expires"
    )

    if not expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link"
        )

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    if datetime.now(timezone.utc) > expires_at:
        db.users.update_one(
            {
                "_id": user["_id"]
            },
            {
                "$unset": {
                    "password_reset_token": "",
                    "password_reset_expires": ""
                }
            }
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link"
        )

    new_password_hash = hash_password(
        data.password
    )

    db.users.update_one(
        {
            "_id": user["_id"]
        },
        {
            "$set": {
                "password": new_password_hash
            },
            "$unset": {
                "password_reset_token": "",
                "password_reset_expires": ""
            }
        }
    )

    return {
        "message": "Password reset successful"
    }