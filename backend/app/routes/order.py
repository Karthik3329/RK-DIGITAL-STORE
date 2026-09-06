import re
import secrets
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.database import get_database
from app.schemas.order_schema import OrderCreate
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"]
)


# =========================================================
# HELPERS
# =========================================================

def serialize_datetime(value):
    if not value:
        return None

    if isinstance(value, datetime):
        return value.isoformat()

    return str(value)


def serialize_order(order):
    """
    Convert MongoDB order document into JSON-safe response.
    """

    items = []

    for item in order.get("items", []):
        items.append({
            "product_id": str(
                item.get("product_id", "")
            ),
            "title": item.get("title", ""),
            "slug": item.get("slug", ""),
            "price": float(
                item.get("price", 0)
            ),
            "quantity": int(
                item.get("quantity", 1)
            ),
            "image": item.get("image"),
            "product_public_id": item.get(
                "product_public_id"
            ),
        })

    return {
        "id": str(order["_id"]),

        "order_number": order.get(
            "order_number",
            ""
        ),

        "user_id": str(
            order.get("user_id", "")
        ),

        "items": items,

        "customer": order.get(
            "customer",
            {}
        ),

        "subtotal": float(
            order.get("subtotal", 0)
        ),

        "discount": float(
            order.get("discount", 0)
        ),

        "total": float(
            order.get("total", 0)
        ),

        "coupon_code": order.get(
            "coupon_code"
        ),

        "coupon_id": (
            str(order["coupon_id"])
            if order.get("coupon_id")
            else None
        ),

        "status": order.get(
            "status",
            "pending_payment"
        ),

        "payment_status": order.get(
            "payment_status",
            "unpaid"
        ),

        "verification_status": order.get(
            "verification_status",
            "pending"
        ),

        "download_access": bool(
            order.get(
                "download_access",
                False
            )
        ),

        "payment_reference": order.get(
            "payment_reference"
        ),

        # Never send the actual private
        # screenshot filesystem path.
        "payment_screenshot": bool(
            order.get("payment_screenshot")
        ),

        "rejection_reason": order.get(
            "rejection_reason"
        ),

        "verified_by": (
            str(order["verified_by"])
            if order.get("verified_by")
            else None
        ),

        "verified_at": serialize_datetime(
            order.get("verified_at")
        ),

        "created_at": serialize_datetime(
            order.get("created_at")
        ),

        "updated_at": serialize_datetime(
            order.get("updated_at")
        ),
    }


def generate_order_number():
    """
    Example:
    ORD-20260906-A2012B
    """

    date_part = datetime.now(
        timezone.utc
    ).strftime("%Y%m%d")

    random_part = secrets.token_hex(
        3
    ).upper()

    return (
        f"ORD-{date_part}-"
        f"{random_part}"
    )


def normalize_coupon_code(code):
    if not code:
        return None

    return code.strip().upper()


def get_coupon(db, code):
    if not code:
        return None

    return db.coupons.find_one({
        "code": normalize_coupon_code(code)
    })


def parse_coupon_expiry(value):
    if not value:
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        try:
            return datetime.fromisoformat(
                value.replace("Z", "+00:00")
            )
        except ValueError:
            return None

    return None


def calculate_coupon_discount(
    coupon,
    subtotal
):
    """
    Supports:
    percentage
    fixed
    """

    if not coupon:
        return 0.0

    discount_type = coupon.get(
        "discount_type",
        "percentage"
    )

    discount_value = float(
        coupon.get("discount_value", 0)
    )

    minimum_order = float(
        coupon.get("minimum_order", 0)
    )

    if subtotal < minimum_order:
        return 0.0

    if discount_type == "percentage":

        discount = (
            subtotal *
            discount_value /
            100
        )

        max_discount = coupon.get(
            "max_discount"
        )

        if max_discount is not None:
            discount = min(
                discount,
                float(max_discount)
            )

    elif discount_type == "fixed":

        discount = discount_value

    else:
        discount = 0.0

    return round(
        min(discount, subtotal),
        2
    )


