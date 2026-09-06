from datetime import datetime, timezone
from pathlib import Path
import uuid

from bson import ObjectId

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from fastapi.responses import FileResponse

from app.config import settings
from app.database import get_database
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"],
)


# ============================================================
# PAYMENT SCREENSHOT SETTINGS
# ============================================================

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024


# ============================================================
# PAYMENT PROOF DIRECTORY
# ============================================================

def get_payment_proof_directory() -> Path:
    """
    Returns:

    D:\\digital-store\\backend\\storage\\payment_proofs
    """

    backend_directory = (
        Path(__file__).resolve().parents[2]
    )

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


# ============================================================
# PAYMENT QR PATH
# ============================================================

def get_payment_qr_path() -> Path:
    """
    Resolves PAYMENT_QR_PATH from .env.

    Example:

    PAYMENT_QR_PATH=payment_qr.png

    becomes:

    D:\\digital-store\\backend\\payment_qr.png
    """

    backend_directory = (
        Path(__file__).resolve().parents[2]
    )

    configured_path = Path(
        settings.PAYMENT_QR_PATH
    )

    # Absolute path
    if configured_path.is_absolute():
        qr_path = configured_path

    # Relative path
    else:
        qr_path = (
            backend_directory
            / configured_path
        )

    return qr_path.resolve()


# ============================================================
# PAYMENT DETAILS
# ============================================================

@router.get("/details")
def get_payment_details():
    """
    Returns UPI payment details used by Checkout.
    """

    return {
        "upi_id": settings.PAYMENT_UPI_ID,
        "account_name": settings.PAYMENT_ACCOUNT_NAME,
    }


# ============================================================
# PAYMENT QR
# ============================================================

@router.get("/qr")
def get_payment_qr():
    """
    Returns the CURRENT payment QR image.

    Important:
    - No browser caching
    - No duplicate code
    - Reads the configured QR file every request
    """

    qr_path = get_payment_qr_path()

    print("========================================")
    print("PAYMENT QR REQUEST")
    print("Configured QR :", settings.PAYMENT_QR_PATH)
    print("Resolved QR   :", qr_path)
    print("QR EXISTS     :", qr_path.exists())

    if qr_path.exists():
        print(
            "QR SIZE       :",
            qr_path.stat().st_size
        )
    else:
        print("QR SIZE       : N/A")

    print("========================================")

    # ========================================================
    # CHECK FILE EXISTS
    # ========================================================

    if not qr_path.exists():
        raise HTTPException(
            status_code=404,
            detail=(
                "Payment QR image was not found. "
                f"Expected file: {qr_path}"
            ),
        )

    # ========================================================
    # CHECK FILE
    # ========================================================

    if not qr_path.is_file():
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment QR path is not a file: "
                f"{qr_path}"
            ),
        )

    # ========================================================
    # DETECT IMAGE TYPE
    # ========================================================

    media_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
    }

    media_type = media_types.get(
        qr_path.suffix.lower(),
        "application/octet-stream",
    )

    # ========================================================
    # RETURN CURRENT QR
    # ========================================================

    return FileResponse(
        path=str(qr_path),
        media_type=media_type,
        headers={
            "Cache-Control": (
                "no-store, "
                "no-cache, "
                "must-revalidate, "
                "max-age=0"
            ),
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


# ============================================================
# SUBMIT PAYMENT PROOF
# ============================================================

@router.post("/submit-proof/{order_id}")
async def submit_payment_proof(
    order_id: str,
    payment_reference: str = Form(...),
    screenshot: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    db = get_database()

    # ========================================================
    # VALIDATE ORDER ID
    # ========================================================

    try:
        order_object_id = ObjectId(order_id)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid order ID.",
        )

    # ========================================================
    # FIND ORDER
    # ========================================================

    try:
        user_object_id = ObjectId(
            current_user["id"]
        )
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID.",
        )

    order = db.orders.find_one(
        {
            "_id": order_object_id,
            "user_id": user_object_id,
        }
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    # ========================================================
    # PREVENT PAYMENT PROOF ON ALREADY APPROVED ORDER
    # ========================================================

    if (
        order.get("payment_status") == "paid"
        and order.get("verification_status") == "verified"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This order has already been paid "
                "and verified."
            ),
        )

    # ========================================================
    # PAYMENT REFERENCE / UTR
    # ========================================================

    payment_reference = (
        payment_reference.strip()
    )

    if len(payment_reference) < 4:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid payment reference / UTR."
            ),
        )

    if len(payment_reference) > 100:
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment reference is too long."
            ),
        )

    # ========================================================
    # FILE TYPE VALIDATION
    # ========================================================

    if (
        screenshot.content_type
        not in ALLOWED_IMAGE_TYPES
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, PNG and WEBP "
                "payment screenshots are allowed."
            ),
        )

    # ========================================================
    # READ FILE
    # ========================================================

    file_bytes = await screenshot.read()

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Uploaded payment screenshot "
                "is empty."
            ),
        )

    # ========================================================
    # FILE SIZE
    # ========================================================

    if len(file_bytes) > MAX_SCREENSHOT_SIZE:
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment screenshot must be "
                "smaller than 5 MB."
            ),
        )

    # ========================================================
    # STORAGE DIRECTORY
    # ========================================================

    payment_proof_dir = (
        get_payment_proof_directory()
    )

    # ========================================================
    # FILE EXTENSION
    # ========================================================

    extension_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    extension = extension_map.get(
        screenshot.content_type,
        ".jpg",
    )

    # ========================================================
    # SECURE RANDOM FILE NAME
    # ========================================================

    filename = (
        f"{order_id}_"
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )

    file_path = (
        payment_proof_dir
        / filename
    ).resolve()

    # ========================================================
    # SECURITY CHECK
    # ========================================================

    if (
        payment_proof_dir
        not in file_path.parents
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid payment screenshot path.",
        )

    # ========================================================
    # SAVE FILE
    # ========================================================

    try:

        with open(
            file_path,
            "wb",
        ) as file:

            file.write(file_bytes)

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

    # ========================================================
    # UPDATE ORDER
    # ========================================================

    now = datetime.now(
        timezone.utc
    )

    update_result = db.orders.update_one(
        {
            "_id": order_object_id,
            "user_id": user_object_id,
        },
        {
            "$set": {

                "payment_reference":
                    payment_reference,

                "payment_screenshot":
                    str(file_path),

                "status":
                    "payment_submitted",

                "payment_status":
                    "payment_submitted",

                "verification_status":
                    "pending",

                "download_access":
                    False,

                "updated_at":
                    now,
            }
        },
    )

    if update_result.matched_count == 0:

        # Remove uploaded file if order
        # update unexpectedly failed.

        try:
            file_path.unlink(
                missing_ok=True
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    # ========================================================
    # GET UPDATED ORDER
    # ========================================================

    updated_order = db.orders.find_one(
        {
            "_id": order_object_id,
            "user_id": user_object_id,
        }
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "message": (
            "Payment proof submitted "
            "successfully. Your order is "
            "waiting for verification."
        ),

        "order": {

            "id": str(
                updated_order["_id"]
            ),

            "order_number":
                updated_order.get(
                    "order_number"
                ),

            "payment_reference":
                updated_order.get(
                    "payment_reference"
                ),

            "payment_status":
                updated_order.get(
                    "payment_status"
                ),

            "verification_status":
                updated_order.get(
                    "verification_status"
                ),

            "download_access":
                updated_order.get(
                    "download_access",
                    False,
                ),
        },
    }