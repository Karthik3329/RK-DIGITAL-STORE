from pathlib import Path

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.config import settings
from app.database import get_database
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/downloads",
    tags=["Downloads"]
)


def get_storage_directory() -> Path:
    """
    Resolve the secure digital product storage directory.
    """

    backend_directory = Path(__file__).resolve().parents[2]

    storage_directory = (
        backend_directory /
        settings.DIGITAL_FILES_DIR
    ).resolve()

    storage_directory.mkdir(
        parents=True,
        exist_ok=True
    )

    return storage_directory


@router.get("/{order_id}/{product_id}")
def download_product(
    order_id: str,
    product_id: str,
    current_user=Depends(get_current_user)
):
    db = get_database()

    # -----------------------------------------
    # Validate order ID
    # -----------------------------------------

    try:
        order_object_id = ObjectId(order_id)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid order ID."
        )


    # -----------------------------------------
    # Validate product ID
    # -----------------------------------------

    try:
        product_object_id = ObjectId(product_id)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid product ID."
        )


    # -----------------------------------------
    # Find user's order
    # -----------------------------------------

    order = db.orders.find_one({
        "_id": order_object_id,
        "user_id": ObjectId(
            current_user["id"]
        )
    })


    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found."
        )


    # -----------------------------------------
    # Check payment
    # -----------------------------------------

    if order.get("payment_status") != "paid":
        raise HTTPException(
            status_code=403,
            detail="Payment has not been completed."
        )


    # -----------------------------------------
    # Check admin verification
    # -----------------------------------------

    if order.get("verification_status") != "verified":
        raise HTTPException(
            status_code=403,
            detail="Order has not been verified yet."
        )


    # -----------------------------------------
    # Check download permission
    # -----------------------------------------

    if order.get("download_access") is not True:
        raise HTTPException(
            status_code=403,
            detail="Download access is not available."
        )


    # -----------------------------------------
    # Check purchased product
    # -----------------------------------------

    purchased_item = None

    for item in order.get("items", []):

        if item.get("product_id") == str(
            product_object_id
        ):
            purchased_item = item
            break


    if not purchased_item:
        raise HTTPException(
            status_code=403,
            detail="This product was not purchased in this order."
        )


    # -----------------------------------------
    # Get product
    # -----------------------------------------

    product = db.products.find_one({
        "_id": product_object_id
    })


    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )


    # -----------------------------------------
    # Get stored file name
    # -----------------------------------------

    file_name = (
        product.get("file_name")
        or purchased_item.get("file_name")
    )


    if not file_name:
        raise HTTPException(
            status_code=404,
            detail="Digital file is not available."
        )


    # -----------------------------------------
    # SECURITY
    #
    # Never allow a path outside our
    # digital product directory.
    # -----------------------------------------

    storage_directory = get_storage_directory()

    requested_file = (
        storage_directory /
        Path(file_name).name
    ).resolve()


    try:
        requested_file.relative_to(
            storage_directory
        )

    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Invalid digital file path."
        )


    # -----------------------------------------
    # Check file exists
    # -----------------------------------------

    if not requested_file.is_file():
        raise HTTPException(
            status_code=404,
            detail="Digital file could not be found."
        )


    # -----------------------------------------
    # Return protected file
    # -----------------------------------------

    return FileResponse(
        path=str(requested_file),
        filename=requested_file.name,
        media_type="application/octet-stream"
    )