from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional
import hashlib
import secrets

from bson import ObjectId
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.responses import FileResponse

from app.config import settings
from app.database import get_database
from app.utils.dependencies import get_current_admin


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


# =========================================================
# HELPERS
# =========================================================

def serialize_datetime(value):
    if isinstance(value, datetime):
        return value.isoformat()

    return str(value) if value else None


def serialize_product(product):
    return {
        "id": str(product["_id"]),
        "product_id": product.get("product_id", ""),
        "title": product.get("title", ""),
        "slug": product.get("slug", ""),
        "description": product.get("description", ""),
        "short_description": product.get(
            "short_description",
            ""
        ),
        "price": float(
            product.get("price", 0)
        ),
        "original_price": (
            float(product["original_price"])
            if product.get("original_price")
            is not None
            else None
        ),
        "image": product.get("image"),
        "file_name": product.get("file_name"),
        "file_path": product.get("file_path"),
        "product_type": product.get(
            "product_type",
            "digital"
        ),
        "tags": product.get(
            "tags",
            []
        ),
        "featured": product.get(
            "featured",
            False
        ),
        "status": product.get(
            "status",
            "active"
        ),
    }


def serialize_order(order):

    serialized_items = []

    for item in order.get("items", []):

        serialized_items.append({
            "product_id": (
                str(item["product_id"])
                if item.get("product_id")
                else None
            ),

            "product_public_id": item.get(
                "product_public_id"
            ),

            "title": item.get(
                "title",
                ""
            ),

            "slug": item.get(
                "slug",
                ""
            ),

            "price": float(
                item.get(
                    "price",
                    0
                )
            ),

            "quantity": int(
                item.get(
                    "quantity",
                    1
                )
            ),

            "image": item.get(
                "image"
            ),
        })

    return {
        "id": str(
            order["_id"]
        ),

        "order_number": order.get(
            "order_number",
            ""
        ),

        "user_id": (
            str(
                order["user_id"]
            )
            if order.get("user_id")
            else None
        ),

        "items": serialized_items,

        "customer": order.get(
            "customer",
            {}
        ),

        "subtotal": float(
            order.get(
                "subtotal",
                0
            )
        ),

        "discount": float(
            order.get(
                "discount",
                0
            )
        ),

        "total": float(
            order.get(
                "total",
                0
            )
        ),

        "coupon_code": order.get(
            "coupon_code"
        ),

        "coupon_id": (
            str(
                order["coupon_id"]
            )
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

        "payment_reference": order.get(
            "payment_reference"
        ),

        "payment_screenshot": bool(
            order.get(
                "payment_screenshot"
            )
        ),

        "download_access": bool(
            order.get(
                "download_access",
                False
            )
        ),

        "download_available": bool(
            order.get(
                "download_access",
                False
            )
        ),

        "rejection_reason": order.get(
            "rejection_reason"
        ),

        "verified_by": (
            str(
                order["verified_by"]
            )
            if order.get("verified_by")
            else None
        ),

        "verified_at":
            serialize_datetime(
                order.get(
                    "verified_at"
                )
            ),

        "created_at":
            serialize_datetime(
                order.get(
                    "created_at"
                )
            ),

        "updated_at":
            serialize_datetime(
                order.get(
                    "updated_at"
                )
            ),
    }


def serialize_coupon(coupon):
    return {
        "id": str(
            coupon["_id"]
        ),

        "code": coupon.get(
            "code",
            ""
        ),

        "discount_type": coupon.get(
            "discount_type",
            "percentage"
        ),

        "discount_value": float(
            coupon.get(
                "discount_value",
                0
            )
        ),

        "minimum_order": float(
            coupon.get(
                "minimum_order",
                0
            )
        ),

        "maximum_discount": (
            float(
                coupon["maximum_discount"]
            )
            if coupon.get(
                "maximum_discount"
            ) is not None
            else None
        ),

        "usage_limit": (
            int(
                coupon["usage_limit"]
            )
            if coupon.get(
                "usage_limit"
            ) is not None
            else None
        ),

        "used_count": int(
            coupon.get(
                "used_count",
                0
            )
        ),

        "expires_at": coupon.get(
            "expires_at"
        ),

        "active": bool(
            coupon.get(
                "active",
                True
            )
        ),
    }


def get_object_id(
    value,
    field_name="ID"
):
    try:
        return ObjectId(value)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name}."
        )


