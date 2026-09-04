import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { getProducts } from "../services/productService";

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";

  const loadProducts = async () => {
    setLoading(true);

    try {
      const data = await getProducts({
        search: search || undefined,
      });

      setProducts(data.products || []);
    } catch (error) {
      console.error("Products error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  const handleSearch = (event) => {
    event.preventDefault();

    const value =
      event.target.elements.search.value.trim();

    if (value) {
      setSearchParams({
        search: value,
      });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <main className="products-page">

      {/* ================= HEADER ================= */}

      <section className="products-header">

        <span className="section-label">
          DIGITAL MARKETPLACE
        </span>

        <h1>
          Explore Digital Products
        </h1>

        <p>
          Premium resources designed to help
          you build, learn and create faster.
        </p>

      </section>


      {/* ================= SEARCH ================= */}

      <section className="product-toolbar">

        <form
          className="search-box"
          onSubmit={handleSearch}
        >

          <span>⌕</span>

          <input
            name="search"
            defaultValue={search}
            placeholder="Search digital products..."
          />

          <button type="submit">
            Search
          </button>

        </form>

      </section>


      {/* ================= PRODUCTS ================= */}

      <section className="products-list">

        <div className="results-info">

          <span>
            {loading
              ? "Loading..."
              : `${products.length} products found`}
          </span>

          {search && (
            <button
              onClick={clearFilters}
              className="clear-filter"
            >
              Clear search
            </button>
          )}

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

            <div>🔎</div>

            <h3>
              No products found
            </h3>

            <p>
              Try searching for another digital product.
            </p>

            {search && (
              <button
                onClick={clearFilters}
                className="primary-button"
              >
                View All Products
              </button>
            )}

          </div>

        )}

      </section>

    </main>
  );
}

export default Products;