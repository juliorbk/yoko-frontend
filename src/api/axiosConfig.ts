import axios from "axios";

const api = axios.create({
  baseURL: "https://c6d2-135-136-5-113.ngrok-free.app/api",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420", // 🚨 ESTO ES OBLIGATORIO PARA NGROK
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("yoko_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores globales (como el Rate Limit)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      console.error("Rate limit excedido: ¡Vas muy rápido, espera un minuto!");
      // Aquí podrías disparar un toast o alerta avisando que esperen un minuto
    }
    return Promise.reject(error);
  },
);

export default api;
