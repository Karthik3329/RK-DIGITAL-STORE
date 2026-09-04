from datetime import datetime, timezone
from pathlib import Path
import secrets

from bson import ObjectId
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse

from app.config import settings
from app.database import get_database
from app.schemas.order_schema import PaymentProofSubmit
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"],
)


# =========================================================
# PAYMENT CONFIGURATION
# =========================================================

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024


# =========================================================
# PAYMENT PROOF DIRECTORY
# =========================================================

def get_payment_proof_directory() -> Path:
    """
    Returns:

    D:\digital-store\backend\storage\payment_proofs
    """

    backend_directory = Path(
        __file__
    ).resolve().parents[2]

    directory = (
        backend_directory
        / "storage"
        / "payment_proofs"
    ).resolve()

    directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    return directory


# =========================================================
# PAYMENT DETAILS
# =========================================================

@router.get("/details")
def get_payment_details(
    current_user=Depends(get_current_user),
):
    """
    Returns the UPI payment information
    required by the checkout page.
    """

    return {
        "upi_id": settings.PAYMENT_UPI_ID,
        "account_name": settings.PAYMENT_ACCOUNT_NAME,
    }


# =========================================================
# PAYMENT QR CODE
# =========================================================

@router.get("/qr")
def get_payment_qr():
    """
    Serves the store's UPI QR code.
    """

    backend_directory = Path(
        __file__
    ).resolve().parents[2]

    qr_path = (
        backend_directory
        / settings.PAYMENT_QR_PATH
    ).resolve()

    if not qr_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Payment QR code not found.",
        )

    if not qr_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Payment QR code is not a valid file.",
        )

    return FileResponse(
        path=str(qr_path),
        media_type="image/png",
        filename="payment_qr.png",
    )


# =========================================================
# SUBMIT PAYMENT PROOF
# =========================================================

@router.post("/submit-proof/{order_id}")
async def submit_payment_proof(
    order_id: str,
    payment: PaymentProofSubmit,
    screenshot: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    db = get_database()

    # -----------------------------------------------------
    # Validate order ID
    # -----------------------------------------------------

    try:
        order_object_id = ObjectId(order_id)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid order ID.",
        )

    # -----------------------------------------------------
    # Find user's order
    # -----------------------------------------------------

    order = db.orders.find_one(
        {
            "_id": order_object_id,
            "user_id": ObjectId(
                current_user["id"]
            ),
        }
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    # -----------------------------------------------------
    # Prevent duplicate submission
    # -----------------------------------------------------

    if (
        order.get("verification_status")
        == "verified"
    ):
        raise HTTPException(
            status_code=400,
            detail="This order is already verified.",
        )

    if (
        order.get("payment_status")
        == "payment_submitted"
    ):
        raise HTTPException(
            status_code=400,
            detail="Payment proof has already been submitted.",
        )

    # -----------------------------------------------------
    # Validate payment reference
    # -----------------------------------------------------

    payment_reference = (
        payment.payment_reference.strip()
    )

    if len(payment_reference) < 4:
        raise HTTPException(
            status_code=400,
            detail="Enter a valid payment reference number.",
        )

    # -----------------------------------------------------
    # Validate screenshot type
    # -----------------------------------------------------

    if screenshot.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, PNG, and WEBP "
                "screenshots are allowed."
            ),
        )

    # -----------------------------------------------------
    # Read screenshot
    # -----------------------------------------------------

    file_content = await screenshot.read()

    if len(file_content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Screenshot is empty.",
        )

    if len(file_content) > MAX_SCREENSHOT_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Screenshot must be smaller than 5 MB.",
        )

    # -----------------------------------------------------
    # Determine extension
    # -----------------------------------------------------

    extension_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    extension = extension_map[
        screenshot.content_type
    ]

    # -----------------------------------------------------
    # Generate secure filename
    # -----------------------------------------------------

    random_name = secrets.token_hex(16)

    secure_filename = (
        f"{order['order_number']}_"
        f"{random_name}"
        f"{extension}"
    )

    # -----------------------------------------------------
    # Save screenshot
    # -----------------------------------------------------

    payment_directory = (
        get_payment_proof_directory()
    )

    file_path = (
        payment_directory
        / secure_filename
    )

    try:
        with open(
            file_path,
            "wb",
        ) as file:
            file.write(file_content)

    except Exception as error:
        print(
            "Payment screenshot save error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to save payment screenshot."
            ),
        )

    # -----------------------------------------------------
    # Update order
    # -----------------------------------------------------

    now = datetime.now(timezone.utc)

    db.orders.update_one(
        {
            "_id": order_object_id,
        },
        {
            "$set": {
                "payment_status": "payment_submitted",

                "verification_status": "pending",

                "payment_reference":
                    payment_reference,

                "payment_screenshot":
                    secure_filename,

                "download_access": False,

                "updated_at": now,
            }
        },
    )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "message": (
            "Payment proof submitted successfully."
        ),
        "order_number":
            order.get("order_number"),

        "payment_status":
            "payment_submitted",

        "verification_status":
            "pending",

        "download_access":
            False,
    }