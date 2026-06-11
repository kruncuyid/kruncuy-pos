import axios from "axios";
import { clearSession, getStoredToken, setToken } from "../auth/session";

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

function getDefaultApiBaseURL() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  return "http://localhost:5000/api";
}

const api = axios.create({
  baseURL: getDefaultApiBaseURL(),
  withCredentials: true, // Untuk mengirim httpOnly cookie refresh token
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — refresh token on 401 + human-readable errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error has no response (network error, etc), make it human-readable
    if (!error.response) {
      const humanError = new Error("Gagal terhubung ke server. Periksa koneksi internet.");
      humanError.statusCode = 0;
      humanError.originalError = error;
      return Promise.reject(humanError);
    }

    // Make error messages human-readable
    const serverMsg = error.response?.data?.message || error.response?.data?.error || "";
    if (serverMsg && !serverMsg.startsWith("Gagal") && !serverMsg.startsWith("Tidak")) {
      // Keep the server message if it's already user-friendly
      // But wrap technical errors
      const technicalPatterns = ["Cannot read property", "TypeError", "ReferenceError", "undefined", "null", "prisma", "database"];
      const isTechnical = technicalPatterns.some(p => serverMsg.toLowerCase().includes(p.toLowerCase()));
      if (isTechnical) {
        error.response.data.message = "Gagal memproses permintaan. Silakan coba lagi.";
      }
    }

    // Don't intercept refresh endpoint itself
    if (originalRequest?.url?.includes("/auth/refresh")) {
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
      return Promise.reject(error);
    }

    // Only attempt refresh on 401 and not already retried
    if (error?.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = response.data?.data?.token;
      if (newToken) {
        setToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      throw new Error("No token in refresh response");
    } catch (refreshError) {
      processQueue(refreshError);
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
