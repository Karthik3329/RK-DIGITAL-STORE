from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_database
from app.schemas.user_schema import UserProfileUpdate
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "role": user.get("role", "customer"),
    }


@router.get("/me")
def get_my_profile(
    current_user=Depends(get_current_user)
):
    return serialize_user(current_user)


@router.put("/me")
def update_my_profile(
    profile: UserProfileUpdate,
    current_user=Depends(get_current_user)
):
    db = get_database()

    user_id = ObjectId(
        current_user["id"]
    )

    name = profile.name.strip()
    phone = profile.phone.strip()

    if len(name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Name must contain at least 2 characters"
        )

    if len(phone) > 20:
        raise HTTPException(
            status_code=400,
            detail="Phone number is too long"
        )

    result = db.users.update_one(
        {
            "_id": user_id
        },
        {
            "$set": {
                "name": name,
                "phone": phone
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    updated_user = db.users.find_one(
        {
            "_id": user_id
        }
    )

    return {
        "message": "Profile updated successfully",
        "user": serialize_user(updated_user)
    }