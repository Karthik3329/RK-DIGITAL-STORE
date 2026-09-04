function Footer() {
  return (
    <footer className="footer">

      <div className="footer-inner">

        <div className="footer-brand">

          <div className="logo">
            <span className="logo-icon">
              D
            </span>

            <span>
              Digital<span>Store</span>
            </span>
          </div>

          <p>
            Premium digital products for
            creators, developers and
            entrepreneurs.
          </p>

        </div>

        <div className="footer-links">

          <div>
            <h4>Store</h4>
            <a href="/products">
              Products
            </a>
            <a href="/products">
              Categories
            </a>
          </div>

          <div>
            <h4>Support</h4>
            <a href="/">
              Contact
            </a>
            <a href="/">
              FAQ
            </a>
          </div>

          <div>
            <h4>Legal</h4>
            <a href="/">
              Privacy
            </a>
            <a href="/">
              Terms
            </a>
          </div>

        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} DigitalStore.
        All rights reserved.
      </div>

    </footer>
  );
}

export default Footer;