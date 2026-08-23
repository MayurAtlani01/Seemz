import API from "./api";

const getMyOrders = async () => {
  const response = await API.get("/orders/get");
  return response.data;
};

const getOrderById = async (id) => {
  const response = await API.get(`/orders/${id}`);
  return response.data;
};

const placeOrder = async (addressId) => {
  const response = await API.post("/orders/place", { addressId });
  return response.data;
};

export {
  getMyOrders,
  getOrderById,
  placeOrder,
};
