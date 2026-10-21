
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { getProductBySlug } from "../services/productService";

// ========================================
// PRODUCT DESCRIPTION FORMATTER
// ========================================

const SECTION_TITLES = [
  "what you will learn",
  "what you'll learn",
  "who is this ebook for",
  "what makes this ebook valuable",
  "why choose this ebook",
  "special introductory offer",
  "start learning javascript today",
  "features",
  "what's included",
  "course contents",
];

function formatDescription(description) {
  if (!description) return [];

  let text = String(description)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // Recognize headings even if the admin entered
  // the description as one long paragraph.
  SECTION_TITLES.forEach((heading) => {
    const escaped = heading.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(
      `\\s+(${escaped}\\s*[:?])`,
      "gi"
    );

    text = text.replace(regex, "\n\n$1\n");
  });

  // Place checklist items on separate lines.
  text = text.replace(
    /\s*(✅|✔️|✔|✓|☑️|☑)\s*/g,
    "\n$1 "
  );

  // Separate important promotional sections.
  text = text.replace(
    /\s+(Regular Price\s*:)/gi,
    "\n$1"
  );

  text = text.replace(
    /\s+(Special (?:Discount )?Price\s*:)/gi,
    "\n$1"
  );

  text = text.replace(
    /\s+(You Save\s*:)/gi,
    "\n$1"
  );

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const normalized = line
      .toLowerCase()
      .replace(/[:?]+$/, "")
      .trim();

    const isHeading = SECTION_TITLES.includes(
      normalized
    );

    const isListItem =
      /^(✅|✔️|✔|✓|☑️|☑|•|-)\s*/.test(line);

    const isPriceLine =
      /^(regular price|special (?:discount )?price|you save)\s*:/i.test(
        line
      );

    if (isHeading) {
      return {
        id: index,
        type: "heading",
        content: line,
      };
    }

    if (isListItem) {
      return {
        id: index,
        type: "list",
        content: line.replace(
          /^(✅|✔️|✔|✓|☑️|☑|•|-)\s*/,
          ""
        ),
      };
    }

    if (isPriceLine) {
      return {
        id: index,
        type: "price",
        content: line,
      };
    }

    return {
      id: index,
      type: "paragraph",
      content: line,
    };
  });
}

function ProductDescription({ description }) {
  const sections = formatDescription(description);

  if (!sections.length) return null;

  return (
    <section className="details-description">
      {sections.map((section) => {
        if (section.type === "heading") {
          return (
            <h3
              key={section.id}
              className="description-heading"
            >
              {section.content}
            </h3>
          );
        }

        if (section.type === "list") {
          return (
            <div
              key={section.id}
              className="description-list-item"
            >
              <span
                className="description-check"
                aria-hidden="true"
              >
                ✓
              </span>

              <span>{section.content}</span>
            </div>
          );
        }

        if (section.type === "price") {
          return (
            <p
              key={section.id}
              className="description-price-line"
            >
              {section.content}
            </p>
          );
        }

        return (
          <p key={section.id}>
            {section.content}
          </p>
        );
      })}
    </section>
  );
}

// ========================================
// PRODUCT DETAILS
// ========================================

