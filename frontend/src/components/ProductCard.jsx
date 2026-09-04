import { Link } from "react-router-dom";

function ProductCard({ product }) {

  const discount =
    product.original_price &&
    product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) /
            product.original_price) *
            100
        )
      : 0;

  return (
    <article className="product-card">

      <div className="product-image">

        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
          />
        ) : (
          <div className="product-placeholder">
            <span>✦</span>
          </div>
        )}

        {discount > 0 && (
          <span className="discount-badge">
            -{discount}%
          </span>
        )}

        {product.featured && (
          <span className="featured-badge">
            Featured
          </span>
        )}

      </div>

      <div className="product-content">

        <span className="product-category">
          {product.category}
        </span>

        <h3>{product.title}</h3>

        <p>
          {product.short_description ||
            product.description}
        </p>

        <div className="product-bottom">

          <div className="price">

            <strong>
              ₹{product.price}
            </strong>

            {product.original_price &&
              product.original_price >
                product.price && (
                <del>
                  ₹{product.original_price}
                </del>
              )}

          </div>

          <Link
            to={`/products/${product.slug}`}
            className="view-product"
          >
            View →
          </Link>

        </div>

      </div>

    </article>
  );
}

export default ProductCard;