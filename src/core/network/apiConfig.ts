export const ApiConfig = {
  // Lấy URL từ file .env (giống cách Mobile dùng config.backendUrl)
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5276',
};
