import axios from "axios";

const api = axios.create({
  // URL de LocalTunnel
  baseURL: "https://neat-chairs-allow.loca.lt/api", //Cambiar cada que se abra el proyecto de nuevo el LocalTunnel
  headers: {
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("yoko_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      console.error("Rate limit excedido: ¡Vas muy rápido, espera un minuto!");
    }
    return Promise.reject(error);
  },
);

export default api;
