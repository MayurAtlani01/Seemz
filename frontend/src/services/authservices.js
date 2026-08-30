import API from "./api";

const registerUser = async (userData) => {
  const response = await API.post("/auth/register", userData);
  return response.data;
};

const loginUser = async (userData) => {
  const response = await API.post("/auth/login", userData);
  return response.data;
};

const forgotPassword = async (emailData) => {
  const response = await API.post("/auth/forgot-password", emailData);
  return response.data;
};

const resetPassword = async (resetData) => {
  const response = await API.post("/auth/reset-password", resetData);
  return response.data;
};

const verifyRegisterOTP = async (email, otp) => {
  const response = await API.post("/auth/verify-register-otp", { email, otp });
  return response.data;
};

const resendRegisterOTP = async (email) => {
  const response = await API.post("/auth/resend-register-otp", { email });
  return response.data;
};

export {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyRegisterOTP,
  resendRegisterOTP,
};