from typing import List
from pydantic import BaseModel, EmailStr, Field


class OrderItemCreate(BaseModel):
    product_id: str = Field(..., min_length=1)
    quantity: int = Field(default=1, ge=1, le=20)


class ShippingDetails(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=20)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1)
    customer: ShippingDetails


class PaymentProofSubmit(BaseModel):
    payment_reference: str = Field(
        ...,
        min_length=4,
        max_length=100
    )

class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: str
    items: list
    customer: dict
    subtotal: float
    discount: float
    total: float
    status: str
    payment_status: str
    verification_status: str
    download_access: bool
    created_at: str