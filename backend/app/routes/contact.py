from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.database import get_database
from app.utils.dependencies import get_current_admin


router = APIRouter(
    prefix="/api/contact",
    tags=["Contact"]
)


class ContactMessageCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(default="", max_length=20)
    subject: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=5, max_length=2000)


class ContactStatusUpdate(BaseModel):
    status: str


def serialize_contact_message(message):
    return {
        "id": str(message["_id"]),
        "name": message.get("name", ""),
        "email": message.get("email", ""),
        "phone": message.get("phone", ""),
        "subject": message.get("subject", ""),
        "message": message.get("message", ""),
        "status": message.get("status", "new"),
        "created_at": (
            message["created_at"].isoformat()
            if isinstance(message.get("created_at"), datetime)
            else str(message.get("created_at", ""))
        ),
        "updated_at": (
            message["updated_at"].isoformat()
            if isinstance(message.get("updated_at"), datetime)
            else str(message.get("updated_at", ""))
        ),
    }


# CUSTOMER CONTACT FORM

@router.post("/")
def create_contact_message(data: ContactMessageCreate):
    db = get_database()

    name = data.name.strip()
    email = str(data.email).lower().strip()
    phone = data.phone.strip()
    subject = data.subject.strip()
    message = data.message.strip()

    if len(name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Name must contain at least 2 characters."
        )

    if len(subject) < 2:
        raise HTTPException(
            status_code=400,
            detail="Subject is required."
        )

    if len(message) < 5:
        raise HTTPException(
            status_code=400,
            detail="Message must contain at least 5 characters."
        )

    now = datetime.now(timezone.utc)

    contact_message = {
        "name": name,
        "email": email,
        "phone": phone,
        "subject": subject,
        "message": message,
        "status": "new",
        "created_at": now,
        "updated_at": now,
    }

    result = db.contact_messages.insert_one(contact_message)

    return {
        "message": "Thank you! Your message has been sent successfully.",
        "id": str(result.inserted_id),
    }


# ADMIN - GET ALL MESSAGES

@router.get("/admin")
def get_contact_messages(
    current_admin=Depends(get_current_admin)
):
    db = get_database()

    messages = (
        db.contact_messages
        .find({})
        .sort("created_at", -1)
    )

    return {
        "messages": [
            serialize_contact_message(message)
            for message in messages
        ]
    }


# ADMIN - GET SINGLE MESSAGE

@router.get("/admin/{message_id}")
def get_contact_message(
    message_id: str,
    current_admin=Depends(get_current_admin)
):
    db = get_database()

    try:
        object_id = ObjectId(message_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid message ID."
        )

    message = db.contact_messages.find_one({
        "_id": object_id
    })

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Contact message not found."
        )

    return serialize_contact_message(message)


# ADMIN - UPDATE STATUS

@router.put("/admin/{message_id}/status")
def update_contact_status(
    message_id: str,
    data: ContactStatusUpdate,
    current_admin=Depends(get_current_admin)
):
    allowed_statuses = {
        "new",
        "read",
        "replied",
        "closed",
    }

    status = data.status.strip().lower()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid message status."
        )

    db = get_database()

    try:
        object_id = ObjectId(message_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid message ID."
        )

    result = db.contact_messages.update_one(
        {"_id": object_id},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc),
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Contact message not found."
        )

    return {
        "message": "Message status updated successfully.",
        "status": status,
    }


# ADMIN - DELETE MESSAGE

@router.delete("/admin/{message_id}")
def delete_contact_message(
    message_id: str,
    current_admin=Depends(get_current_admin)
):
    db = get_database()

    try:
        object_id = ObjectId(message_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid message ID."
        )

    result = db.contact_messages.delete_one({
        "_id": object_id
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Contact message not found."
        )

    return {
        "message": "Contact message deleted successfully."
    }