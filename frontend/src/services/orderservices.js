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

const getAllOrdersAdmin = async () => {
  const response = await API.get("/orders/admin/all");
  return response.data;
};

const cancelOrderAdmin = async (id) => {
  const response = await API.put(`/orders/admin/${id}/cancel`);
  return response.data;
};

const deliverOrderAdmin = async (id) => {
  const response = await API.put(`/orders/admin/${id}/deliver`);
  return response.data;
};

const cancelMyOrder = async (id) => {
  const response = await API.put(`/orders/my/${id}/cancel`);
  return response.data;
};

export {
  getMyOrders,
  getOrderById,
  placeOrder,
  getAllOrdersAdmin,
  cancelOrderAdmin,
  deliverOrderAdmin,
  cancelMyOrder,
};
