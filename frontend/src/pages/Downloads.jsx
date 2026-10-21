import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

function getFilename(contentDisposition, fallback) {
  if (!contentDisposition) return fallback;
  const encoded = contentDisposition.match(/filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^['"]|['"]$/g, ""));
    } catch {
      // Use the ordinary filename or fallback instead.
    }
  }
  const regular = contentDisposition.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i);
  return (regular?.[1] || regular?.[2] || fallback).trim();
}

async function getApiError(error, fallback) {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text());
      if (typeof body.detail === "string") return body.detail;
      if (Array.isArray(body.detail)) {
        return body.detail.map((item) => item.msg || String(item)).join("; ");
      }
      if (typeof body.message === "string") return body.message;
    } catch {
      // The server may have returned a non-JSON error page.
    }
  } else if (typeof data?.detail === "string") {
    return data.detail;
  } else if (typeof data?.message === "string") {
    return data.message;
  }
  if (!error?.response && error?.message) return error.message;
  return fallback;
}

export default function Downloads() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/orders/my-orders");
      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.orders)
          ? response.data.orders
          : [];
      setOrders(data.filter((order) =>
        order.payment_status === "paid" && order.download_access === true
      ));
    } catch (err) {
      console.error("Failed to load downloads:", err);
      setError(await getApiError(err, "Unable to load your downloads."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleDownload = async (order) => {
    if (downloading) return;
    setDownloading(order.id);
    setError("");
    try {
      const response = await api.get(`/orders/${order.id}/download`, {
        responseType: "blob",
      });
      const blob = response.data;
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("The server returned an empty download.");
      }
      const fallbackName = `${(order.items?.[0]?.title || "digital-product").replace(/[\\/:*?"<>|]/g, "-")}.zip`;
      const filename = getFilename(response.headers?.["content-disposition"], fallbackName);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Download request failed:", {
        url: `/orders/${order.id}/download`,
        status: err.response?.status,
        error: err,
      });
      setError(await getApiError(err, err.message || "Download failed. Please contact support."));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <main className="downloads-page">
      <div className="downloads-container">
        <header className="downloads-header">
          <span>YOUR DIGITAL LIBRARY</span>
          <h1>My Downloads</h1>
          <p>Access and download your purchased digital products.</p>
        </header>

        {error && <div className="downloads-error" role="alert">{error}</div>}

        {loading ? (
          <div className="downloads-loading">Loading your downloads...</div>
        ) : orders.length === 0 ? (
          <div className="downloads-empty">
            <h2>No downloads available yet</h2>
            <p>Approved purchases and free products will appear here.</p>
            <button type="button" onClick={loadOrders}>Refresh downloads</button>
          </div>
        ) : (
          <div className="downloads-grid">
            {orders.map((order) => (
              <article className="download-card" key={order.id}>
                <div className="download-card-content">
                  <h2>{order.items?.[0]?.title || "Digital Product"}</h2>
                  <p className="download-order-number">Order: {order.order_number || order.id}</p>
                  <span className="download-status">✓ Payment Approved</span>
                </div>
                <button
                  type="button"
                  className="download-button"
                  disabled={downloading !== null}
                  onClick={() => handleDownload(order)}
                >
                  {downloading === order.id ? "Preparing Download..." : "↓ Download Product"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
