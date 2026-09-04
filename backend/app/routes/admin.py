from fastapi import APIRouter, Depends

from app.utils.dependencies import get_current_admin


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


@router.get("/dashboard")
def admin_dashboard(
    current_admin=Depends(get_current_admin)
):

    return {
        "message": "Welcome to the admin dashboard!",
        "admin": {
            "id": current_admin["id"],
            "name": current_admin["name"],
            "email": current_admin["email"],
            "role": current_admin["role"]
        }
    }