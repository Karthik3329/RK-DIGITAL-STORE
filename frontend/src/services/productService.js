import api from "./api";

export const getProducts = async (params = {}) => {
  const response = await api.get("/products/", {
    params,
  });

  return response.data;
};

export const getFeaturedProducts = async () => {
  const response = await api.get("/products/featured");

  return response.data;
};

export const getProductById = async (productId) => {
  const response = await api.get(`/products/${productId}`);

  return response.data;
};

export const getProductBySlug = async (slug) => {
  const response = await api.get(`/products/slug/${slug}`);

  return response.data;
};