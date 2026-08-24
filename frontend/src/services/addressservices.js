import API from "./api";

const getAddresses = async () => {
  const response = await API.get("/address/get");
  return response.data;
};

const addAddress = async (addressData) => {
  const response = await API.post("/address/add", addressData);
  return response.data;
};

const updateAddress = async (id, addressData) => {
  const response = await API.put(`/address/update/${id}`, addressData);
  return response.data;
};

const deleteAddress = async (id) => {
  const response = await API.delete(`/address/remove/${id}`);
  return response.data;
};

export {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
};
