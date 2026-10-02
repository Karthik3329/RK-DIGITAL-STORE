from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.ai_service import generate_ai_response
from app.ai.product_tools import search_products, get_product


router = APIRouter(
    prefix="/api/ai",
    tags=["AI"]
)


class ChatMessage(BaseModel):
    role: str
    content: str


class AIChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000
    )

    conversation_history: Optional[
        List[ChatMessage]
    ] = []


class AIChatResponse(BaseModel):
    response: str


def should_search_products(message: str) -> bool:
    message = message.lower()

    product_keywords = [
        "product",
        "products",
        "price",
        "prices",
        "cost",
        "costs",
        "template",
        "templates",
        "theme",
        "themes",
        "website",
        "websites",
        "digital",
        "item",
        "items",
        "buy",
        "purchase",
        "available",
        "catalog",
        "store",
        "shop",
        "tp-",
        "ui-",
        "wp-",
    ]

    return any(
        keyword in message
        for keyword in product_keywords
    )


def extract_product_id(message: str):
    words = (
        message
        .upper()
        .replace(",", " ")
        .replace(".", " ")
        .replace("?", " ")
        .replace("!", " ")
        .split()
    )

    for word in words:
        if (
            word.startswith("TP-")
            or word.startswith("UI-")
            or word.startswith("WP-")
        ):
            return word

    return None


def build_product_context(message: str):
    product_id = extract_product_id(message)

    if product_id:
        product = get_product(product_id)

        if not product:
            return (
                "IMPORTANT VERIFIED INFORMATION:\n"
                f"No active product with ID {product_id} "
                "was found in the DigitalStore database."
            )

        return f"""
IMPORTANT VERIFIED DIGITALSTORE PRODUCT DATA:

Product ID: {product.get("product_id")}
Title: {product.get("title")}
Price: ₹{product.get("price")}
Original Price: ₹{product.get("original_price")}
Product Type: {product.get("product_type")}
Short Description: {product.get("short_description")}
Description: {product.get("description")}
Tags: {product.get("tags")}
Featured: {product.get("featured")}

RULE:
Only use the verified product information above.
Do not invent product features, prices, discounts,
availability, files, or other details.
"""

    if not should_search_products(message):
        return ""

    products = search_products(
        query="",
        limit=20
    )

    if not products:
        return (
            "IMPORTANT VERIFIED INFORMATION:\n"
            "There are currently no active products "
            "available in the DigitalStore database."
        )

    context_lines = [
        "IMPORTANT VERIFIED DIGITALSTORE PRODUCT DATA:",
        ""
    ]

    for product in products:
        price = product.get("price", 0)
        original_price = product.get(
            "original_price"
        )

        context_lines.append(
            f"""
Product ID: {product.get("product_id")}
Title: {product.get("title")}
Price: ₹{price}
Original Price: ₹{original_price}
Product Type: {product.get("product_type")}
Short Description: {product.get("short_description")}
Description: {product.get("description")}
Tags: {product.get("tags")}
Featured: {product.get("featured")}
"""
        )

    context_lines.append(
        """
RULE:
Only use the verified product information above.
Do not invent products, prices, discounts,
availability, or product details.
"""
    )

    return "\n".join(context_lines)


@router.post(
    "/chat",
    response_model=AIChatResponse
)
def chat_with_ai(request: AIChatRequest):

    try:
        product_context = build_product_context(
            request.message
        )

        history = [
            {
                "role": message.role,
                "content": message.content
            }
            for message in request.conversation_history
        ]

        response = generate_ai_response(
            message=request.message,
            conversation_history=history,
            context=product_context
        )

        return {
            "response": response
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error)
        )

    except Exception as error:
        print(
            "AI ERROR:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI response."
        )