import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const initialForm = {
  code: "",
  discount_type: "percentage",
  discount_value: "",
  minimum_order: "",
  maximum_discount: "",
  usage_limit: "",
  expires_at: "",
  active: true,
};

function AdminCoupons() {
  const [coupons, setCoupons] =
    useState([]);

  const [form, setForm] =
    useState(initialForm);

  const [showForm, setShowForm] =
    useState(false);

  const [editingCoupon, setEditingCoupon] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  // ==========================================
  // LOAD COUPONS
  // ==========================================

  const loadCoupons = async () => {
    try {
      setLoading(true);

      const response =
        await api.get(
          "/admin/coupons"
        );

      setCoupons(
        response.data.coupons || []
      );

    } catch (error) {
      console.error(
        "Unable to load coupons:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Unable to load coupons."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
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

  // ==========================================
  // OPEN CREATE FORM
  // ==========================================

  const openCreateForm = () => {
    setEditingCoupon(null);

    setForm({
      ...initialForm,
    });

    setShowForm(true);
  };

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================

  const openEditForm = (coupon) => {
    setEditingCoupon(coupon);

    let expiry = coupon.expires_at || "";

    // Convert ISO date to datetime-local format
    if (expiry) {
      try {
        const date =
          new Date(expiry);

        if (!Number.isNaN(date.getTime())) {
          const offset =
            date.getTimezoneOffset();

          const localDate =
            new Date(
              date.getTime() -
                offset * 60000
            );

          expiry =
            localDate
              .toISOString()
              .slice(0, 16);
        }
      } catch {
        expiry = "";
      }
    }

    setForm({
      code:
        coupon.code || "",

      discount_type:
        coupon.discount_type ||
        "percentage",

      discount_value:
        coupon.discount_value ??
        "",

      minimum_order:
        coupon.minimum_order ??
        "",

      maximum_discount:
        coupon.maximum_discount ??
        "",

      usage_limit:
        coupon.usage_limit ??
        "",

      expires_at:
        expiry,

      active:
        coupon.active !== false,
    });

    setShowForm(true);
  };

  // ==========================================
  // CLOSE FORM
  // ==========================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingCoupon(null);

    setForm({
      ...initialForm,
    });
  };

  // ==========================================
  // SAVE COUPON
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = {
        code:
          form.code
            .trim()
            .toUpperCase(),

        discount_type:
          form.discount_type,

        discount_value:
          Number(
            form.discount_value
          ),

        minimum_order:
          Number(
            form.minimum_order || 0
          ),

        maximum_discount:
          form.maximum_discount
            ? Number(
                form.maximum_discount
              )
            : null,

        usage_limit:
          form.usage_limit
            ? Number(
                form.usage_limit
              )
            : null,

        expires_at:
          form.expires_at || null,

        active:
          Boolean(form.active),
      };

      // ======================================
      // UPDATE
      // ======================================

      if (editingCoupon) {
        await api.put(
          `/admin/coupons/${editingCoupon.id}`,
          payload
        );

        alert(
          "Coupon updated successfully."
        );

      }

      // ======================================
      // CREATE
      // ======================================

      else {
        await api.post(
          "/admin/coupons",
          payload
        );

        alert(
          "Coupon created successfully."
        );
      }

      closeForm();

      await loadCoupons();

    } catch (error) {
      console.error(
        "Coupon save error:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Unable to save coupon."
      );

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const deleteCoupon = async (id) => {
    if (
      !window.confirm(
        "Delete this coupon?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/admin/coupons/${id}`
      );

      await loadCoupons();

    } catch (error) {
      console.error(
        "Delete coupon error:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Unable to delete coupon."
      );
    }
  };

  return (
    <div className="admin-page">

      {/* ====================================
          HEADER
      ==================================== */}

      <div className="admin-page-heading">

        <div>
          <span>
            DISCOUNTS
          </span>

          <h2>
            Coupons
          </h2>

          <p>
            Create and manage discount
            coupons.
          </p>
        </div>

        <button
          className="admin-primary-button"
          onClick={
            showForm
              ? closeForm
              : openCreateForm
          }
        >
          {showForm
            ? "✕ Close"
            : "+ Create Coupon"}
        </button>

      </div>

      {/* ====================================
          CREATE / EDIT FORM
      ==================================== */}

      {showForm && (
        <div className="admin-section-card">

          <div className="admin-section-header">

            <div>
              <h3>
                {editingCoupon
                  ? "Edit Coupon"
                  : "Create Coupon"}
              </h3>

              <p>
                {editingCoupon
                  ? "Update your discount coupon."
                  : "Configure your discount."}
              </p>
            </div>

          </div>

          <form
            className="admin-form"
            onSubmit={
              handleSubmit
            }
          >

            <div className="admin-form-grid">

              {/* CODE */}

              <div className="admin-form-group">

                <label>
                  Coupon Code
                </label>

                <input
                  name="code"
                  value={
                    form.code
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="SAVE20"
                  required
                />

              </div>

              {/* TYPE */}

              <div className="admin-form-group">

                <label>
                  Discount Type
                </label>

                <select
                  name="discount_type"
                  value={
                    form.discount_type
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="percentage">
                    Percentage
                  </option>

                  <option value="fixed">
                    Fixed Amount
                  </option>

                </select>

              </div>

              {/* DISCOUNT */}

              <div className="admin-form-group">

                <label>
                  Discount
                </label>

                <input
                  type="number"
                  name="discount_value"
                  value={
                    form.discount_value
                  }
                  onChange={
                    handleChange
                  }
                  min="0"
                  step="0.01"
                  required
                />

              </div>

              {/* MINIMUM */}

              <div className="admin-form-group">

                <label>
                  Minimum Order
                </label>

                <input
                  type="number"
                  name="minimum_order"
                  value={
                    form.minimum_order
                  }
                  onChange={
                    handleChange
                  }
                  min="0"
                  step="0.01"
                />

              </div>

              {/* MAXIMUM */}

              <div className="admin-form-group">

                <label>
                  Maximum Discount
                </label>

                <input
                  type="number"
                  name="maximum_discount"
                  value={
                    form.maximum_discount
                  }
                  onChange={
                    handleChange
                  }
                  min="0"
                  step="0.01"
                />

              </div>

              {/* USAGE */}

              <div className="admin-form-group">

                <label>
                  Usage Limit
                </label>

                <input
                  type="number"
                  name="usage_limit"
                  value={
                    form.usage_limit
                  }
                  onChange={
                    handleChange
                  }
                  min="1"
                />

              </div>

              {/* EXPIRY */}

              <div className="admin-form-group">

                <label>
                  Expiry
                </label>

                <input
                  type="datetime-local"
                  name="expires_at"
                  value={
                    form.expires_at
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* ACTIVE */}

              <label className="admin-checkbox">

                <input
                  type="checkbox"
                  name="active"
                  checked={
                    form.active
                  }
                  onChange={
                    handleChange
                  }
                />

                Active

              </label>

            </div>

            {/* BUTTONS */}

            <div className="admin-modal-actions">

              <button
                type="button"
                className="admin-secondary-button"
                onClick={
                  closeForm
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingCoupon
                    ? "Update Coupon"
                    : "Create Coupon"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ====================================
          COUPON TABLE
      ==================================== */}

      <div className="admin-section-card">

        <div className="admin-table-wrapper">

          <table className="admin-table">

            <thead>

              <tr>

                <th>
                  CODE
                </th>

                <th>
                  DISCOUNT
                </th>

                <th>
                  MINIMUM
                </th>

                <th>
                  USAGE
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  ACTIONS
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    Loading coupons...
                  </td>

                </tr>

              ) : coupons.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    No coupons found.
                  </td>

                </tr>

              ) : (

                coupons.map(
                  (coupon) => (

                    <tr
                      key={
                        coupon.id
                      }
                    >

                      {/* CODE */}

                      <td>

                        <strong>
                          {
                            coupon.code
                          }
                        </strong>

                      </td>

                      {/* DISCOUNT */}

                      <td>

                        {coupon.discount_type ===
                        "percentage"
                          ? `${coupon.discount_value}%`
                          : `₹${Number(
                              coupon.discount_value ||
                                0
                            ).toFixed(2)}`}

                      </td>

                      {/* MINIMUM */}

                      <td>

                        ₹
                        {Number(
                          coupon.minimum_order ||
                            0
                        ).toFixed(2)}

                      </td>

                      {/* USAGE */}

                      <td>

                        {
                          coupon.used_count
                        }

                        {" / "}

                        {
                          coupon.usage_limit ||
                          "∞"
                        }

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`status-badge ${
                            coupon.active
                              ? "active"
                              : "inactive"
                          }`}
                        >

                          {coupon.active
                            ? "Active"
                            : "Inactive"}

                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div
                          className="admin-table-actions"
                        >

                          <button
                            type="button"
                            className="table-edit-button"
                            onClick={() =>
                              openEditForm(
                                coupon
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="table-delete-button"
                            onClick={() =>
                              deleteCoupon(
                                coupon.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default AdminCoupons;