# =========================================================
# DASHBOARD
# =========================================================

@router.get("/dashboard")
def get_dashboard(
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    total_products = (
        db.products.count_documents({})
    )

    total_customers = (
        db.users.count_documents({
            "role": "customer"
        })
    )

    total_orders = (
        db.orders.count_documents({})
    )

    paid_orders = (
        db.orders.count_documents({
            "payment_status": "paid"
        })
    )

    pending_payments = (
        db.orders.count_documents({
            "payment_status":
                "payment_submitted",

            "verification_status":
                "pending",
        })
    )

    rejected_orders = (
        db.orders.count_documents({
            "payment_status":
                "rejected"
        })
    )

    revenue_result = list(
        db.orders.aggregate([
            {
                "$match": {
                    "payment_status":
                        "paid"
                }
            },

            {
                "$group": {
                    "_id": None,

                    "total": {
                        "$sum":
                            "$total"
                    },
                }
            }
        ])
    )

    total_revenue = (
        float(
            revenue_result[0]["total"]
        )
        if revenue_result
        else 0
    )

    recent_orders = (
        db.orders
        .find({})
        .sort(
            "created_at",
            -1
        )
        .limit(8)
    )

    return {
        "statistics": {
            "total_revenue":
                round(
                    total_revenue,
                    2
                ),

            "total_orders":
                total_orders,

            "paid_orders":
                paid_orders,

            "total_customers":
                total_customers,

            "total_products":
                total_products,

            "pending_payments":
                pending_payments,

            "rejected_orders":
                rejected_orders,
        },

        "recent_orders": [
            serialize_order(order)
            for order in recent_orders
        ],
    }


# =========================================================
# ALL ORDERS
# =========================================================

@router.get("/orders")
def get_all_orders(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    verification_status: Optional[str] = None,
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    query = {}

    if status:
        query["status"] = status

    if payment_status:
        query["payment_status"] = (
            payment_status
        )

    if verification_status:
        query["verification_status"] = (
            verification_status
        )

    orders = (
        db.orders
        .find(query)
        .sort(
            "created_at",
            -1
        )
    )

    return {
        "orders": [
            serialize_order(order)
            for order in orders
        ]
    }


# =========================================================
# DELETE ORDER
# =========================================================

@router.delete(
    "/orders/{order_id}"
)
def delete_order(
    order_id: str,
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    object_id = get_object_id(
        order_id,
        "order ID"
    )

    order = db.orders.find_one({
        "_id": object_id
    })

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found."
        )

    # Delete secure download tokens
    db.download_tokens.delete_many({
        "order_id": object_id
    })

    # Delete order
    db.orders.delete_one({
        "_id": object_id
    })

    return {
        "message":
            "Order deleted successfully.",

        "order_id":
            order_id,
    }


# =========================================================
# PAYMENT SCREENSHOT
# =========================================================

@router.get(
    "/orders/{order_id}/payment-proof"
)
def get_payment_proof(
    order_id: str,
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    object_id = get_object_id(
        order_id,
        "order ID"
    )

    order = db.orders.find_one({
        "_id": object_id
    })

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found."
        )

    stored_path = order.get(
        "payment_screenshot"
    )

    if not stored_path:
        raise HTTPException(
            status_code=404,
            detail=(
                "Payment screenshot "
                "not found."
            )
        )

    backend_directory = (
        Path(__file__)
        .resolve()
        .parents[2]
    )

    payment_proof_directory = (
        backend_directory
        / "storage"
        / "payment_proofs"
    ).resolve()

    stored_path_obj = Path(
        stored_path
    )

    if stored_path_obj.is_absolute():

        screenshot_path = (
            stored_path_obj
            .resolve()
        )

    else:

        screenshot_path = (
            payment_proof_directory
            / stored_path_obj.name
        ).resolve()

    # Security check
    try:

        screenshot_path.relative_to(
            payment_proof_directory
        )

    except ValueError:

        raise HTTPException(
            status_code=403,
            detail=(
                "Invalid payment "
                "proof path."
            )
        )

    if not screenshot_path.exists():

        raise HTTPException(
            status_code=404,
            detail=(
                "Payment screenshot "
                "file not found."
            )
        )

    if not screenshot_path.is_file():

        raise HTTPException(
            status_code=404,
            detail=(
                "Payment screenshot "
                "is invalid."
            )
        )

    return FileResponse(
        path=str(
            screenshot_path
        ),

        headers={
            "Cache-Control":
                "no-store, no-cache, "
                "must-revalidate",

            "Pragma":
                "no-cache",

            "Expires":
                "0",
        },
    )


# =========================================================
# APPROVE PAYMENT
# =========================================================

@router.put(
    "/orders/{order_id}/approve-payment"
)
def approve_payment(
    order_id: str,
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    # =====================================================
    # GET ORDER
    # =====================================================

    object_id = get_object_id(
        order_id,
        "order ID"
    )

    order = db.orders.find_one({
        "_id": object_id
    })

    if not order:

        raise HTTPException(
            status_code=404,
            detail="Order not found."
        )

    # =====================================================
    # CHECK PAYMENT STATUS
    # =====================================================

    if order.get(
        "payment_status"
    ) == "paid":

        raise HTTPException(
            status_code=400,
            detail=(
                "Payment is already approved."
            )
        )

    if order.get(
        "payment_status"
    ) != "payment_submitted":

        raise HTTPException(
            status_code=400,
            detail=(
                "This order does not have "
                "a submitted payment proof."
            )
        )

    # =====================================================
    # CHECK PAYMENT REFERENCE
    # =====================================================

    payment_reference = str(
        order.get(
            "payment_reference",
            ""
        )
    ).strip()

    if not payment_reference:

        raise HTTPException(
            status_code=400,
            detail=(
                "Payment reference / UTR "
                "is missing."
            )
        )

    # =====================================================
    # CHECK SCREENSHOT
    # =====================================================

    if not order.get(
        "payment_screenshot"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Payment screenshot "
                "is missing."
            )
        )

    # =====================================================
    # CHECK PRODUCTS
    # =====================================================

    order_items = order.get(
        "items",
        []
    )

    if not order_items:

        raise HTTPException(
            status_code=400,
            detail=(
                "No products found "
                "in this order."
            )
        )

    # =====================================================
    # DOWNLOAD TOKEN EXPIRY
    # =====================================================

    token_expire_hours = int(
        getattr(
            settings,
            "DOWNLOAD_TOKEN_EXPIRE_HOURS",
            48
        )
    )

    # =====================================================
    # PUBLIC BACKEND URL
    # =====================================================

    backend_public_url = (
        getattr(
            settings,
            "BACKEND_PUBLIC_URL",
            ""
        )
        or getattr(
            settings,
            "PUBLIC_API_URL",
            ""
        )
    ).rstrip("/")

    if not backend_public_url:

        raise HTTPException(
            status_code=500,
            detail=(
                "BACKEND_PUBLIC_URL is not "
                "configured in .env."
            )
        )

    # =====================================================
    # CURRENT TIME
    # =====================================================

    now = datetime.now(
        timezone.utc
    )

    expires_at = (
        now +
        timedelta(
            hours=token_expire_hours
        )
    )

    # =====================================================
    # PREPARE DOWNLOAD TOKENS
    # =====================================================

    generated_downloads = []

    for item in order_items:

        product_id = item.get(
            "product_id"
        )

        if not product_id:

            continue

        # -------------------------------------------------
        # Verify product still exists
        # -------------------------------------------------

        product = db.products.find_one({
            "_id": product_id
        })

        if not product:

            try:

                product = db.products.find_one({
                    "_id":
                        ObjectId(
                            str(
                                product_id
                            )
                        )
                })

            except Exception:

                product = None

        if not product:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Product not found: "
                    f"{item.get('title', '')}"
                )
            )

        # -------------------------------------------------
        # Verify digital file
        # -------------------------------------------------

        file_path = product.get(
            "file_path"
        )

        if not file_path:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Digital file is not "
                    f"configured for product: "
                    f"{product.get('title', '')}"
                )
            )

        # -------------------------------------------------
        # Generate secure token
        # -------------------------------------------------

        raw_token = secrets.token_urlsafe(
            48
        )

        token_hash = hashlib.sha256(
            raw_token.encode(
                "utf-8"
            )
        ).hexdigest()

        # -------------------------------------------------
        # Store ONLY HASH
        # -------------------------------------------------

        db.download_tokens.insert_one({
            "token_hash":
                token_hash,

            "order_id":
                object_id,

            "product_id":
                product["_id"],

            "product_public_id":
                product.get(
                    "product_id"
                ),

            "created_at":
                now,

            "expires_at":
                expires_at,

            "download_count":
                0,

            "last_downloaded_at":
                None,
        })

        # -------------------------------------------------
        # Download URL
        # -------------------------------------------------

        download_url = (
            f"{backend_public_url}"
            f"/api/downloads/"
            f"{raw_token}"
        )

        generated_downloads.append({
            "title":
                product.get(
                    "title",
                    "Digital Product"
                ),

            "download_url":
                download_url,
        })

    # =====================================================
    # CHECK TOKEN GENERATION
    # =====================================================

    if not generated_downloads:

        raise HTTPException(
            status_code=400,
            detail=(
                "No downloadable products "
                "were found."
            )
        )

    # =====================================================
    # COUPON
    # =====================================================

    coupon_id = order.get(
        "coupon_id"
    )

    coupon = None

    if coupon_id:

        try:

            coupon_object_id = (
                coupon_id
                if isinstance(
                    coupon_id,
                    ObjectId
                )
                else ObjectId(
                    str(
                        coupon_id
                    )
                )
            )

            coupon = db.coupons.find_one({
                "_id":
                    coupon_object_id
            })

        except Exception:

            coupon = None

    # =====================================================
    # APPROVE ORDER
    # =====================================================

    result = db.orders.update_one(
        {
            "_id":
                object_id,

            "payment_status":
                "payment_submitted",
        },

        {
            "$set": {
                "payment_status":
                    "paid",

                "verification_status":
                    "verified",

                "download_access":
                    True,

                "status":
                    "paid",

                "verified_by":
                    ObjectId(
                        current_admin["id"]
                    ),

                "verified_at":
                    now,

                "updated_at":
                    now,
            }
        }
    )

    if result.modified_count == 0:

        # Remove generated tokens
        db.download_tokens.delete_many({
            "order_id":
                object_id,

            "created_at":
                now,
        })

        raise HTTPException(
            status_code=409,
            detail=(
                "Order was already "
                "processed."
            )
        )

    # =====================================================
    # COUPON USAGE
    # =====================================================

    if coupon:

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
            usage_limit is None
            or used_count <
                int(usage_limit)
        ):

            db.coupons.update_one(
                {
                    "_id":
                        coupon["_id"]
                },

                {
                    "$inc": {
                        "used_count":
                            1
                    }
                }
            )

    # =====================================================
    # SEND GMAIL
    # =====================================================

    email_sent = False
    email_error = None

    customer = order.get(
        "customer",
        {}
    )

    customer_email = str(
        customer.get(
            "email",
            ""
        )
    ).strip()

    customer_name = str(
        customer.get(
            "name",
            "Customer"
        )
    ).strip()

    if not customer_email:

        email_error = (
            "Customer email is missing."
        )

    else:

        try:

            from app.utils.email import (
                send_download_email
            )

            send_download_email(
                customer_name=
                    customer_name,

                customer_email=
                    customer_email,

                order_number=
                    order.get(
                        "order_number",
                        ""
                    ),

                total=float(
                    order.get(
                        "total",
                        0
                    )
                ),

                products=
                    generated_downloads,
            )

            email_sent = True

        except Exception as error:

            email_error = str(
                error
            )

            print(
                "❌ Download email failed:",
                error
            )

    # =====================================================
    # RESPONSE
    # =====================================================

    response = {
        "message":
            "Payment approved successfully.",

        "order_id":
            str(
                order["_id"]
            ),

        "order_number":
            order.get(
                "order_number"
            ),

        "payment_status":
            "paid",

        "verification_status":
            "verified",

        "download_access":
            True,

        "email_sent":
            email_sent,

        "download_count":
            len(
                generated_downloads
            ),

        "expires_at":
            expires_at.isoformat(),
    }

    if email_error:

        response["email_error"] = (
            "Payment was approved, "
            "but the download email "
            "could not be sent."
        )

    return response


