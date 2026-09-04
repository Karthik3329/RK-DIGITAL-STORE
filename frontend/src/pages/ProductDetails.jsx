import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";

import {
  getProductBySlug,
} from "../services/productService";

function ProductDetails() {
  const { slug } = useParams();

  const { addToCart, cartItems } = useCart();

  const [product, setProduct] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data =
          await getProductBySlug(slug);

        setProduct(data);
      } catch (error) {
        console.error(error);

        setError(
          "Product could not be found."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

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
        <h2>
          Product Not Found
        </h2>

        <Link
          to="/products"
          className="primary-button"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const discount =
    product.original_price &&
    product.original_price > product.price
      ? Math.round(
          ((product.original_price -
            product.price) /
            product.original_price) *
            100
        )
      : 0;

  const isInCart = cartItems.some(
    (item) => item._id === product._id
  );

  const handleAddToCart = () => {
    addToCart(product);
  };

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

          <h1>
            {product.title}
          </h1>

          <p className="details-description">
            {product.description}
          </p>


          {/* PRICE */}

          <div className="details-price">

            <strong>
              ₹{product.price}
            </strong>

            {product.original_price &&
              product.original_price >
                product.price && (
                <>
                  <del>
                    ₹{product.original_price}
                  </del>

                  <span>
                    {discount}% OFF
                  </span>
                </>
              )}

          </div>


          {/* FEATURES */}

          <div className="product-features">

            <div>
              <span>⚡</span>

              <div>
                <strong>
                  Instant Access
                </strong>

                <small>
                  Download after purchase
                </small>
              </div>
            </div>


            <div>
              <span>🔒</span>

              <div>
                <strong>
                  Secure Purchase
                </strong>

                <small>
                  Safe and protected
                </small>
              </div>
            </div>


            <div>
              <span>♻</span>

              <div>
                <strong>
                  Lifetime Access
                </strong>

                <small>
                  Access your purchase anytime
                </small>
              </div>
            </div>

          </div>


          {/* CART ACTIONS */}

          <div className="details-actions">

            <button
              className="buy-button"
              onClick={handleAddToCart}
            >
              {isInCart
                ? "✓ Added to Cart"
                : `🛒 Add to Cart — ₹${product.price}`}
            </button>


            <Link
              to="/cart"
              className="view-cart-button"
            >
              View Cart →
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}

export default ProductDetails;