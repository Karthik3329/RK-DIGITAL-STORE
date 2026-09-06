from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.database import get_database
from app.utils.download_tokens import hash_download_token


router = APIRouter(
    prefix="/api/downloads",
    tags=["Downloads"]
)


@router.get("/{token}")
def download_file(token: str):
    db = get_database()

    # ---------------------------------------------------------
    # 1. Find token
    # ---------------------------------------------------------

    token_hash = hash_download_token(token)

    token_doc = db.download_tokens.find_one({
        "token_hash": token_hash
    })

    if not token_doc:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired download link."
        )

    # ---------------------------------------------------------
    # 2. Check token expiry
    # ---------------------------------------------------------

    now = datetime.now(timezone.utc)

    expires_at = token_doc.get("expires_at")

    if not expires_at:
        raise HTTPException(
            status_code=403,
            detail="Download token has no expiry."
        )

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    if now >= expires_at:

        db.download_tokens.delete_one({
            "_id": token_doc["_id"]
        })

        raise HTTPException(
            status_code=410,
            detail="Download link has expired."
        )

    # ---------------------------------------------------------
    # 3. Find order
    # ---------------------------------------------------------

    order_id = token_doc.get("order_id")

    if not order_id:
        raise HTTPException(
            status_code=403,
            detail="Invalid download token."
        )

    if isinstance(order_id, str):
        try:
            order_id = ObjectId(order_id)
        except Exception:
            raise HTTPException(
                status_code=403,
                detail="Invalid order reference."
            )

    order = db.orders.find_one({
        "_id": order_id
    })

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found."
        )

    # ---------------------------------------------------------
    # 4. Check payment
    # ---------------------------------------------------------

    if order.get("payment_status") != "paid":
        raise HTTPException(
            status_code=403,
            detail="Payment has not been verified."
        )

    if not order.get("download_access"):
        raise HTTPException(
            status_code=403,
            detail="Download access is not available."
        )

    # ---------------------------------------------------------
    # 5. Find product
    # ---------------------------------------------------------

    product_id = token_doc.get("product_id")

    if not product_id:
        raise HTTPException(
            status_code=404,
            detail="Product reference not found."
        )

    if isinstance(product_id, str):
        try:
            product_id = ObjectId(product_id)
        except Exception:
            raise HTTPException(
                status_code=404,
                detail="Invalid product reference."
            )

    product = db.products.find_one({
        "_id": product_id
    })

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    # ---------------------------------------------------------
    # 6. Verify product belongs to this order
    # ---------------------------------------------------------

    product_is_in_order = False

    for item in order.get("items", []):

        item_product_id = item.get("product_id")

        if isinstance(item_product_id, ObjectId):
            if item_product_id == product_id:
                product_is_in_order = True
                break

        elif str(item_product_id) == str(product_id):
            product_is_in_order = True
            break

    if not product_is_in_order:
        raise HTTPException(
            status_code=403,
            detail="This product is not part of this order."
        )

    # ---------------------------------------------------------
    # 7. Get file information
    # ---------------------------------------------------------

    stored_file_path = product.get("file_path")
    file_name = product.get("file_name")

    print("========================================")
    print("DOWNLOAD DEBUG")
    print("Product:", product.get("title"))
    print("Stored file_path:", stored_file_path)
    print("Stored file_name:", file_name)
    print("========================================")

    if not stored_file_path and not file_name:
        raise HTTPException(
            status_code=404,
            detail="Digital file not configured for this product."
        )

    # ---------------------------------------------------------
    # 8. Determine backend root
    # ---------------------------------------------------------

    # __file__:
    # backend/app/routes/downloads.py
    #
    # parents[0] = routes
    # parents[1] = app
    # parents[2] = backend

    backend_root = Path(__file__).resolve().parents[2]

    products_root = (
        backend_root / "storage" / "products"
    ).resolve()

    # ---------------------------------------------------------
    # 9. Resolve the file safely
    # ---------------------------------------------------------

    file_path = None

    if stored_file_path:

        stored_path = Path(str(stored_file_path))

        # Absolute path
        if stored_path.is_absolute():

            candidate = stored_path.resolve()

        else:

            # Handle:
            # storage/products/file.zip
            # products/file.zip
            # file.zip

            normalized = str(
                stored_path
            ).replace("\\", "/").lstrip("/")

            if normalized.startswith("storage/products/"):

                candidate = (
                    backend_root / normalized
                ).resolve()

            elif normalized.startswith("products/"):

                candidate = (
                    backend_root
                    / "storage"
                    / normalized
                ).resolve()

            else:

                candidate = (
                    products_root
                    / normalized
                ).resolve()

        file_path = candidate

    elif file_name:

        file_path = (
            products_root
            / str(file_name)
        ).resolve()

    # ---------------------------------------------------------
    # 10. Security check
    # ---------------------------------------------------------

    try:

        file_path.relative_to(
            products_root
        )

    except ValueError:

        raise HTTPException(
            status_code=403,
            detail="Invalid digital file path."
        )

    # ---------------------------------------------------------
    # 11. Check physical file
    # ---------------------------------------------------------

    print("Resolved file:", file_path)
    print("File exists:", file_path.is_file())

    if not file_path.is_file():

        raise HTTPException(
            status_code=404,
            detail="Digital file not found."
        )

    # ---------------------------------------------------------
    # 12. Update download statistics
    # ---------------------------------------------------------

    db.download_tokens.update_one(
        {
            "_id": token_doc["_id"]
        },
        {
            "$inc": {
                "download_count": 1
            },
            "$set": {
                "last_downloaded_at": now
            }
        }
    )

    # ---------------------------------------------------------
    # 13. Send file
    # ---------------------------------------------------------

    return FileResponse(
        path=str(file_path),
        filename=file_name or file_path.name,
        media_type="application/octet-stream",
        headers={
            "Cache-Control": "no-store",
            "Pragma": "no-cache"
        }
    )