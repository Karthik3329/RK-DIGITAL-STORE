from datetime import datetime, timezone
import re

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database
from app.schemas.product_schema import (
    ProductCreate,
    ProductUpdate
)
from app.utils.dependencies import get_current_admin


router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)


# ==========================================
# SERIALIZE PRODUCT
# ==========================================

def serialize_product(product):

    return {
        # MongoDB internal ID
        "id": str(product["_id"]),

        # Public / custom product ID
        "product_id": product.get(
            "product_id"
        ),

        # Basic information
        "title": product.get("title"),

        "slug": product.get("slug"),

        "description": product.get(
            "description"
        ),

        "short_description": product.get(
            "short_description"
        ),

        # Pricing
        "price": product.get(
            "price",
            0
        ),

        "original_price": product.get(
            "original_price"
        ),

        # Files
        "image": product.get(
            "image"
        ),

        "file_name": product.get(
            "file_name"
        ),

        "file_path": product.get(
            "file_path"
        ),

        # Product type
        "product_type": product.get(
            "product_type",
            "digital"
        ),

        # Tags
        "tags": product.get(
            "tags",
            []
        ),

        # Featured
        "featured": product.get(
            "featured",
            False
        ),

        # Status
        "status": product.get(
            "status",
            "active"
        ),

        # Dates
        "created_at": product.get(
            "created_at"
        ),

        "updated_at": product.get(
            "updated_at"
        )
    }


# ==========================================
# VALIDATE PRODUCT ID
# ==========================================

def validate_product_id(product_id: str):

    product_id = product_id.strip().upper()

    # ------------------------------------------
    # Format:
    #
    # TP-001
    # UI-002
    # WP-010
    # COURSE-100
    #
    # 2 to 5 letters
    # -
    # one or more numbers
    # ------------------------------------------

    if not re.fullmatch(
        r"[A-Z]{2,5}-[0-9]+",
        product_id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid product ID format. "
                "Use format like TP-001, UI-002 or WP-010."
            )
        )

    return product_id


# ==========================================
# GET ALL ACTIVE PRODUCTS
# ==========================================

@router.get("/")
def get_products(
    search: str | None = None,
    featured: bool | None = None,

    min_price: float | None = Query(
        default=None,
        ge=0
    ),

    max_price: float | None = Query(
        default=None,
        ge=0
    )
):

    db = get_database()

    # Only active products are shown
    # to normal customers.

    query = {
        "status": "active"
    }

    # ------------------------------------------
    # SEARCH
    # ------------------------------------------

    if search:

        query["$or"] = [

            {
                "title": {
                    "$regex": search,
                    "$options": "i"
                }
            },

            {
                "description": {
                    "$regex": search,
                    "$options": "i"
                }
            },

            {
                "tags": {
                    "$regex": search,
                    "$options": "i"
                }
            },

            {
                "product_id": {
                    "$regex": search,
                    "$options": "i"
                }
            }
        ]

    # ------------------------------------------
    # FEATURED FILTER
    # ------------------------------------------

    if featured is not None:

        query["featured"] = featured

    # ------------------------------------------
    # MIN PRICE
    # ------------------------------------------

    if min_price is not None:

        query["price"] = {
            "$gte": min_price
        }

    # ------------------------------------------
    # MAX PRICE
    # ------------------------------------------

    if max_price is not None:

        if "price" in query:

            query["price"]["$lte"] = max_price

        else:

            query["price"] = {
                "$lte": max_price
            }

    # ------------------------------------------
    # FETCH PRODUCTS
    # ------------------------------------------

    products = (
        db.products
        .find(query)
        .sort("created_at", -1)
    )

    return {
        "count": db.products.count_documents(
            query
        ),

        "products": [
            serialize_product(product)
            for product in products
        ]
    }


# ==========================================
# GET FEATURED PRODUCTS
# ==========================================

@router.get("/featured")
def get_featured_products():

    db = get_database()

    products = (
        db.products
        .find({
            "status": "active",
            "featured": True
        })
        .sort(
            "created_at",
            -1
        )
    )

    return {
        "products": [
            serialize_product(product)
            for product in products
        ]
    }


# ==========================================
# GET SINGLE PRODUCT BY MONGODB ID
# ==========================================

@router.get("/{product_id}")
def get_product(product_id: str):

    db = get_database()

    try:

        object_id = ObjectId(
            product_id
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid product ID"
        )

    product = db.products.find_one({
        "_id": object_id,
        "status": "active"
    })

    if not product:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return serialize_product(product)


# ==========================================
# GET PRODUCT BY SLUG
# ==========================================

@router.get("/slug/{slug}")
def get_product_by_slug(slug: str):

    db = get_database()

    product = db.products.find_one({
        "slug": slug,
        "status": "active"
    })

    if not product:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return serialize_product(product)