# =========================================================
# REJECT PAYMENT
# =========================================================

@router.put(
    "/orders/{order_id}/reject-payment"
)
def reject_payment(
    order_id: str,
    data: dict,
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    object_id = get_object_id(
        order_id,
        "order ID"
    )

    order = db.orders.find_one({
        "_id": object_id
    })

    if not order:

        raise HTTPException(
            status_code=404,
            detail="Order not found."
        )

    if order.get(
        "payment_status"
    ) == "paid":

        raise HTTPException(
            status_code=400,
            detail=(
                "Paid orders cannot "
                "be rejected."
            )
        )

    reason = str(
        data.get(
            "reason",
            ""
        )
    ).strip()

    if not reason:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please provide a "
                "rejection reason."
            )
        )

    if len(reason) > 500:

        raise HTTPException(
            status_code=400,
            detail=(
                "Rejection reason must "
                "be 500 characters or less."
            )
        )

    now = datetime.now(
        timezone.utc
    )

    # Delete any existing tokens
    db.download_tokens.delete_many({
        "order_id":
            object_id
    })

    db.orders.update_one(
        {
            "_id":
                object_id
        },

        {
            "$set": {
                "payment_status":
                    "rejected",

                "verification_status":
                    "rejected",

                "download_access":
                    False,

                "status":
                    "payment_rejected",

                "rejection_reason":
                    reason,

                "verified_by":
                    ObjectId(
                        current_admin["id"]
                    ),

                "verified_at":
                    now,

                "updated_at":
                    now,
            }
        }
    )

    return {
        "message":
            "Payment rejected.",

        "order_id":
            str(
                order["_id"]
            ),

        "payment_status":
            "rejected",

        "verification_status":
            "rejected",

        "download_access":
            False,

        "rejection_reason":
            reason,
    }


