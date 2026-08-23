import API from "./api";

const getCart = async () => {
  const response = await API.get("/cart/get");
  return response.data;
};

const addToCart = async (productId, quantity = 1, size = "") => {
  const response = await API.post("/cart/add", { productId, quantity, size });
  return response.data;
};

const updateCart = async (productId, quantity, size = "") => {
  const response = await API.put("/cart/update", { productId, quantity, size });
  return response.data;
};

const removeFromCart = async (productId) => {
  const response = await API.delete(`/cart/remove/${productId}`);
  return response.data;
};

const clearCart = async () => {
  const response = await API.delete("/cart/clear");
  return response.data;
};

export {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
};