# ==========================================
# ADMIN CREATE PRODUCT
# ==========================================

@router.post(
    "/",
    dependencies=[
        Depends(get_current_admin)
    ]
)
def create_product(
    product: ProductCreate
):

    db = get_database()

    # ==========================================
    # NORMALIZE PRODUCT ID
    # ==========================================

    product_id = validate_product_id(
        product.product_id
    )

    # ==========================================
    # CHECK PRODUCT ID UNIQUE
    # ==========================================

    existing_product_id = (
        db.products.find_one({
            "product_id": product_id
        })
    )

    if existing_product_id:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Product ID '{product_id}' "
                "already exists"
            )
        )

    # ==========================================
    # CHECK SLUG UNIQUE
    # ==========================================

    existing_product = (
        db.products.find_one({
            "slug": product.slug
        })
    )

    if existing_product:

        raise HTTPException(
            status_code=400,
            detail=(
                "Product slug already exists"
            )
        )

    # ==========================================
    # PRODUCT DATA
    # ==========================================

    product_data = product.model_dump()

    # Store normalized uppercase ID
    product_data["product_id"] = (
        product_id
    )

    # ==========================================
    # TIMESTAMPS
    # ==========================================

    now = datetime.now(
        timezone.utc
    )

    product_data["created_at"] = now

    product_data["updated_at"] = now

    # ==========================================
    # INSERT
    # ==========================================

    result = db.products.insert_one(
        product_data
    )

    return {

        "message": (
            "Product created successfully"
        ),

        # Your custom product ID
        "product_id": product_id,

        # MongoDB internal ID
        "database_id": str(
            result.inserted_id
        )
    }


# ==========================================
# ADMIN UPDATE PRODUCT
# ==========================================

@router.put(
    "/{product_id}",
    dependencies=[
        Depends(get_current_admin)
    ]
)
def update_product(
    product_id: str,
    product: ProductUpdate
):

    db = get_database()

    # ==========================================
    # VALIDATE MONGODB ID
    # ==========================================

    try:

        object_id = ObjectId(
            product_id
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid product ID"
        )

    # ==========================================
    # CHECK PRODUCT EXISTS
    # ==========================================

    existing_product = (
        db.products.find_one({
            "_id": object_id
        })
    )

    if not existing_product:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # ==========================================
    # BUILD UPDATE DATA
    # ==========================================

    update_data = {
        key: value
        for key, value in (
            product.model_dump().items()
        )
        if value is not None
    }

    if not update_data:

        raise HTTPException(
            status_code=400,
            detail="No data provided"
        )

    # ==========================================
    # IF PRODUCT ID IS BEING CHANGED
    # ==========================================

    if "product_id" in update_data:

        new_product_id = (
            validate_product_id(
                update_data["product_id"]
            )
        )

        # Check if another product
        # already uses this ID.

        duplicate_product = (
            db.products.find_one({
                "product_id": new_product_id,
                "_id": {
                    "$ne": object_id
                }
            })
        )

        if duplicate_product:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Product ID "
                    f"'{new_product_id}' "
                    "already exists"
                )
            )

        update_data["product_id"] = (
            new_product_id
        )

    # ==========================================
    # IF SLUG IS BEING CHANGED
    # ==========================================

    if "slug" in update_data:

        duplicate_slug = (
            db.products.find_one({
                "slug": update_data["slug"],
                "_id": {
                    "$ne": object_id
                }
            })
        )

        if duplicate_slug:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Product slug already exists"
                )
            )

    # ==========================================
    # UPDATE TIMESTAMP
    # ==========================================

    update_data["updated_at"] = (
        datetime.now(timezone.utc)
    )

    # ==========================================
    # UPDATE PRODUCT
    # ==========================================

    result = db.products.update_one(
        {
            "_id": object_id
        },
        {
            "$set": update_data
        }
    )

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {

        "message": (
            "Product updated successfully"
        ),

        "product_id": update_data.get(
            "product_id",
            existing_product.get(
                "product_id"
            )
        )
    }


# ==========================================
# ADMIN DELETE PRODUCT
# ==========================================

@router.delete(
    "/{product_id}",
    dependencies=[
        Depends(get_current_admin)
    ]
)
def delete_product(
    product_id: str
):

    db = get_database()

    # ==========================================
    # VALIDATE MONGODB ID
    # ==========================================

    try:

        object_id = ObjectId(
            product_id
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid product ID"
        )

    # ==========================================
    # DELETE
    # ==========================================

    result = db.products.delete_one({
        "_id": object_id
    })

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "message": (
            "Product deleted successfully"
        )
    }