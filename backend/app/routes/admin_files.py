
from datetime import datetime, timezone
from pathlib import Path
import secrets

from bson import ObjectId
from fastapi import (
    APIRouter, Depends, File,
    HTTPException, UploadFile
)

from app.database import get_database
from app.utils.dependencies import get_current_admin

router = APIRouter(
    prefix="/api/admin/files",
    tags=["Admin Files"],
    dependencies=[Depends(get_current_admin)]
)

ROOT = Path(__file__).resolve().parents[2]
STORAGE = (ROOT / "storage" / "products").resolve()
STORAGE.mkdir(parents=True, exist_ok=True)

ALLOWED = {
    ".pdf", ".zip", ".png", ".jpg",
    ".jpeg", ".webp", ".mp3", ".mp4"
}

MAX_SIZE = 100 * 1024 * 1024


@router.post("/{product_id}")
async def upload_product_file(
    product_id: str,
    file: UploadFile = File(...)
):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Invalid product ID")

    db = get_database()
    oid = ObjectId(product_id)

    product = db.products.find_one({"_id": oid})

    if not product:
        raise HTTPException(404, "Product not found")

    original_name = Path(
        (file.filename or "").replace("\\", "/")
    ).name

    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED:
        raise HTTPException(400, "Unsupported file type")

    stored_name = secrets.token_hex(24) + extension
    destination = STORAGE / stored_name

    size = 0

    try:
        with destination.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)

                if size > MAX_SIZE:
                    raise HTTPException(
                        413, "File exceeds 100 MB"
                    )

                output.write(chunk)

        db.products.update_one(
            {"_id": oid},
            {
                "$set": {
                    "file_name": original_name,
                    "file_path": (
                        f"storage/products/{stored_name}"
                    ),
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

    except Exception:
        destination.unlink(missing_ok=True)
        raise

    finally:
        await file.close()

    return {
        "message": "File uploaded successfully",
        "file_name": original_name,
        "size": size
    }
