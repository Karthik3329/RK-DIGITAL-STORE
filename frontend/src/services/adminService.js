import api from "./api";

// =========================================================
// DASHBOARD
// =========================================================

export const getAdminDashboard = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};


// =========================================================
// ORDERS
// =========================================================

export const getAdminOrders = async (params = {}) => {
  const response = await api.get(
    "/admin/orders",
    { params }
  );

  return response.data;
};


export const getAdminOrder = async (orderId) => {
  const response = await api.get(
    `/admin/orders/${orderId}`
  );

  return response.data;
};


export const approvePayment = async (orderId) => {
  const response = await api.put(
    `/admin/orders/${orderId}/approve-payment`
  );

  return response.data;
};


export const rejectPayment = async (
  orderId,
  reason
) => {
  const response = await api.put(
    `/admin/orders/${orderId}/reject-payment`,
    {
      reason,
    }
  );

  return response.data;
};


// =========================================================
// CUSTOMERS
// =========================================================

export const getCustomers = async (search = "") => {
  const response = await api.get(
    "/admin/customers",
    {
      params: {
        search,
      },
    }
  );

  return response.data;
};


export const getCustomer = async (customerId) => {
  const response = await api.get(
    `/admin/customers/${customerId}`
  );

  return response.data;
};


// =========================================================
// ANALYTICS
// =========================================================

export const getAdminAnalytics = async () => {
  const response = await api.get(
    "/admin/analytics"
  );

  return response.data;
};


// =========================================================
// PRODUCTS
// =========================================================

export const getAdminProducts = async () => {
  const response = await api.get(
    "/products/"
  );

  return response.data;
};


export const createProduct = async (
  productData
) => {
  const response = await api.post(
    "/products/",
    productData
  );

  return response.data;
};


export const updateProduct = async (
  productId,
  productData
) => {
  const response = await api.put(
    `/products/${productId}`,
    productData
  );

  return response.data;
};


export const deleteProduct = async (
  productId
) => {
  const response = await api.delete(
    `/products/${productId}`
  );

  return response.data;
};