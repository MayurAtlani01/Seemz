import API from "./api";

const getWishlist = async () => {
  const response = await API.get("/wishlist/get");
  return response.data;
};

const addToWishlist = async (productId) => {
  const response = await API.post("/wishlist/add", { productId });
  return response.data;
};

const removeFromWishlist = async (productId) => {
  const response = await API.delete(`/wishlist/remove/${productId}`);
  return response.data;
};

export {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
