
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { getFeaturedProducts } from "../services/productService";

function Home() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // PROTECTED NAVIGATION
  // ==========================================

  const navigateProtected = (path) => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", {
        state: { from: path },
      });
      return;
    }

    navigate(path);
  };

  // Browse Products
  const handleBrowseProducts = () => {
    navigateProtected("/products");
  };

  // Featured Product
  const handleFeaturedProduct = (product) => {
    const productPath = product.slug
      ? `/products/${product.slug}`
      : `/products/${product.id}`;

    navigateProtected(productPath);
  };

  // ==========================================
  // LOAD FEATURED PRODUCTS
  // ==========================================

  useEffect(() => {
    let active = true;

    const loadHomeData = async () => {
      try {
        const productsData = await getFeaturedProducts();

        if (active) {
          setProducts(productsData.products || []);
        }
      } catch (error) {
        console.error("Home data error:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main>

      {/* ================= HERO ================= */}

      <section className="hero">

        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-content">

          <div className="hero-badge">
            ✨ Premium Digital Products
          </div>

          <h1>
            Build Better.
            <br />
            <span>Create Faster.</span>
          </h1>

          <p>
            Discover premium templates, UI kits,
            ebooks, courses and digital resources
            designed to help you create amazing
            projects faster.
          </p>

          <div className="hero-buttons">

            <button
              type="button"
              className="primary-button"
              onClick={handleBrowseProducts}
              disabled={authLoading}
            >
              Explore Products →
            </button>

            <a
              href="#featured"
              className="secondary-button"
            >
              View Featured
            </a>

          </div>

          <div className="hero-stats">
            <div>
              <strong>24/7</strong>
              <span>Digital Store Access</span>
            </div>
          </div>

        </div>

        <div className="hero-visual">

          <div className="floating-card card-one">

            <span>🔒</span>

            <div>
              <strong>Secure Downloads</strong>
              <small>
                Available after payment approval
              </small>
            </div>

          </div>

          <div className="hero-product-preview">

            <div className="preview-top">
              <span />
              <span />
              <span />
            </div>

            <div className="preview-content">

              <div className="preview-icon">
                ✦
              </div>

              <h3>
                Premium
                <br />
                Digital Resources
              </h3>

              <div className="preview-line" />
              <div className="preview-line short" />

              <button
                type="button"
                onClick={handleBrowseProducts}
                disabled={authLoading}
              >
                Explore Collection
              </button>

            </div>

          </div>

          <div className="floating-card card-two">

            <span>⭐</span>

            <div>
              <strong>Premium Quality</strong>
              <small>Curated digital products</small>
            </div>

          </div>

        </div>

      </section>

      {/* ================= FEATURED PRODUCTS ================= */}

      <section
        className="section"
        id="featured"
      >

        <div className="section-header">

          <div>
            <span className="section-label">
              HANDPICKED FOR YOU
            </span>

            <h2>Featured Products</h2>

            <p>
              High-quality digital products
              ready to power your next project.
            </p>
          </div>

          <button
            type="button"
            className="view-all"
            onClick={handleBrowseProducts}
            disabled={authLoading}
          >
            View All →
          </button>

        </div>

        {loading ? (

          <div className="loading">
            Loading products...
          </div>

        ) : products.length > 0 ? (

          <div className="products-grid">

            {products.map((product) => (

              <div
                key={product.id}
                className="featured-product-clickable"
                role="link"
                tabIndex={0}
                onClick={(event) => {
                  // Prevent card click from overriding
                  // interactive elements inside ProductCard
                  if (
                    event.target.closest(
                      "a, button, input, select, textarea"
                    )
                  ) {
                    return;
                  }

                  handleFeaturedProduct(product);
                }}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    handleFeaturedProduct(product);
                  }
                }}
              >
                <ProductCard
                  product={product}
                />
              </div>

            ))}

          </div>

        ) : (

          <div className="empty-state">
            No featured products available yet.
          </div>

        )}

      </section>

      {/* ================= CTA ================= */}

      <section className="cta-section">

        <div>
          <span className="section-label">
            READY TO CREATE?
          </span>

          <h2>
            Your next great project
            starts here.
          </h2>

          <p>
            Explore our growing collection of
            premium digital products.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleBrowseProducts}
          disabled={authLoading}
        >
          Start Exploring →
        </button>

      </section>

    </main>
  );
}

export default Home;
