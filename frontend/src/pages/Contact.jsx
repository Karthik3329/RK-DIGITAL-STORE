import { useState } from "react";
import api from "../services/api";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatus({
      type: "",
      message: "",
    });

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    if (!name) {
      setStatus({
        type: "error",
        message: "Please enter your name.",
      });
      return;
    }

    if (name.length < 2) {
      setStatus({
        type: "error",
        message: "Name must contain at least 2 characters.",
      });
      return;
    }

    if (!email) {
      setStatus({
        type: "error",
        message: "Please enter your email address.",
      });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    if (phone.length > 20) {
      setStatus({
        type: "error",
        message: "Phone number must not exceed 20 characters.",
      });
      return;
    }

    if (!subject) {
      setStatus({
        type: "error",
        message: "Please enter a subject.",
      });
      return;
    }

    if (subject.length < 2) {
      setStatus({
        type: "error",
        message: "Subject must contain at least 2 characters.",
      });
      return;
    }

    if (!message) {
      setStatus({
        type: "error",
        message: "Please enter your message.",
      });
      return;
    }

    if (message.length < 5) {
      setStatus({
        type: "error",
        message: "Message must contain at least 5 characters.",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name,
        email,
        phone,
        subject,
        message,
      };

      console.log("Sending contact form:", payload);

      const response = await api.post("/contact/", payload);

      setStatus({
        type: "success",
        message:
          response.data?.message ||
          "Your message has been sent successfully.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      console.error("Backend response:", error.response?.data);

      const detail = error.response?.data?.detail;

      let errorMessage =
        "Unable to send your message. Please try again.";

      if (Array.isArray(detail)) {
        errorMessage = detail
          .map((item) => {
            const location = item.loc || [];
            const field =
              location.length > 0
                ? location[location.length - 1]
                : "field";

            return `${field}: ${item.msg}`;
          })
          .join(" | ");
      } else if (typeof detail === "string") {
        errorMessage = detail;
      }

      setStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-page">

      <section className="contact-hero">
        <div className="contact-hero-content">
          <span className="contact-badge">
            GET IN TOUCH
          </span>

          <h1>
            Let's <span>Talk</span>
          </h1>

          <p>
            Have a question about a product, order, payment,
            or download? We're here to help.
          </p>
        </div>
      </section>

      <section className="contact-section">
        <div className="contact-container">

          <div className="contact-info">

            <span className="section-label">
              CONTACT US
            </span>

            <h2>
              We're here to
              <span> help.</span>
            </h2>

            <p className="contact-description">
              Whether you need help choosing a digital product,
              have a question about your order, or need assistance
              with your download, feel free to reach out.
            </p>

            <div className="contact-info-list">

              <div className="contact-info-card">
                <div className="contact-info-icon">
                  ✉
                </div>

                <div>
                  <h3>Email Support</h3>

                  <p>
                    support.rkdigital@gmail.com
                  </p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-info-icon">
                  🕐
                </div>

                <div>
                  <h3>Support Hours</h3>

                  <p>
                    Monday - Saturday
                    <br />
                    10:00 AM - 10:00 PM
                  </p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-info-icon">
                  ⚡
                </div>

                <div>
                  <h3>Response Time</h3>

                  <p>
                    Usually within 24 hours
                  </p>
                </div>
              </div>

            </div>

            <div className="contact-note">
              <strong>
                Need help with a download?
              </strong>

              <p>
                Please include your order number in your
                message so we can assist you faster.
              </p>
            </div>

          </div>

          <div className="contact-form-wrapper">

            <div className="contact-form-header">
              <span className="section-label">
                SEND A MESSAGE
              </span>

              <h2>
                How can we help?
              </h2>

              <p>
                Fill out the form and we'll get back to you.
              </p>
            </div>

            <form
              className="contact-form"
              onSubmit={handleSubmit}
              noValidate
            >

              <div className="contact-form-row">

                <div className="form-group">
                  <label htmlFor="name">
                    Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={100}
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={150}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

              </div>

              <div className="contact-form-row">

                <div className="form-group">
                  <label htmlFor="phone">
                    Phone
                    <span> Optional</span>
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={20}
                    autoComplete="tel"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">
                    Subject
                  </label>

                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="What can we help with?"
                    value={formData.subject}
                    onChange={handleChange}
                    maxLength={150}
                    disabled={loading}
                  />
                </div>

              </div>

              <div className="form-group">

                <label htmlFor="message">
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell us how we can help..."
                  value={formData.message}
                  onChange={handleChange}
                  rows="7"
                  maxLength={2000}
                  disabled={loading}
                />

              </div>

              {status.message && (
                <div
                  className={`contact-status ${status.type}`}
                  role="alert"
                >
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                className="contact-submit-button"
                disabled={loading}
              >
                {loading
                  ? "Sending..."
                  : "Send Message →"}
              </button>

            </form>

          </div>

        </div>
      </section>

      <section className="contact-faq">

        <div className="contact-faq-header">

          <span className="section-label">
            QUICK HELP
          </span>

          <h2>
            Frequently Asked
            <span> Questions</span>
          </h2>

          <p>
            Find quick answers to common questions.
          </p>

        </div>

        <div className="faq-grid">

          <div className="faq-card">
            <h3>
              How do I download my product?
            </h3>

            <p>
              After your payment is verified, your
              download access will become available
              in your account.
            </p>
          </div>

          <div className="faq-card">
            <h3>
              I haven't received my download.
            </h3>

            <p>
              Check your order status first. If your
              payment has been approved and you still
              need help, contact our support team.
            </p>
          </div>

          <div className="faq-card">
            <h3>
              How can I check my order?
            </h3>

            <p>
              Sign in to your account and open your
              orders section to view your order status.
            </p>
          </div>

          <div className="faq-card">
            <h3>
              Can I contact you about a product?
            </h3>

            <p>
              Yes. Send us a message with the product
              name and your question and we'll help you.
            </p>
          </div>

        </div>

      </section>

    </main>
  );
}

export default Contact;