import axios from "axios";
import keycloak from "../keycloak";

const api = axios.create({
  baseURL: "http://secureai.local/api",
});

api.interceptors.request.use(async (config) => {
  try {
    await keycloak.updateToken(30);
  } catch {
    // Token refresh failed — will be caught by response interceptor
  }
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshed = await keycloak.updateToken(0);
        if (refreshed && keycloak.token) {
          error.config.headers.Authorization = `Bearer ${keycloak.token}`;
          return api.request(error.config);
        }
      } catch {
        // Refresh failed — redirect to portal
      }
      window.location.href = "/portal";
      return new Promise(() => {});
    }
    return Promise.reject(error);
  }
);

export default api;
