import API from "./api";

const getProfile = async () => {
  const response = await API.get("/profile/profile");
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await API.put("/profile/update", profileData);
  return response.data;
};

const uploadAvatar = async (formData) => {
  const response = await API.post("/profile/avatar", formData);
  return response.data;
};


const removeAvatar = async () => {
  const response = await API.delete("/profile/avatar");
  return response.data;
};

export {
  getProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
};