function ProductDetails() {
  const { slug } = useParams();

  const { addToCart, cartItems } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [ownershipLoading, setOwnershipLoading] =
    useState(false);

  const [owned, setOwned] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // ========================================
  // LOAD PRODUCT
  // ========================================

  useEffect(() => {
    let active = true;

    setLoading(true);
    setProduct(null);
    setError("");

    getProductBySlug(slug)
      .then((data) => {
        if (active) {
          setProduct(data);
        }
      })
      .catch((err) => {
        console.error(err);

        if (active) {
          setError("Product could not be found.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // ========================================
  // CHECK PURCHASE OWNERSHIP
  // ========================================

  useEffect(() => {
    let active = true;

    setOwned(false);
    setActionError("");
    setOwnershipLoading(false);

    if (!user || !product) {
      return () => {
        active = false;
      };
    }

    setOwnershipLoading(true);

    api
      .get("/orders/owned-products")
      .then(({ data }) => {
        if (!active) return;

        const ids = Array.isArray(data?.product_ids)
          ? data.product_ids.map(String)
          : [];

        const productId = String(
          product.id || product._id || ""
        );

        setOwned(ids.includes(productId));
      })
      .catch((err) => {
        console.error(
          "Ownership check failed:",
          err
        );

        if (active) {
          setActionError(
            "Unable to verify your purchases. Please refresh and try again."
          );
        }
      })
      .finally(() => {
        if (active) {
          setOwnershipLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    user?.id,
    user?._id,
    product?.id,
    product?._id,
  ]);

  // ========================================
  // LOADING AND ERROR
  // ========================================

  if (loading) {
    return (
      <div className="page-center">
        Loading product...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-center">
        <h2>Product Not Found</h2>

        <Link
          to="/products"
          className="primary-button"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  // ========================================
  // PRODUCT VALUES
  // ========================================

  const price = Number(product.price || 0);

  const originalPrice = Number(
    product.original_price || 0
  );

  const discount =
    originalPrice > price && originalPrice > 0
      ? Math.round(
          ((originalPrice - price) / originalPrice) *
            100
        )
      : 0;

  const productId = String(
    product.id || product._id || ""
  );

  const isInCart = cartItems.some(
    (item) =>
      String(item.id || item._id || "") ===
      productId
  );

  const handleAddToCart = () => {
    if (
      owned ||
      ownershipLoading ||
      actionError ||
      isInCart
    ) {
      return;
    }

    addToCart(product);
  };

  // ========================================
  // UI
  // ========================================

  return (
    <main className="product-details">
      <div className="product-details-grid">

        {/* PRODUCT IMAGE */}
        <div className="details-image">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
            />
          ) : (
            <div className="details-placeholder">
              ✦
            </div>
          )}
        </div>

        {/* PRODUCT INFORMATION */}
        <div className="details-content">

          <span className="product-category">
            {product.category}
          </span>

          <h1>{product.title}</h1>

          {/* FORMATTED DESCRIPTION */}
          <ProductDescription
            description={product.description}
          />

          {/* PRICE */}
          <div className="details-price">
            <strong>₹{price}</strong>

            {discount > 0 && (
              <>
                <del>₹{originalPrice}</del>

                <span>{discount}% OFF</span>
              </>
            )}
          </div>

          {/* FEATURES */}
          <div className="product-features">

            <div>
              <span>⚡</span>

              <div>
                <strong>Instant Access</strong>

                <small>
                  Download after purchase
                </small>
              </div>
            </div>

            <div>
              <span>🔒</span>

              <div>
                <strong>Secure Purchase</strong>

                <small>
                  Safe and protected
                </small>
              </div>
            </div>

            <div>
              <span>♻</span>

              <div>
                <strong>Lifetime Access</strong>

                <small>
                  Access your purchase anytime
                </small>
              </div>
            </div>

          </div>

          {actionError && (
            <p
              role="alert"
              className="checkout-error"
            >
              {actionError}
            </p>
          )}

          {/* PURCHASE ACTIONS */}
          <div className="details-actions">

            {owned ? (
              <>
                <button
                  type="button"
                  className="buy-button"
                  disabled
                >
                  ✓ Already Purchased
                </button>

                <Link
                  to="/downloads"
                  className="view-cart-button"
                >
                  My Downloads →
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="buy-button"
                  onClick={handleAddToCart}
                  disabled={
                    ownershipLoading ||
                    Boolean(actionError) ||
                    isInCart
                  }
                >
                  {ownershipLoading
                    ? "Checking purchases..."
                    : isInCart
                    ? "✓ Added to Cart"
                    : `🛒 Add to Cart — ₹${price}`}
                </button>

                <Link
                  to="/cart"
                  className="view-cart-button"
                >
                  View Cart →
                </Link>
              </>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}

export default ProductDetails;
