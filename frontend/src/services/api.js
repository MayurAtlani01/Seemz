import axios from "axios";

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    try {
      sessionStorage.setItem("seemz_auth_token", token);
    } catch {}
  } else {
    try {
      sessionStorage.removeItem("seemz_auth_token");
    } catch {}
  }
};

export const getAuthToken = () => {
  if (authToken) return authToken;
  try {
    return sessionStorage.getItem("seemz_auth_token");
  } catch {
    return null;
  }
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

API.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;