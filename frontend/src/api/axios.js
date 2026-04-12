import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10_000,
});

// Token injection — deferred import to avoid blocking if keycloak-js fails to init
api.interceptors.request.use((config) => {
  try {
    const keycloak = window.__keycloak;
    if (keycloak?.authenticated && keycloak.token) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
  } catch {
    // No token available — proceed without auth
  }
  return config;
});

export default api;
