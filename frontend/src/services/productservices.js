import API from "./api";

const getAllProducts = async (params = {}) => {
  const response = await API.get("/product/get", { params });
  return response.data;
};

const getProductById = async (id) => {
  const response = await API.get(`/product/${id}`);
  return response.data;
};

export {
  getAllProducts,
  getProductById,
};
