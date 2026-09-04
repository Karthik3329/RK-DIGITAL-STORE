import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ProductCard from "../components/ProductCard";

import {
  getFeaturedProducts,
} from "../services/productService";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const productsData = await getFeaturedProducts();

        setProducts(productsData.products || []);
      } catch (error) {
        console.error("Home data error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
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

            <Link
              to="/products"
              className="primary-button"
            >
              Explore Products →
            </Link>

            <a
              href="#featured"
              className="secondary-button"
            >
              View Featured
            </a>

          </div>

          <div className="hero-stats">

            <div>
              <strong>50+</strong>
              <span>Happy Customers</span>
            </div>

            <div>
              <strong>24/7</strong>
              <span>Instant Access</span>
            </div>

          </div>

        </div>

        <div className="hero-visual">

          <div className="floating-card card-one">

            <span>⚡</span>

            <div>
              <strong>Instant Download</strong>
              <small>Get your files immediately</small>
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

              <button>
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

            <h2>
              Featured Products
            </h2>

            <p>
              High-quality digital products
              ready to power your next project.
            </p>

          </div>

          <Link
            to="/products"
            className="view-all"
          >
            View All →
          </Link>

        </div>


        {loading ? (

          <div className="loading">
            Loading products...
          </div>

        ) : products.length > 0 ? (

          <div className="products-grid">

            {products.map((product) => (

              <ProductCard
                key={product.id}
                product={product}
              />

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

        <Link
          to="/products"
          className="primary-button"
        >
          Start Exploring →
        </Link>

      </section>

    </main>
  );
}

export default Home;