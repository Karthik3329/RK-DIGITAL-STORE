from datetime import datetime, timezone
import re

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import BaseModel, Field

from app.database import get_database
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/coupons",
    tags=["Coupons"],
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class CouponValidateRequest(BaseModel):

    coupon_code: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    subtotal: float = Field(
        ...,
        ge=0,
    )


# ============================================================
# HELPERS
# ============================================================

def normalize_coupon_code(code: str) -> str:
    return code.strip().upper()


def parse_expiry_date(value):

    if value is None:
        return None

    if isinstance(value, datetime):

        if value.tzinfo is None:
            return value.replace(
                tzinfo=timezone.utc
            )

        return value

    if isinstance(value, str):

        value = value.strip()

        if not value:
            return None

        try:
            parsed = datetime.fromisoformat(
                value.replace("Z", "+00:00")
            )

            if parsed.tzinfo is None:
                parsed = parsed.replace(
                    tzinfo=timezone.utc
                )

            return parsed

        except ValueError:
            return None

    return None


def find_coupon(db, coupon_code: str):

    normalized_code = normalize_coupon_code(
        coupon_code
    )

    # Case-insensitive lookup
    coupon = db.coupons.find_one(
        {
            "code": {
                "$regex": (
                    "^"
                    + re.escape(
                        normalized_code
                    )
                    + "$"
                ),
                "$options": "i",
            }
        }
    )

    return coupon


def calculate_coupon_discount(
    coupon,
    subtotal: float,
):

    discount_type = str(
        coupon.get(
            "discount_type",
            "percentage",
        )
    ).lower()

    discount_value = float(
        coupon.get(
            "discount_value",
            0,
        )
    )

    minimum_order = float(
        coupon.get(
            "minimum_order",
            0,
        )
        or 0
    )

    maximum_discount = coupon.get(
        "maximum_discount"
    )

    # ----------------------------------------
    # MINIMUM ORDER
    # ----------------------------------------

    if subtotal < minimum_order:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Minimum order value for "
                f"this coupon is ₹"
                f"{minimum_order:.2f}."
            ),
        )

    # ----------------------------------------
    # PERCENTAGE
    # ----------------------------------------

    if discount_type == "percentage":

        discount = (
            subtotal
            * discount_value
            / 100
        )

        if (
            maximum_discount is not None
            and maximum_discount != ""
        ):

            maximum_discount_value = float(
                maximum_discount
            )

            if maximum_discount_value > 0:

                discount = min(
                    discount,
                    maximum_discount_value,
                )

    # ----------------------------------------
    # FIXED
    # ----------------------------------------

    elif discount_type == "fixed":

        discount = discount_value

    else:

        raise HTTPException(
            status_code=400,
            detail="Invalid coupon discount type.",
        )

    # ----------------------------------------
    # NEVER EXCEED SUBTOTAL
    # ----------------------------------------

    discount = min(
        max(discount, 0),
        subtotal,
    )

    return round(
        discount,
        2,
    )


# ============================================================
# VALIDATE COUPON
# ============================================================

@router.post("/validate")
def validate_coupon(
    request: CouponValidateRequest,
    current_user=Depends(get_current_user),
):

    db = get_database()

    coupon_code = normalize_coupon_code(
        request.coupon_code
    )

    subtotal = round(
        float(request.subtotal),
        2,
    )

    # ----------------------------------------
    # FIND COUPON
    # ----------------------------------------

    coupon = find_coupon(
        db,
        coupon_code,
    )

    if not coupon:

        raise HTTPException(
            status_code=404,
            detail="Invalid coupon code.",
        )

    # ----------------------------------------
    # ACTIVE
    # ----------------------------------------

    if not coupon.get(
        "active",
        False,
    ):

        raise HTTPException(
            status_code=400,
            detail="This coupon is inactive.",
        )

    # ----------------------------------------
    # EXPIRY
    # ----------------------------------------

    expiry_date = parse_expiry_date(
        coupon.get("expires_at")
    )

    if (
        expiry_date is not None
        and datetime.now(
            timezone.utc
        ) >= expiry_date
    ):

        raise HTTPException(
            status_code=400,
            detail="This coupon has expired.",
        )

    # ----------------------------------------
    # USAGE LIMIT
    # ----------------------------------------

    usage_limit = coupon.get(
        "usage_limit"
    )

    used_count = int(
        coupon.get(
            "used_count",
            0,
        )
        or 0
    )

    if (
        usage_limit is not None
        and usage_limit != ""
    ):

        usage_limit = int(
            usage_limit
        )

        if (
            usage_limit > 0
            and used_count >= usage_limit
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "This coupon has "
                    "reached its usage limit."
                ),
            )

    # ----------------------------------------
    # CALCULATE DISCOUNT
    # ----------------------------------------

    discount = calculate_coupon_discount(
        coupon,
        subtotal,
    )

    total = round(
        max(
            subtotal - discount,
            0,
        ),
        2,
    )

    # ----------------------------------------
    # RESPONSE
    # ----------------------------------------

    return {
        "valid": True,

        "coupon": {
            "id": str(
                coupon["_id"]
            ),

            "code": coupon.get(
                "code"
            ),

            "discount_type": coupon.get(
                "discount_type"
            ),

            "discount_value": float(
                coupon.get(
                    "discount_value",
                    0,
                )
            ),

            "minimum_order": float(
                coupon.get(
                    "minimum_order",
                    0,
                )
                or 0
            ),

            "maximum_discount": (
                float(
                    coupon.get(
                        "maximum_discount"
                    )
                )
                if coupon.get(
                    "maximum_discount"
                )
                not in (
                    None,
                    "",
                )
                else None
            ),
        },

        "subtotal": subtotal,

        "discount": discount,

        "total": total,
    }