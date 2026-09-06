import {
  useEffect,
  useState,
} from "react";

import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/adminService";

const emptyProduct = {
  product_id: "",
  title: "",
  slug: "",
  short_description: "",
  description: "",
  price: "",
  original_price: "",
  image: "",
  file_name: "",
  file_path: "",
  product_type: "digital",
  tags: "",
  featured: false,
  status: "active",
};


function AdminProducts() {

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [form, setForm] =
    useState(emptyProduct);

  const loadProducts = async () => {

    try {

      setLoading(true);

      const result =
        await getAdminProducts();

      setProducts(
        Array.isArray(result)
          ? result
          : result.products || []
      );

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {
    loadProducts();
  }, []);


  const openAdd = () => {

    setEditingProduct(null);
    setForm(emptyProduct);
    setShowModal(true);

  };


  const openEdit = (product) => {

    setEditingProduct(product);

    setForm({
      product_id:
        product.product_id || "",
      title:
        product.title || "",
      slug:
        product.slug || "",
      short_description:
        product.short_description || "",
      description:
        product.description || "",
      price:
        product.price ?? "",
      original_price:
        product.original_price ?? "",
      image:
        product.image || "",
      file_name:
        product.file_name || "",
      file_path:
        product.file_path || "",
      product_type:
        product.product_type ||
        "digital",
      tags:
        Array.isArray(product.tags)
          ? product.tags.join(", ")
          : "",
      featured:
        product.featured || false,
      status:
        product.status || "active",
    });

    setShowModal(true);

  };


  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

  };


  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    const productData = {
      product_id:
        form.product_id.trim(),

      title:
        form.title.trim(),

      slug:
        form.slug.trim(),

      short_description:
        form.short_description.trim(),

      description:
        form.description.trim(),

      price:
        Number(form.price),

      original_price:
        form.original_price
          ? Number(
              form.original_price
            )
          : null,

      image:
        form.image.trim() || null,

      file_name:
        form.file_name.trim() ||
        null,

      file_path:
        form.file_path.trim() ||
        null,

      product_type:
        form.product_type,

      tags:
        form.tags
          .split(",")
          .map((tag) =>
            tag.trim()
          )
          .filter(Boolean),

      featured:
        form.featured,

      status:
        form.status,
    };


    try {

      if (editingProduct) {

        await updateProduct(
          editingProduct.id,
          productData
        );

      } else {

        await createProduct(
          productData
        );

      }

      setShowModal(false);

      await loadProducts();

    } catch (error) {

      alert(
        error.response?.data?.detail ||
        "Unable to save product."
      );

    }

  };


  const handleDelete = async (
    product
  ) => {

    const confirmed =
      window.confirm(
        `Delete "${product.title}"?`
      );

    if (!confirmed) return;

    try {

      await deleteProduct(
        product.id
      );

      await loadProducts();

    } catch (error) {

      alert(
        error.response?.data?.detail ||
        "Unable to delete product."
      );

    }

  };


  return (
    <div className="admin-page">

      <div className="admin-page-heading">

        <div>

          <span>
            CATALOG
          </span>

          <h2>
            Products
          </h2>

          <p>
            Manage your digital products.
          </p>

        </div>


        <button
          className="admin-primary-button"
          onClick={openAdd}
        >
          + Add Product
        </button>

      </div>


      <div className="admin-section-card">

        {loading ? (

          <div className="admin-loading">
            Loading products...
          </div>

        ) : (

          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>PRODUCT</th>
                  <th>PRICE</th>
                  <th>STATUS</th>
                  <th>FEATURED</th>
                  <th>ACTIONS</th>
                </tr>

              </thead>


              <tbody>

                {products.map(
                  (product) => (

                    <tr key={product.id}>

                      <td>
                        <strong>
                          {
                            product.product_id
                          }
                        </strong>
                      </td>

                      <td>

                        <div className="product-table-info">

                          {product.image && (
                            <img
                              src={
                                product.image
                              }
                              alt=""
                            />
                          )}

                          <div>

                            <strong>
                              {
                                product.title
                              }
                            </strong>

                            <span>
                              {
                                product.product_type
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>
                        ₹
                        {Number(
                          product.price || 0
                        ).toFixed(2)}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${product.status}`}
                        >
                          {
                            product.status
                          }
                        </span>
                      </td>

                      <td>
                        {product.featured
                          ? "⭐"
                          : "—"}
                      </td>

                      <td>

                        <div className="table-actions">

                          <button
                            className="table-action-button"
                            onClick={() =>
                              openEdit(
                                product
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="table-delete-button"
                            onClick={() =>
                              handleDelete(
                                product
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {showModal && (

        <div className="admin-modal-overlay">

          <div className="admin-modal product-modal">

            <div className="admin-modal-header">

              <div>

                <span>
                  CATALOG
                </span>

                <h3>
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h3>

              </div>

              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="admin-form"
            >

              <div className="admin-form-grid">

                <div className="admin-form-group">

                  <label>
                    Product ID
                  </label>

                  <input
                    name="product_id"
                    value={
                      form.product_id
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="TP-001"
                    required
                  />

                </div>


                <div className="admin-form-group">

                  <label>
                    Title
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={
                      handleChange
                    }
                    placeholder="Premium Portfolio Website"
                    required
                  />

                </div>


                <div className="admin-form-group">

                  <label>
                    Slug
                  </label>

                  <input
                    name="slug"
                    value={form.slug}
                    onChange={
                      handleChange
                    }
                    placeholder="premium-portfolio-website"
                    required
                  />

                </div>


                <div className="admin-form-group">

                  <label>
                    Product Type
                  </label>

                  <select
                    name="product_type"
                    value={
                      form.product_type
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="digital">
                      Digital
                    </option>

                    <option value="template">
                      Template
                    </option>

                    <option value="ebook">
                      Ebook
                    </option>

                    <option value="course">
                      Course
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>


                <div className="admin-form-group">

                  <label>
                    Price
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="0.01"
                    required
                  />

                </div>


                <div className="admin-form-group">

                  <label>
                    Original Price
                  </label>

                  <input
                    type="number"
                    name="original_price"
                    value={
                      form.original_price
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="0.01"
                  />

                </div>


                <div className="admin-form-group admin-form-full">

                  <label>
                    Image URL
                  </label>

                  <input
                    name="image"
                    value={form.image}
                    onChange={
                      handleChange
                    }
                    placeholder="https://..."
                  />

                </div>


                <div className="admin-form-group admin-form-full">

                  <label>
                    Short Description
                  </label>

                  <input
                    name="short_description"
                    value={
                      form.short_description
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="admin-form-group admin-form-full">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    rows="5"
                    required
                  />

                </div>


                <div className="admin-form-group">

                  <label>
                    Digital File Name
                  </label>

                  <input
                    name="file_name"
                    value={
                      form.file_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="portfolio.zip"
                  />

                </div>


                <div className="admin-form-group">

                  <label>
                    Digital File Path
                  </label>

                  <input
                    name="file_path"
                    value={
                      form.file_path
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="storage/products/..."
                  />

                </div>


                <div className="admin-form-group admin-form-full">

                  <label>
                    Tags
                  </label>

                  <input
                    name="tags"
                    value={form.tags}
                    onChange={
                      handleChange
                    }
                    placeholder="portfolio, html, css, react"
                  />

                </div>


                <div className="admin-form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={
                      handleChange
                    }
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="draft">
                      Draft
                    </option>

                    <option value="upcoming">
                      Upcoming
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="archived">
                      Archived
                    </option>

                  </select>

                </div>


                <label className="admin-checkbox">

                  <input
                    type="checkbox"
                    name="featured"
                    checked={
                      form.featured
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span>
                    Featured Product
                  </span>

                </label>

              </div>


              <div className="admin-modal-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                >
                  {editingProduct
                    ? "Save Changes"
                    : "Create Product"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminProducts;