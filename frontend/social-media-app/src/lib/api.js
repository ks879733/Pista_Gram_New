import axios from "axios";

export const API_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// Add the access token to every protected request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// If the access token expires, ask the existing backend for a new one.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/user/refresh") &&
      !originalRequest.url?.includes("/user/login")
    ) {
      originalRequest._retry = true;

      try {
        const response = await api.post("/user/refresh");
        localStorage.setItem("accessToken", response.data);
        originalRequest.headers.Authorization = `Bearer ${response.data}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
