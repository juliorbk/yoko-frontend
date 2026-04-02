import axios from "axios";

const api = axios.create({
  // URL de producción en Render
  baseURL: "https://3759-135-136-5-108.ngrok-free.app/api",
});

// Interceptor para inyectar el Token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("yoko_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

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
