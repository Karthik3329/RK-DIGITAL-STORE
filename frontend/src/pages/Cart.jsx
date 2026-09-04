import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();

  const {
    cartItems,
    cartCount,
    subtotal,
    originalTotal,
    savings,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <main className="cart-page">

        <div className="empty-cart">

          <div className="empty-cart-icon">
            🛒
          </div>

          <span className="section-label">
            YOUR CART
          </span>

          <h1>
            Your cart is empty
          </h1>

          <p>
            Discover premium digital products
            and add something to your collection.
          </p>

          <Link
            to="/products"
            className="primary-button"
          >
            Browse Products
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="cart-page">

      <div className="cart-container">

        {/* HEADER */}

        <div className="cart-header">

          <div>
            <span className="section-label">
              SHOPPING CART
            </span>

            <h1>
              Your Cart
            </h1>

            <p>
              {cartCount}{" "}
              {cartCount === 1
                ? "item"
                : "items"}{" "}
              ready for checkout.
            </p>
          </div>

          <button
            className="clear-cart-button"
            onClick={clearCart}
          >
            Clear Cart
          </button>

        </div>


        {/* CART LAYOUT */}

        <div className="cart-layout">

          {/* ITEMS */}

          <section className="cart-items">

            {cartItems.map((item) => {

              const itemOriginalPrice =
                Number(
                  item.original_price ||
                    item.price
                );

              const itemPrice =
                Number(item.price || 0);

              return (
                <article
                  className="cart-item"
                  key={item._id}
                >

                  {/* IMAGE */}

                  <div className="cart-item-image">

                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                      />
                    ) : (
                      <div className="cart-placeholder">
                        ✦
                      </div>
                    )}

                  </div>


                  {/* CONTENT */}

                  <div className="cart-item-content">

                    <span className="product-category">
                      {item.category}
                    </span>

                    <h3>
                      {item.title}
                    </h3>

                    <p>
                      {item.short_description ||
                        item.description}
                    </p>

                    <div className="cart-item-price">

                      <strong>
                        ₹{itemPrice.toFixed(2)}
                      </strong>

                      {itemOriginalPrice >
                        itemPrice && (
                        <del>
                          ₹
                          {itemOriginalPrice.toFixed(
                            2
                          )}
                        </del>
                      )}

                    </div>

                  </div>


                  {/* CONTROLS */}

                  <div className="cart-item-actions">

                    <div className="quantity-control">

                      <button
                        onClick={() =>
                          decreaseQuantity(
                            item._id
                          )
                        }
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          increaseQuantity(
                            item._id
                          )
                        }
                        aria-label="Increase quantity"
                      >
                        +
                      </button>

                    </div>

                    <strong className="cart-item-total">
                      ₹
                      {(
                        itemPrice *
                        item.quantity
                      ).toFixed(2)}
                    </strong>

                    <button
                      className="remove-item"
                      onClick={() =>
                        removeFromCart(
                          item._id
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>

                </article>
              );
            })}

          </section>


          {/* SUMMARY */}

          <aside className="cart-summary">

            <div className="summary-card">

              <span className="summary-label">
                ORDER SUMMARY
              </span>

              <h2>
                Summary
              </h2>

              <div className="summary-row">
                <span>
                  Items
                </span>

                <span>
                  {cartCount}
                </span>
              </div>

              <div className="summary-row">
                <span>
                  Original Price
                </span>

                <span>
                  ₹
                  {originalTotal.toFixed(2)}
                </span>
              </div>

              {savings > 0 && (
                <div className="summary-row savings-row">
                  <span>
                    You Save
                  </span>

                  <span>
                    -₹
                    {savings.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="summary-divider" />

              <div className="summary-total">

                <span>
                  Total
                </span>

                <strong>
                  ₹{subtotal.toFixed(2)}
                </strong>

              </div>

              <button
                className="checkout-button"
                onClick={handleCheckout}
              >
                Proceed to Checkout
                <span>→</span>
              </button>

              <Link
                to="/products"
                className="continue-shopping"
              >
                ← Continue Shopping
              </Link>

            </div>

            <div className="secure-cart">

              <span>🔒</span>

              <div>
                <strong>
                  Secure Checkout
                </strong>

                <small>
                  Your payment and order information
                  will be protected.
                </small>
              </div>

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}

export default Cart;