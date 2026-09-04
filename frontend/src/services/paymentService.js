import api from "./api";

export const createRazorpayOrder = async (orderId) => {
  const response = await api.post(
    "/payments/create-order",
    {
      order_id: orderId,
    }
  );

  return response.data;
};

export const verifyRazorpayPayment = async (paymentData) => {
  const response = await api.post(
    "/payments/verify",
    paymentData
  );

  return response.data;
};