import axiosClient from "./axiosClient";

const API_BASE = "http://localhost:3000/api";

const userApi = {
  getAll: () => axiosClient.get(`${API_BASE}/users`),
  getById: (id) => axiosClient.get(`${API_BASE}/users/${id}`),
  create: (userData) => axiosClient.post(`${API_BASE}/users`, userData),
  update: (id, userData) => axiosClient.put(`${API_BASE}/users/${id}`, userData),
  delete: (id) => axiosClient.delete(`${API_BASE}/users/${id}`),
  
  // Profile methods (require authentication)
  getProfile: () => axiosClient.get(`${API_BASE}/users/profile/me`),
  updateProfile: (userData) => axiosClient.put(`${API_BASE}/users/profile/me`, userData),
  changePassword: (passwordData) => axiosClient.put(`${API_BASE}/users/profile/change-password`, passwordData),
};

export default userApi;
