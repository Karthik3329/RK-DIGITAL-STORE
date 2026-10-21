
import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  "pdf", "zip", "png", "jpg",
  "jpeg", "webp", "mp3", "mp4",
];

function normalizeProducts(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getProductId(product) {
  return String(product.id || product._id || "");
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function AdminDownloads() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);
  const uploadSectionRef = useRef(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);

    try {
      // This endpoint currently lists active products.
      const response = await api.get("/products/");
      const items = normalizeProducts(response.data);

      setProducts(items);

      if (!Array.isArray(response.data) &&
          !Array.isArray(response.data?.products) &&
          !Array.isArray(response.data?.items) &&
          !Array.isArray(response.data?.data)) {
        setError(
          "Unexpected products API response. Check the browser Network tab."
        );
      }
    } catch (err) {
      console.error("Products request failed:", err);

      const status = err.response?.status;
      setError(
        status
          ? `Unable to load products (HTTP ${status}).`
          : "Unable to connect to the products API."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const selectedProduct = products.find(
    (product) => getProductId(product) === selectedProductId
  );

  const filteredProducts = products.filter((product) =>
    String(product.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const assignedFiles = products.filter(
    (product) => Boolean(product.file_path)
  ).length;

  const missingFiles = products.length - assignedFiles;

  function chooseFile(file) {
    setError("");
    setSuccess("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null);
      setError("Unsupported file type.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError("File exceeds the 100 MB limit.");
      return;
    }

    setSelectedFile(file);
  }

  function clearFile() {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function selectProductForUpload(product) {
    setSelectedProductId(getProductId(product));
    setError("");
    setSuccess("");

    uploadSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedProductId || !selectedFile) {
      setError("Select a product and file before uploading.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      await api.post(
        `/admin/files/${selectedProductId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(
        `File uploaded successfully for ${
          selectedProduct?.title || "the selected product"
        }.`
      );

      clearFile();
      await loadProducts();
    } catch (err) {
      console.error("File upload failed:", err);

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : `Upload failed${
              err.response?.status
                ? ` (HTTP ${err.response.status})`
                : ""
            }. Verify the admin file upload API.`
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="admin-downloads-page">
      <div className="admin-downloads-header">
        <div>
          <span className="adm-eyebrow">DIGITAL ASSET MANAGEMENT</span>
          <h1>Manage Downloads</h1>
          <p>
            Upload, replace, and organize files linked
            to your store products.
          </p>
        </div>

        <button
          type="button"
          className="adm-refresh-button"
          onClick={loadProducts}
          disabled={loading || uploading}
        >
          ↻ Refresh Products
        </button>
      </div>

      {error && (
        <div className="admin-downloads-message error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-downloads-message success" role="status">
          {success}
        </div>
      )}

      <div className="admin-downloads-stats">
        <div className="admin-download-stat">
          <span>Total Products</span>
          <strong>{products.length}</strong>
        </div>

        <div className="admin-download-stat">
          <span>Files Assigned</span>
          <strong>{assignedFiles}</strong>
        </div>

        <div className="admin-download-stat">
          <span>Files Missing</span>
          <strong>{missingFiles}</strong>
        </div>
      </div>

      <div className="adm-layout">
        <div
          className="admin-downloads-panel"
          ref={uploadSectionRef}
        >
          <div className="admin-downloads-panel-header">
            <h2>Upload Digital File</h2>
            <p>Attach a file to an existing product.</p>
          </div>

          <form className="adm-upload-form" onSubmit={handleUpload}>
            <div className="admin-upload-field">
              <label htmlFor="adm-product">
                Product <span className="adm-required">*</span>
              </label>

              <select
                id="adm-product"
                value={selectedProductId}
                onChange={(event) => {
                  setSelectedProductId(event.target.value);
                  setError("");
                }}
                disabled={loading || uploading}
                required
              >
                <option value="">
                  {loading
                    ? "Loading products..."
                    : products.length
                      ? "Select a product"
                      : "No active products available"}
                </option>

                {products.map((product) => (
                  <option
                    key={getProductId(product)}
                    value={getProductId(product)}
                  >
                    {product.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="adm-product-summary">
                <span className="adm-summary-icon">📦</span>
                <div>
                  <strong>{selectedProduct.title}</strong>
                  <small>
                    {selectedProduct.file_name
                      ? `Current file: ${selectedProduct.file_name}`
                      : "No file assigned"}
                  </small>
                </div>
              </div>
            )}

            <div className="admin-upload-field">
              <label htmlFor="adm-file">
                Digital File <span className="adm-required">*</span>
              </label>

              <div className="adm-file-dropzone">
                <div className="adm-file-icon">⇧</div>

                <strong>
                  {selectedFile
                    ? selectedFile.name
                    : "Choose a file to upload"}
                </strong>

                <p>
                  {selectedFile
                    ? formatSize(selectedFile.size)
                    : "PDF, ZIP, images, audio or video"}
                </p>

                <input
                  ref={fileInputRef}
                  id="adm-file"
                  type="file"
                  accept=".pdf,.zip,.png,.jpg,.jpeg,.webp,.mp3,.mp4"
                  onChange={(event) =>
                    chooseFile(event.target.files?.[0])
                  }
                  disabled={uploading}
                />

                {selectedFile && (
                  <button
                    type="button"
                    className="adm-remove-file"
                    onClick={clearFile}
                    disabled={uploading}
                  >
                    Remove selected file
                  </button>
                )}
              </div>

              <small>
                Maximum 100 MB per file. Uploading to a
                product with an existing file replaces
                its assigned file reference.
              </small>
            </div>

            <button
              className="admin-upload-button adm-submit-button"
              type="submit"
              disabled={
                uploading ||
                !selectedProductId ||
                !selectedFile
              }
            >
              {uploading
                ? "Uploading..."
                : selectedProduct?.file_path
                  ? "↻ Replace Product File"
                  : "↑ Upload Product File"}
            </button>
          </form>
        </div>

        <aside className="adm-help-card">
          <span className="adm-help-icon">🛡️</span>
          <h3>Secure File Uploads</h3>
          <p>
            Digital files are uploaded to your backend
            and assigned to a product.
          </p>

          <div className="adm-help-divider" />

          <h4>Upload checklist</h4>
          <p>① Create the product in Admin Products.</p>
          <p>② Select the product here.</p>
          <p>③ Choose and upload its digital file.</p>

          <div className="adm-help-note">
            Files should be delivered to customers only
            after payment approval.
          </div>
        </aside>
      </div>

      <div className="admin-downloads-panel adm-products-panel">
        <div className="admin-downloads-panel-header adm-list-header">
          <div>
            <h2>Existing Product Files</h2>
            <p>
              {products.length} active products returned by the API
            </p>
          </div>

          <input
            className="adm-search"
            type="search"
            placeholder="Search products..."
            aria-label="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="downloads-loading">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="downloads-empty">
            <strong>No active products returned.</strong>
            <p>
              Check Admin Products. If your products
              are inactive, they will not appear here
              until an admin product-list endpoint is added.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="downloads-empty">
            No products match your search.
          </div>
        ) : (
          <div className="admin-downloads-table-wrap">
            <table className="admin-downloads-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>File Name</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const hasFile = Boolean(product.file_path);

                  return (
                    <tr key={getProductId(product)}>
                      <td>{product.title}</td>

                      <td>{product.file_name || "—"}</td>

                      <td>
                        <span
                          className={`admin-file-status ${
                            hasFile ? "uploaded" : "missing"
                          }`}
                        >
                          {hasFile ? "Assigned" : "Missing"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="adm-row-action"
                          onClick={() =>
                            selectProductForUpload(product)
                          }
                        >
                          {hasFile ? "Replace" : "Upload"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
