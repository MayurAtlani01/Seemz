import API from "./api";

const getAllProducts = async (params = {}) => {
  const response = await API.get("/product/get", { params });
  return response.data;
};

const getProductById = async (id) => {
  const response = await API.get(`/product/${id}`);
  return response.data;
};

const createProduct = async (productData) => {
  const response = await API.post("/product/create", productData);
  return response.data;
};

const updateProduct = async (id, productData) => {
  const response = await API.put(`/product/${id}`, productData);
  return response.data;
};

const deleteProduct = async (id) => {
  const response = await API.delete(`/product/${id}`);
  return response.data;
};

const uploadProductImages = async (formData) => {
  const response = await API.post("/product/upload", formData);
  return response.data;
};

export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
};
