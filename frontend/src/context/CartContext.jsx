import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "digital_store_cart";

const CART_CLEAR_EVENT = "digital-store-cart-clear";

function getProductId(product) {
  return String(product?.id || product?._id || "");
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem(
        CART_STORAGE_KEY
      );

      if (!savedCart) {
        return [];
      }

      const parsed = JSON.parse(savedCart);

      if (!Array.isArray(parsed)) {
        return [];
      }

      // Normalize old cart data
      return parsed.map((item) => ({
        ...item,
        id: getProductId(item),
        quantity: Number(item.quantity || 1),
      }));
    } catch (error) {
      console.error(
        "Failed to load cart:",
        error
      );

      return [];
    }
  });
  // ==========================================
// LISTEN FOR CART CLEAR EVENT
// ==========================================

useEffect(() => {
  const handleCartClear = () => {
    setCartItems([]);
  };

  window.addEventListener(
    CART_CLEAR_EVENT,
    handleCartClear
  );

  return () => {
    window.removeEventListener(
      CART_CLEAR_EVENT,
      handleCartClear
    );
  };
}, []);

  // ==========================================
  // SAVE CART
  // ==========================================

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cartItems)
    );
  }, [cartItems]);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const addToCart = (product) => {
    const productId = getProductId(product);

    if (!productId) {
      console.error(
        "Cannot add product without ID:",
        product
      );
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => getProductId(item) === productId
      );

      if (existingItem) {
        return currentItems.map((item) =>
          getProductId(item) === productId
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) + 1,
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          id: productId,
          quantity: 1,
        },
      ];
    });
  };

  // ==========================================
  // REMOVE
  // ==========================================

  const removeFromCart = (productId) => {
    const id = String(productId);

    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => getProductId(item) !== id
      )
    );
  };

  // ==========================================
  // UPDATE QUANTITY
  // ==========================================

  const updateQuantity = (
    productId,
    quantity
  ) => {
    const id = String(productId);
    const safeQuantity = Number(quantity);

    if (
      !Number.isFinite(safeQuantity) ||
      safeQuantity <= 0
    ) {
      removeFromCart(id);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        getProductId(item) === id
          ? {
              ...item,
              quantity: safeQuantity,
            }
          : item
      )
    );
  };

  // ==========================================
  // INCREASE
  // ==========================================

  const increaseQuantity = (productId) => {
    const id = String(productId);

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        getProductId(item) === id
          ? {
              ...item,
              quantity:
                Number(item.quantity || 0) + 1,
            }
          : item
      )
    );
  };

  // ==========================================
  // DECREASE
  // ==========================================

  const decreaseQuantity = (productId) => {
    const id = String(productId);

    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          getProductId(item) === id
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) - 1,
              }
            : item
        )
        .filter(
          (item) =>
            Number(item.quantity) > 0
        )
    );
  };

  // ==========================================
  // CLEAR
  // ==========================================

  const clearCart = () => {
    setCartItems([]);
  };

  // ==========================================
  // COUNT
  // ==========================================

  const cartCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  // ==========================================
  // SUBTOTAL
  // ==========================================

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => {
        const price =
          Number(item.price) || 0;

        const quantity =
          Number(item.quantity) || 0;

        return total + price * quantity;
      },
      0
    );
  }, [cartItems]);

  // ==========================================
  // ORIGINAL TOTAL
  // ==========================================

  const originalTotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => {
        const price = Number(
          item.original_price ??
          item.price ??
          0
        );

        const quantity =
          Number(item.quantity) || 0;

        return total + price * quantity;
      },
      0
    );
  }, [cartItems]);

  // ==========================================
  // SAVINGS
  // ==========================================

  const savings = useMemo(() => {
    return Math.max(
      originalTotal - subtotal,
      0
    );
  }, [
    originalTotal,
    subtotal,
  ]);

  // ==========================================
  // TOTAL
  // ==========================================

  const cartTotal = subtotal;

  // ==========================================
  // VALUE
  // ==========================================

  const value = {
    cartItems,
    cartCount,

    subtotal,
    cartTotal,
    originalTotal,
    savings,

    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(
    CartContext
  );

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}