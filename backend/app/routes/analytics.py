from fastapi import APIRouter, Depends

from app.database import get_database
from app.utils.dependencies import get_current_admin


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)


@router.get("/")
def get_analytics(
    current_admin=Depends(
        get_current_admin
    )
):
    db = get_database()

    # ==========================================
    # ORDER COUNTS
    # ==========================================

    total_orders = db.orders.count_documents({})

    pending_verification = (
        db.orders.count_documents({
            "verification_status": "pending",
            "payment_status": "payment_submitted",
        })
    )

    verified_orders = (
        db.orders.count_documents({
            "verification_status": "verified",
        })
    )

    rejected_orders = (
        db.orders.count_documents({
            "verification_status": "rejected",
        })
    )

    # ==========================================
    # REVENUE
    # ==========================================

    revenue_pipeline = [
        {
            "$match": {
                "verification_status":
                    "verified"
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {
                    "$sum": "$total"
                }
            }
        }
    ]

    revenue_result = list(
        db.orders.aggregate(
            revenue_pipeline
        )
    )

    revenue = (
        float(
            revenue_result[0]["total"]
        )
        if revenue_result
        else 0.0
    )

    # ==========================================
    # CUSTOMERS
    # ==========================================

    total_customers = db.users.count_documents({
        "role": "customer"
    })

    # ==========================================
    # PRODUCTS
    # ==========================================

    total_products = db.products.count_documents({})

    active_products = db.products.count_documents({
        "status": "active"
    })

    # ==========================================
    # RESPONSE
    # ==========================================

    return {
        "total_orders":
            total_orders,

        "pending_verification":
            pending_verification,

        "verified_orders":
            verified_orders,

        "rejected_orders":
            rejected_orders,

        "revenue":
            round(revenue, 2),

        "total_customers":
            total_customers,

        "total_products":
            total_products,

        "active_products":
            active_products,
    }