from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================
# CREATE PRODUCT
# ==========================================

class ProductCreate(BaseModel):

    # ------------------------------------------
    # PRODUCT ID
    # Example: TP-001, UI-002, WP-010
    # ------------------------------------------

    product_id: str = Field(
        ...,
        min_length=4,
        max_length=30
    )

    # ------------------------------------------
    # BASIC INFORMATION
    # ------------------------------------------

    title: str = Field(
        ...,
        min_length=2,
        max_length=200
    )

    slug: str = Field(
        ...,
        min_length=2,
        max_length=200
    )

    description: str = Field(
        ...,
        min_length=10
    )

    short_description: Optional[str] = None

    # ------------------------------------------
    # PRICING
    # ------------------------------------------

    price: float = Field(
        ...,
        ge=0
    )

    original_price: Optional[float] = Field(
        default=None,
        ge=0
    )

    # ------------------------------------------
    # FILE / IMAGE
    # ------------------------------------------

    image: Optional[str] = None

    file_name: Optional[str] = None

    file_path: Optional[str] = None

    # ------------------------------------------
    # PRODUCT TYPE
    # ------------------------------------------

    product_type: str = "digital"

    # ------------------------------------------
    # TAGS
    # ------------------------------------------

    tags: List[str] = Field(
        default_factory=list
    )

    # ------------------------------------------
    # FEATURED
    # ------------------------------------------

    featured: bool = False

    # ------------------------------------------
    # STATUS
    # ------------------------------------------

    status: str = "active"


# ==========================================
# UPDATE PRODUCT
# ==========================================

class ProductUpdate(BaseModel):

    # Product ID can be changed later
    # but the new ID must also be unique.

    product_id: Optional[str] = Field(
        default=None,
        min_length=4,
        max_length=30
    )

    title: Optional[str] = None

    slug: Optional[str] = None

    description: Optional[str] = None

    short_description: Optional[str] = None

    price: Optional[float] = Field(
        default=None,
        ge=0
    )

    original_price: Optional[float] = Field(
        default=None,
        ge=0
    )

    image: Optional[str] = None

    file_name: Optional[str] = None

    file_path: Optional[str] = None

    product_type: Optional[str] = None

    tags: Optional[List[str]] = None

    featured: Optional[bool] = None

    status: Optional[str] = None