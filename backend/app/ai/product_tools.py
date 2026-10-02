from app.database import get_database


def search_products(query: str = "", limit: int = 8):
    db = get_database()

    query = query.strip()

    mongo_query = {
        "status": "active"
    }

    if query:
        words = [
            word.strip()
            for word in query.lower().split()
            if len(word.strip()) >= 3
        ]

        if words:
            search_terms = []

            for word in words:
                search_terms.extend([
                    {"title": {"$regex": word, "$options": "i"}},
                    {"description": {"$regex": word, "$options": "i"}},
                    {"short_description": {"$regex": word, "$options": "i"}},
                    {"product_id": {"$regex": word, "$options": "i"}},
                    {"tags": {"$regex": word, "$options": "i"}},
                    {"product_type": {"$regex": word, "$options": "i"}},
                ])

            mongo_query["$or"] = search_terms

    products = list(
        db.products.find(mongo_query).limit(limit)
    )

    results = []

    for product in products:
        results.append({
            "product_id": product.get("product_id", ""),
            "title": product.get("title", ""),
            "slug": product.get("slug", ""),
            "short_description": product.get(
                "short_description", ""
            ),
            "description": product.get(
                "description", ""
            ),
            "price": product.get(
                "price", 0
            ),
            "original_price": product.get(
                "original_price"
            ),
            "product_type": product.get(
                "product_type", ""
            ),
            "tags": product.get(
                "tags", []
            ),
            "featured": product.get(
                "featured", False
            ),
        })

    return results


def get_product(product_id: str):
    db = get_database()

    product = db.products.find_one({
        "product_id": product_id,
        "status": "active"
    })

    if not product:
        return None

    return {
        "product_id": product.get("product_id", ""),
        "title": product.get("title", ""),
        "slug": product.get("slug", ""),
        "description": product.get(
            "description", ""
        ),
        "short_description": product.get(
            "short_description", ""
        ),
        "price": product.get(
            "price", 0
        ),
        "original_price": product.get(
            "original_price"
        ),
        "product_type": product.get(
            "product_type", ""
        ),
        "tags": product.get(
            "tags", []
        ),
        "featured": product.get(
            "featured", False
        ),
    }