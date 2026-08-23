import API from "./api";

const getProfile = async () => {
  const response = await API.get("/profile/profile");
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await API.put("/profile/update", profileData);
  return response.data;
};

export {
  getProfile,
  updateProfile,
};
