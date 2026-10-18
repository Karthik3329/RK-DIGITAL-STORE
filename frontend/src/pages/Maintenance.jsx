
export default function Maintenance() {
  return (
    <main className="maintenance-page">
      <div className="maintenance-glow maintenance-glow-one" />
      <div className="maintenance-glow maintenance-glow-two" />

      <section className="maintenance-content">
        <div className="maintenance-logo">
  <img
     src="/rk-digital-logo.png"
    alt="RK DIGITAL STORE logo"
  />
</div>
       
        <p className="maintenance-brand">RK DIGITAL STORE</p>

        <div className="maintenance-status">
          <span className="maintenance-status-dot" />
          UNDER MAINTENANCE
        </div>

        <h1>
          Something
          <span> Better Is Coming.</span>
        </h1>

        <p className="maintenance-description">
          We're upgrading RK DIGITAL STORE to bring you a better
          digital shopping experience. Our website is temporarily
          unavailable while we make improvements.
        </p>

        <div className="maintenance-divider" />

        <div className="maintenance-footer">
          <span>Thank you for your patience.</span>
          <span className="maintenance-copyright">
            © {new Date().getFullYear()} RK DIGITAL STORE
          </span>
        </div>
      </section>
    </main>
  );
}