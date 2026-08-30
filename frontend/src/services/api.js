import axios from "axios";

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    try {
      localStorage.setItem("seemz_auth_token", token);
      sessionStorage.setItem("seemz_auth_token", token);
    } catch {}
  } else {
    try {
      localStorage.removeItem("seemz_auth_token");
      sessionStorage.removeItem("seemz_auth_token");
    } catch {}
  }
};

export const getAuthToken = () => {
  if (authToken) return authToken;
  try {
    const local = localStorage.getItem("seemz_auth_token");
    if (local) {
      authToken = local;
      return local;
    }
    const session = sessionStorage.getItem("seemz_auth_token");
    if (session) {
      authToken = session;
      return session;
    }
    return null;
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
    if (token) {
      if (config.headers?.set) {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;