def validate_coupon(
    db,
    coupon_code,
    subtotal
):
    """
    Validate coupon without increasing
    used_count.

    Coupon usage is increased only
    after admin approves payment.
    """

    if not coupon_code:
        return None, 0.0

    code = normalize_coupon_code(
        coupon_code
    )

    coupon = get_coupon(
        db,
        code
    )

    if not coupon:
        raise HTTPException(
            status_code=400,
            detail="Invalid coupon code."
        )

    if not coupon.get(
        "active",
        True
    ):
        raise HTTPException(
            status_code=400,
            detail="This coupon is inactive."
        )

    expiry = parse_coupon_expiry(
        coupon.get("expires_at")
    )

    if expiry:

        if expiry.tzinfo is None:
            expiry = expiry.replace(
                tzinfo=timezone.utc
            )

        if datetime.now(
            timezone.utc
        ) > expiry:
            raise HTTPException(
                status_code=400,
                detail="This coupon has expired."
            )

    usage_limit = coupon.get(
        "usage_limit"
    )

    used_count = int(
        coupon.get(
            "used_count",
            0
        )
    )

    if (
        usage_limit is not None
        and used_count >= int(
            usage_limit
        )
    ):
        raise HTTPException(
            status_code=400,
            detail="This coupon has reached its usage limit."
        )

    minimum_order = float(
        coupon.get(
            "minimum_order",
            0
        )
    )

    if subtotal < minimum_order:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Minimum order value for "
                f"this coupon is ₹{minimum_order:.2f}."
            )
        )

    discount = calculate_coupon_discount(
        coupon,
        subtotal
    )

    if discount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Coupon cannot be applied to this order."
        )

    return coupon, discount


# =========================================================
# CREATE ORDER
# =========================================================

@router.post("/")
def create_order(
    order_data: OrderCreate,
    current_user=Depends(get_current_user)
):
    db = get_database()

    user_id = ObjectId(
        current_user["id"]
    )

    calculated_items = []

    subtotal = 0.0

    # -----------------------------------------------------
    # VALIDATE PRODUCTS AND CALCULATE PRICE
    # -----------------------------------------------------

    for requested_item in order_data.items:

        try:
            product_object_id = ObjectId(
                requested_item.product_id
            )
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid product ID: "
                    f"{requested_item.product_id}"
                )
            )

        product = db.products.find_one({
            "_id": product_object_id,
            "status": "active"
        })

        if not product:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Product not found or inactive: "
                    f"{requested_item.product_id}"
                )
            )

        price = float(
            product.get(
                "price",
                0
            )
        )

        quantity = int(
            requested_item.quantity
        )

        item_total = (
            price * quantity
        )

        subtotal += item_total

        calculated_items.append({
            "product_id": product["_id"],
            "product_public_id": product.get(
                "product_id"
            ),
            "title": product.get(
                "title",
                ""
            ),
            "slug": product.get(
                "slug",
                ""
            ),
            "price": price,
            "quantity": quantity,
            "image": product.get(
                "image"
            ),
        })

    subtotal = round(
        subtotal,
        2
    )

    # -----------------------------------------------------
    # COUPON
    # -----------------------------------------------------

    coupon = None
    discount = 0.0
    coupon_code = normalize_coupon_code(
        order_data.coupon_code
    )

    if coupon_code:

        coupon, discount = validate_coupon(
            db,
            coupon_code,
            subtotal
        )

    total = round(
        max(subtotal - discount, 0),
        2
    )

    now = datetime.now(
        timezone.utc
    )

    order = {
        "order_number": generate_order_number(),

        "user_id": user_id,

        "items": calculated_items,

        "customer": {
            "name": order_data.customer.name,
            "email": str(
                order_data.customer.email
            ),
            "phone": order_data.customer.phone,
        },

        "subtotal": subtotal,

        "discount": discount,

        "total": total,

        "coupon_code": (
            coupon_code
            if coupon
            else None
        ),

        "coupon_id": (
            coupon["_id"]
            if coupon
            else None
        ),

        # -------------------------------------------------
        # PAYMENT STATE
        # -------------------------------------------------

        "status": "pending_payment",

        "payment_status": "unpaid",

        "verification_status": "pending",

        "download_access": False,

        # -------------------------------------------------
        # MANUAL PAYMENT DATA
        # -------------------------------------------------

        "payment_reference": None,

        "payment_screenshot": None,

        "verified_by": None,

        "verified_at": None,

        "rejection_reason": None,

        "created_at": now,

        "updated_at": now,
    }

    result = db.orders.insert_one(
        order
    )

    order["_id"] = result.inserted_id

    return serialize_order(
        order
    )


