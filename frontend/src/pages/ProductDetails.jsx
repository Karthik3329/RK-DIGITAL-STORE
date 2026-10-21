import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { getProductBySlug } from "../services/productService";

function ProductDetails() {
  const { slug } = useParams();
  const { addToCart, cartItems } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownershipLoading, setOwnershipLoading] = useState(false);
  const [owned, setOwned] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getProductBySlug(slug)
      .then((data) => { if (active) setProduct(data); })
      .catch((err) => { console.error(err); if (active) setError("Product could not be found."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    let active = true;
    setOwned(false);
    setActionError("");
    if (!user || !product) return () => { active = false; };
    setOwnershipLoading(true);
    api.get("/orders/owned-products")
      .then(({ data }) => {
        if (!active) return;
        const ids = Array.isArray(data?.product_ids) ? data.product_ids : [];
        setOwned(ids.includes(String(product.id || product._id)));
      })
      .catch((err) => {
        console.error("Ownership check failed:", err);
        if (active) setActionError("Unable to verify your purchases. Please refresh and try again.");
      })
      .finally(() => { if (active) setOwnershipLoading(false); });
    return () => { active = false; };
  }, [user?.id, user?._id, product?.id, product?._id]);

  if (loading) return <div className="page-center">Loading product...</div>;
  if (error || !product) return (
    <div className="page-center"><h2>Product Not Found</h2><Link to="/products" className="primary-button">Back to Products</Link></div>
  );

  const discount = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;
  const productId = String(product.id || product._id);
  const isInCart = cartItems.some((item) => String(item.id || item._id) === productId);
  const handleAddToCart = () => {
    if (owned || ownershipLoading || actionError) return;
    if (!isInCart) addToCart(product);
  };

  return (
    <main className="product-details">
      <div className="product-details-grid">
        <div className="details-image">
          {product.image ? <img src={product.image} alt={product.title} /> : <div className="details-placeholder">✦</div>}
        </div>
        <div className="details-content">
          <span className="product-category">{product.category}</span>
          <h1>{product.title}</h1>
          <p className="details-description">{product.description}</p>
          <div className="details-price">
            <strong>₹{product.price}</strong>
            {discount > 0 && <><del>₹{product.original_price}</del><span>{discount}% OFF</span></>}
          </div>
          <div className="product-features">
            <div><span>⚡</span><div><strong>Instant Access</strong><small>Download after purchase</small></div></div>
            <div><span>🔒</span><div><strong>Secure Purchase</strong><small>Safe and protected</small></div></div>
            <div><span>♻</span><div><strong>Lifetime Access</strong><small>Access your purchase anytime</small></div></div>
          </div>
          {actionError && <p role="alert" className="checkout-error">{actionError}</p>}
          <div className="details-actions">
            {owned ? (
              <>
                <button type="button" className="buy-button" disabled>✓ Already Purchased</button>
                <Link to="/downloads" className="view-cart-button">My Downloads →</Link>
              </>
            ) : (
              <>
                <button type="button" className="buy-button" onClick={handleAddToCart} disabled={ownershipLoading || Boolean(actionError) || isInCart}>
                  {ownershipLoading ? "Checking purchases..." : isInCart ? "✓ Added to Cart" : `🛒 Add to Cart — ₹${product.price}`}
                </button>
                <Link to="/cart" className="view-cart-button">View Cart →</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProductDetails;