# =========================================================
# CUSTOMERS
# =========================================================

@router.get("/customers")
def get_customers(
    search: str = "",
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    query = {
        "role":
            "customer"
    }

    if search.strip():

        search_text = (
            search.strip()
        )

        query["$or"] = [
            {
                "name": {
                    "$regex":
                        search_text,

                    "$options":
                        "i",
                }
            },

            {
                "email": {
                    "$regex":
                        search_text,

                    "$options":
                        "i",
                }
            },
        ]

    users = list(
        db.users
        .find(query)
        .sort(
            "created_at",
            -1
        )
    )

    customers = []

    for user in users:

        user_id = user["_id"]

        order_stats = list(
            db.orders.aggregate([
                {
                    "$match": {
                        "user_id":
                            user_id,

                        "payment_status":
                            "paid",
                    }
                },

                {
                    "$group": {
                        "_id":
                            None,

                        "orders":
                            {
                                "$sum":
                                    1
                            },

                        "spent":
                            {
                                "$sum":
                                    "$total"
                            },
                    }
                }
            ])
        )

        stats = (
            order_stats[0]
            if order_stats
            else {}
        )

        customers.append({
            "id":
                str(user_id),

            "name":
                user.get(
                    "name",
                    ""
                ),

            "email":
                user.get(
                    "email",
                    ""
                ),

            "phone":
                user.get(
                    "phone",
                    ""
                ),

            "order_count":
                stats.get(
                    "orders",
                    0
                ),

            "total_spent":
                round(
                    float(
                        stats.get(
                            "spent",
                            0
                        )
                    ),
                    2
                ),

            "created_at":
                serialize_datetime(
                    user.get(
                        "created_at"
                    )
                ),
        })

    return {
        "customers":
            customers
    }


# =========================================================
# CUSTOMER DETAILS
# =========================================================

@router.get(
    "/customers/{customer_id}"
)
def get_customer(
    customer_id: str,
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    object_id = get_object_id(
        customer_id,
        "customer ID"
    )

    user = db.users.find_one({
        "_id":
            object_id,

        "role":
            "customer",
    })

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Customer not found."
        )

    orders = (
        db.orders
        .find({
            "user_id":
                object_id
        })
        .sort(
            "created_at",
            -1
        )
    )

    return {
        "customer": {
            "id":
                str(
                    user["_id"]
                ),

            "name":
                user.get(
                    "name",
                    ""
                ),

            "email":
                user.get(
                    "email",
                    ""
                ),

            "phone":
                user.get(
                    "phone",
                    ""
                ),

            "created_at":
                serialize_datetime(
                    user.get(
                        "created_at"
                    )
                ),
        },

        "orders": [
            serialize_order(order)
            for order in orders
        ],
    }


# =========================================================
# ANALYTICS
# =========================================================

@router.get("/analytics")
def get_analytics(
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    total_products = (
        db.products.count_documents({})
    )

    total_customers = (
        db.users.count_documents({
            "role":
                "customer"
        })
    )

    total_orders = (
        db.orders.count_documents({})
    )

    paid_orders = (
        db.orders.count_documents({
            "payment_status":
                "paid"
        })
    )

    pending_payments = (
        db.orders.count_documents({
            "payment_status":
                "payment_submitted"
        })
    )

    rejected_orders = (
        db.orders.count_documents({
            "payment_status":
                "rejected"
        })
    )

    unpaid_orders = (
        db.orders.count_documents({
            "payment_status":
                "unpaid"
        })
    )

    revenue_result = list(
        db.orders.aggregate([
            {
                "$match": {
                    "payment_status":
                        "paid"
                }
            },

            {
                "$group": {
                    "_id":
                        None,

                    "total_revenue": {
                        "$sum": {
                            "$ifNull": [
                                "$total",
                                0
                            ]
                        }
                    },
                }
            }
        ])
    )

    total_revenue = 0

    if revenue_result:

        total_revenue = float(
            revenue_result[0].get(
                "total_revenue",
                0
            )
        )

    revenue_by_day = list(
        db.orders.aggregate([
            {
                "$match": {
                    "payment_status":
                        "paid"
                }
            },

            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format":
                                "%Y-%m-%d",

                            "date":
                                "$created_at",
                        }
                    },

                    "revenue": {
                        "$sum": {
                            "$ifNull": [
                                "$total",
                                0
                            ]
                        }
                    },

                    "orders": {
                        "$sum":
                            1
                    },
                }
            },

            {
                "$sort": {
                    "_id":
                        1
                }
            }
        ])
    )

    revenue_by_day = [
        {
            "date":
                item["_id"],

            "revenue":
                float(
                    item.get(
                        "revenue",
                        0
                    )
                ),

            "orders":
                int(
                    item.get(
                        "orders",
                        0
                    )
                ),
        }

        for item in revenue_by_day
    ]

    product_sales = list(
        db.orders.aggregate([
            {
                "$match": {
                    "payment_status":
                        "paid"
                }
            },

            {
                "$unwind":
                    "$items"
            },

            {
                "$group": {
                    "_id":
                        "$items.product_id",

                    "quantity": {
                        "$sum": {
                            "$ifNull": [
                                "$items.quantity",
                                1
                            ]
                        }
                    },

                    "revenue": {
                        "$sum": {
                            "$multiply": [
                                {
                                    "$ifNull": [
                                        "$items.price",
                                        0
                                    ]
                                },

                                {
                                    "$ifNull": [
                                        "$items.quantity",
                                        1
                                    ]
                                }
                            ]
                        }
                    },
                }
            },

            {
                "$sort": {
                    "quantity":
                        -1
                }
            }
        ])
    )

    formatted_product_sales = []

    for item in product_sales:

        product_id = item.get(
            "_id"
        )

        product = None

        try:

            product = db.products.find_one({
                "_id":
                    ObjectId(
                        str(
                            product_id
                        )
                    )
            })

        except Exception:

            pass

        if not product:

            product = db.products.find_one({
                "product_id":
                    str(
                        product_id
                    )
            })

        formatted_product_sales.append({
            "product_id":
                str(product_id),

            "title": (
                product.get(
                    "title"
                )
                if product
                else "Unknown Product"
            ),

            "quantity":
                int(
                    item.get(
                        "quantity",
                        0
                    )
                ),

            "revenue":
                float(
                    item.get(
                        "revenue",
                        0
                    )
                ),
        })

    return {
        "stats": {
            "total_products":
                total_products,

            "total_customers":
                total_customers,

            "total_orders":
                total_orders,

            "paid_orders":
                paid_orders,

            "pending_payments":
                pending_payments,

            "rejected_orders":
                rejected_orders,

            "total_revenue":
                total_revenue,
        },

        "revenue_by_day":
            revenue_by_day,

        "product_sales":
            formatted_product_sales,

        "payment_stats": {
            "paid":
                paid_orders,

            "pending":
                pending_payments,

            "rejected":
                rejected_orders,

            "unpaid":
                unpaid_orders,
        },
    }


