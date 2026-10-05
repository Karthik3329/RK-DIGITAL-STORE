import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-inner">

        {/* BRAND */}
        <div className="footer-brand">

          <Link to="/" className="logo footer-logo">
            <img
              src="/rk-digital-logo.png"
              alt="RK Digital Store"
              className="logo-image"
            />

            <span className="logo-text">
              RK <span>Digital</span> Store
            </span>
          </Link>

          <p>
            Premium digital products for
            creators, developers and
            entrepreneurs.
          </p>

        </div>

        {/* LINKS */}
        <div className="footer-links">

          <div>
            <h4>Store</h4>

            <Link to="/products">
              Products
            </Link>

            <Link to="/products">
              Browse Products
            </Link>
          </div>

          <div>
            <h4>Support</h4>

            <Link to="/contact">
              Contact
            </Link>

            <Link to="/contact">
              FAQ
            </Link>
          </div>

          <div>
            <h4>Legal</h4>

            <Link to="/privacy">
              Privacy
            </Link>

            <Link to="/terms">
              Terms
            </Link>
          </div>

        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} RK Digital Store.
        All rights reserved.
      </div>

    </footer>
  );
}

export default Footer;