from datetime import datetime, timezone
import secrets

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_database
from app.schemas.order_schema import OrderCreate
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"]
)


def generate_order_number():
    """
    Generate a customer-facing order reference.

    Example:
    ORD-20260904-A7K92
    """

    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = secrets.token_hex(3).upper()

    return f"ORD-{date_part}-{random_part}"


def serialize_order(order):
    return {
        "id": str(order["_id"]),
        "order_number": order.get("order_number"),
        "user_id": str(order.get("user_id")),
        "items": order.get("items", []),
        "customer": order.get("customer", {}),
        "subtotal": order.get("subtotal", 0),
        "discount": order.get("discount", 0),
        "total": order.get("total", 0),
        "status": order.get("status", "pending_payment"),
        "payment_status": order.get("payment_status", "unpaid"),
        "verification_status": order.get(
            "verification_status",
            "pending"
        ),
        "download_access": order.get(
            "download_access",
            False
        ),
        "created_at": (
            order["created_at"].isoformat()
            if isinstance(order.get("created_at"), datetime)
            else str(order.get("created_at", ""))
        )
    }


@router.post("/")
def create_order(
    order: OrderCreate,
    current_user=Depends(get_current_user)
):
    db = get_database()

    if not order.items:
        raise HTTPException(
            status_code=400,
            detail="Your cart is empty"
        )

    order_items = []
    subtotal = 0.0

    for item in order.items:

        # Find product using MongoDB ID
        try:
            product_object_id = ObjectId(item.product_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid product ID: {item.product_id}"
            )

        product = db.products.find_one({
            "_id": product_object_id,
            "status": "active"
        })

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product not found: {item.product_id}"
            )

        # IMPORTANT:
        # Price comes from MongoDB, NOT from React.
        price = float(product.get("price", 0))

        quantity = item.quantity
        item_total = price * quantity

        subtotal += item_total

        order_items.append({
            "product_id": str(product["_id"]),
            "public_product_id": product.get(
                "product_id"
            ),
            "title": product.get("title"),
            "price": price,
            "quantity": quantity,
            "total": item_total,
            "file_name": product.get("file_name"),
        })

    discount = 0.0
    total = subtotal - discount

    now = datetime.now(timezone.utc)

    order_data = {
        "order_number": generate_order_number(),

        "user_id": ObjectId(current_user["id"]),

        "items": order_items,

        "customer": {
            "name": order.customer.name.strip(),
            "email": str(order.customer.email).lower(),
            "phone": order.customer.phone.strip(),
        },

        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "total": round(total, 2),

        # Order state
        "status": "pending_payment",

        # Payment state
        "payment_status": "unpaid",

        # Manual verification state
        "verification_status": "pending",

        # Digital access
        "download_access": False,

        # Razorpay fields will be added later
        "razorpay_order_id": None,
        "razorpay_payment_id": None,
        "razorpay_signature": None,

        "created_at": now,
        "updated_at": now,
    }

    result = db.orders.insert_one(order_data)

    created_order = db.orders.find_one({
        "_id": result.inserted_id
    })

    return {
        "message": "Order created successfully",
        "order": serialize_order(created_order)
    }


@router.get("/")
def get_my_orders(
    current_user=Depends(get_current_user)
):
    db = get_database()

    user_id = ObjectId(current_user["id"])

    orders = db.orders.find({
        "user_id": user_id
    }).sort(
        "created_at",
        -1
    )

    return {
        "orders": [
            serialize_order(order)
            for order in orders
        ]
    }


@router.get("/{order_id}")
def get_my_order(
    order_id: str,
    current_user=Depends(get_current_user)
):
    db = get_database()

    try:
        object_id = ObjectId(order_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid order ID"
        )

    order = db.orders.find_one({
        "_id": object_id,
        "user_id": ObjectId(current_user["id"])
    })

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return serialize_order(order)