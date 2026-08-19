const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_URLS = {
  local: "http://localhost:4000/api",
  production: "https://invensaas-backend.onrender.com/api",
};

const API_URL = isLocal ? API_URLS.local : API_URLS.production;

console.log(`🌍 Entorno: ${isLocal ? "LOCAL" : "PRODUCCIÓN"}`);
console.log(`🔗 API_URL: ${API_URL}`);

window.API_URL = API_URL;
window.IS_LOCAL = isLocal;
