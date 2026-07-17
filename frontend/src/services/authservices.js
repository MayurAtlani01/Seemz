import API from "./api";

const registerUser = async (userData) => {
  const response = await API.post("/auth/register", userData);
  return response.data;
};

const loginUser = async (userData) => {
  const response = await API.post("/auth/login", userData);
  return response.data;
};


export {loginUser, registerUser}