# =========================================================
# CUSTOMER ORDERS
# IMPORTANT:
# THIS MUST COME BEFORE /{order_id}
# =========================================================

@router.get("/my-orders")
def get_my_orders(
    current_user=Depends(get_current_user)
):
    db = get_database()

    user_id = ObjectId(
        current_user["id"]
    )

    orders = list(
        db.orders.find({
            "user_id": user_id
        }).sort(
            "created_at",
            -1
        )
    )

    return [
        serialize_order(order)
        for order in orders
    ]


# =========================================================
# SECURE DOWNLOAD
# IMPORTANT:
# THIS MUST COME BEFORE /{order_id}
# =========================================================

@router.get("/{order_id}/download")
def download_order_files(
    order_id: str,
    current_user=Depends(get_current_user)
):
    db = get_database()

    # -----------------------------------------------------
    # VALIDATE ORDER ID
    # -----------------------------------------------------

    try:
        order_object_id = ObjectId(
            order_id
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid order ID."
        )

    # -----------------------------------------------------
    # FIND CUSTOMER'S ORDER
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # CHECK PAYMENT
    # -----------------------------------------------------

    if order.get(
        "payment_status"
    ) != "paid":

        raise HTTPException(
            status_code=403,
            detail=(
                "Payment has not been approved."
            )
        )

    if not order.get(
        "download_access",
        False
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "Download access is not enabled."
            )
        )

    # -----------------------------------------------------
    # CURRENT VERSION:
    # DOWNLOAD FIRST DIGITAL PRODUCT
    # -----------------------------------------------------

    items = order.get(
        "items",
        []
    )

    if not items:
        raise HTTPException(
            status_code=404,
            detail="No products found in this order."
        )

    product_id = items[0].get(
        "product_id"
    )

    if not product_id:
        raise HTTPException(
            status_code=404,
            detail="Product information is missing."
        )

    # -----------------------------------------------------
    # FIND PRODUCT
    # -----------------------------------------------------

    try:
        product_object_id = (
            product_id
            if isinstance(
                product_id,
                ObjectId
            )
            else ObjectId(
                str(product_id)
            )
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid product ID."
        )

    product = db.products.find_one({
        "_id": product_object_id
    })

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    file_path_value = product.get(
        "file_path"
    )

    if not file_path_value:
        raise HTTPException(
            status_code=404,
            detail=(
                "Digital product file is not available."
            )
        )

    # -----------------------------------------------------
    # SECURE FILE PATH
    # -----------------------------------------------------

    backend_root = Path(
        __file__
    ).resolve().parents[2]

    products_storage = (
        backend_root /
        "storage" /
        "products"
    ).resolve()

    requested_file = Path(
        file_path_value
    )

    if not requested_file.is_absolute():
        requested_file = (
            backend_root /
            requested_file
        )

    requested_file = (
        requested_file
        .resolve()
    )

    # Prevent ../ path traversal
    try:
        requested_file.relative_to(
            products_storage
        )
    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Invalid file path."
        )

    if not requested_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Digital product file not found."
        )

    if not requested_file.is_file():
        raise HTTPException(
            status_code=404,
            detail="Digital product file is invalid."
        )

    # -----------------------------------------------------
    # DOWNLOAD
    # -----------------------------------------------------

    return FileResponse(
        path=str(
            requested_file
        ),
        filename=product.get(
            "file_name"
        ) or requested_file.name,
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


# =========================================================
# GET SINGLE ORDER
#
# IMPORTANT:
# KEEP THIS LAST
# =========================================================

@router.get("/{order_id}")
def get_order_by_id(
    order_id: str,
    current_user=Depends(get_current_user)
):
    db = get_database()

    try:
        order_object_id = ObjectId(
            order_id
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid order ID."
        )

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

    return serialize_order(
        order
    )