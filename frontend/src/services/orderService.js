import api from "./api";

// ============================================================
// CREATE ORDER
// ============================================================

export const createOrder = async (orderData) => {
  const response = await api.post("/orders/", orderData);
  return response.data;
};

// ============================================================
// GET MY ORDERS
// ============================================================

export const getMyOrders = async () => {
  const response = await api.get("/orders/my-orders");
  return response.data;
};

// ============================================================
// GET SINGLE ORDER
// ============================================================

export const getMyOrder = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

// ============================================================
// DOWNLOAD ORDER FILE
// ============================================================

export const downloadOrderFile = async (orderId) => {
  const response = await api.get(
    `/orders/${orderId}/download`,
    {
      responseType: "blob",
    }
  );

  return response;
};

// ============================================================
// DELETE / CANCEL ORDER
// Only add/use this if your backend provides the endpoint.
// ============================================================

export const deleteOrder = async (orderId) => {
  const response = await api.delete(
    `/orders/${orderId}`
  );

  return response.data;
};