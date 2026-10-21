
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Downloads() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const response = await api.get("/orders/my-orders");

        const approvedOrders = (
          Array.isArray(response.data) ? response.data : []
        ).filter(
          (order) =>
            order.payment_status === "paid" &&
            order.download_access === true
        );

        if (active) {
          setOrders(approvedOrders);
        }
      } catch (err) {
        if (active) {
          setError("Unable to load your downloads.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  async function handleDownload(order) {
    setDownloading(order.id);
    setError("");

    try {
      const response = await api.get(
        `/orders/${order.id}/download`,
        {
          responseType: "blob",
        }
      );

      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      let filename = "digital-product";

      const disposition =
        response.headers["content-disposition"];

      if (disposition) {
        const encoded = disposition.match(
          /filename\*=UTF-8''([^;]+)/i
        );

        const plain = disposition.match(
          /filename="?([^";]+)"?/i
        );

        if (encoded) {
          try {
            filename = decodeURIComponent(encoded[1]);
          } catch {
            filename = "digital-product";
          }
        } else if (plain) {
          filename = plain[1];
        }
      }

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      setError(
        "Download failed. Please contact support."
      );
    } finally {
      setDownloading(null);
    }
  }

  return (
    <main className="downloads-page">
      <div className="downloads-container">

        <div className="downloads-header">
          <h1>My Downloads</h1>
          <p>
            Access and download your purchased
            digital products.
          </p>
        </div>

        {error && (
          <div
            className="downloads-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="downloads-loading">
            Loading your downloads...
          </div>
        ) : orders.length === 0 ? (
          <div className="downloads-empty">
            No approved downloads available yet.
          </div>
        ) : (
          <div className="downloads-grid">
            {orders.map((order) => (
              <article
                key={order.id}
                className="download-card"
              >
                <h2>
                  {order.items?.[0]?.title ||
                    "Digital Product"}
                </h2>

                <p className="download-order-number">
                  Order: {order.order_number}
                </p>

                <span className="download-status">
                  ✓ Payment Approved
                </span>

                <div>
                  <button
                    type="button"
                    className="download-button"
                    onClick={() =>
                      handleDownload(order)
                    }
                    disabled={
                      downloading === order.id
                    }
                  >
                    {downloading === order.id
                      ? "Downloading..."
                      : "⬇ Download Product"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