# =========================================================
# COUPONS
# =========================================================

@router.get("/coupons")
def get_coupons(
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    coupons = (
        db.coupons
        .find({})
        .sort(
            "created_at",
            -1
        )
    )

    return {
        "coupons": [
            serialize_coupon(
                coupon
            )
            for coupon in coupons
        ]
    }


@router.post("/coupons")
def create_coupon(
    coupon: dict,
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    code = str(
        coupon.get(
            "code",
            ""
        )
    ).strip().upper()

    if not code:

        raise HTTPException(
            status_code=400,
            detail=(
                "Coupon code is required."
            )
        )

    existing = db.coupons.find_one({
        "code":
            code
    })

    if existing:

        raise HTTPException(
            status_code=400,
            detail=(
                "Coupon code already exists."
            )
        )

    discount_type = coupon.get(
        "discount_type",
        "percentage"
    )

    if discount_type not in [
        "percentage",
        "fixed",
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid discount type."
            )
        )

    try:

        discount_value = float(
            coupon.get(
                "discount_value",
                0
            )
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid discount value."
            )
        )

    if discount_value <= 0:

        raise HTTPException(
            status_code=400,
            detail=(
                "Discount must be "
                "greater than 0."
            )
        )

    if (
        discount_type == "percentage"
        and discount_value > 100
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Percentage discount "
                "cannot exceed 100."
            )
        )

    now = datetime.now(
        timezone.utc
    )

    document = {
        "code":
            code,

        "discount_type":
            discount_type,

        "discount_value":
            discount_value,

        "minimum_order":
            float(
                coupon.get(
                    "minimum_order",
                    0
                )
                or 0
            ),

        "maximum_discount": (
            float(
                coupon[
                    "maximum_discount"
                ]
            )

            if coupon.get(
                "maximum_discount"
            ) not in [
                None,
                "",
            ]

            else None
        ),

        "usage_limit": (
            int(
                coupon[
                    "usage_limit"
                ]
            )

            if coupon.get(
                "usage_limit"
            ) not in [
                None,
                "",
            ]

            else None
        ),

        "used_count":
            0,

        "expires_at":
            coupon.get(
                "expires_at"
            ),

        "active":
            bool(
                coupon.get(
                    "active",
                    True
                )
            ),

        "created_at":
            now,

        "updated_at":
            now,
    }

    result = db.coupons.insert_one(
        document
    )

    created = db.coupons.find_one({
        "_id":
            result.inserted_id
    })

    return {
        "message":
            "Coupon created successfully.",

        "coupon":
            serialize_coupon(
                created
            ),
    }


@router.put(
    "/coupons/{coupon_id}"
)
def update_coupon(
    coupon_id: str,
    coupon: dict,
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    object_id = get_object_id(
        coupon_id,
        "coupon ID"
    )

    existing = db.coupons.find_one({
        "_id":
            object_id
    })

    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Coupon not found."
        )

    code = str(
        coupon.get(
            "code",
            ""
        )
    ).strip().upper()

    if not code:

        raise HTTPException(
            status_code=400,
            detail=(
                "Coupon code is required."
            )
        )

    duplicate = db.coupons.find_one({
        "code":
            code,

        "_id": {
            "$ne":
                object_id
        },
    })

    if duplicate:

        raise HTTPException(
            status_code=400,
            detail=(
                "Coupon code already exists."
            )
        )

    discount_type = coupon.get(
        "discount_type",
        "percentage"
    )

    if discount_type not in [
        "percentage",
        "fixed",
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid discount type."
            )
        )

    discount_value = float(
        coupon.get(
            "discount_value",
            0
        )
    )

    if discount_value <= 0:

        raise HTTPException(
            status_code=400,
            detail=(
                "Discount must be "
                "greater than 0."
            )
        )

    if (
        discount_type == "percentage"
        and discount_value > 100
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Percentage discount "
                "cannot exceed 100."
            )
        )

    usage_limit = (
        int(
            coupon[
                "usage_limit"
            ]
        )

        if coupon.get(
            "usage_limit"
        ) not in [
            None,
            "",
        ]

        else None
    )

    existing_used_count = int(
        existing.get(
            "used_count",
            0
        )
    )

    if (
        usage_limit is not None
        and usage_limit <
            existing_used_count
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Usage limit cannot be "
                "less than current usage."
            )
        )

    update_data = {
        "code":
            code,

        "discount_type":
            discount_type,

        "discount_value":
            discount_value,

        "minimum_order":
            float(
                coupon.get(
                    "minimum_order",
                    0
                )
                or 0
            ),

        "maximum_discount": (
            float(
                coupon[
                    "maximum_discount"
                ]
            )

            if coupon.get(
                "maximum_discount"
            ) not in [
                None,
                "",
            ]

            else None
        ),

        "usage_limit":
            usage_limit,

        "expires_at":
            coupon.get(
                "expires_at"
            ),

        "active":
            bool(
                coupon.get(
                    "active",
                    True
                )
            ),

        "updated_at":
            datetime.now(
                timezone.utc
            ),
    }

    db.coupons.update_one(
        {
            "_id":
                object_id
        },

        {
            "$set":
                update_data
        }
    )

    updated = db.coupons.find_one({
        "_id":
            object_id
    })

    return {
        "message":
            "Coupon updated successfully.",

        "coupon":
            serialize_coupon(
                updated
            ),
    }


@router.delete(
    "/coupons/{coupon_id}"
)
def delete_coupon(
    coupon_id: str,
    current_admin=Depends(
        get_current_admin
    ),
):
    db = get_database()

    object_id = get_object_id(
        coupon_id,
        "coupon ID"
    )

    result = db.coupons.delete_one({
        "_id":
            object_id
    })

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Coupon not found."
        )

    return {
        "message":
            "Coupon deleted successfully."
    }