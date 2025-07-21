import axios from "axios";
const API_BASE = "https://walkingguide.onrender.com/api/articles";

const articleApi = {
  getAll: () => axios.get(API_BASE),
  getById: (id) => axios.get(`${API_BASE}/${id}`),
  create: (articleData) => axios.post(API_BASE, articleData),
  update: (id, articleData) => axios.put(`${API_BASE}/${id}`, articleData),
  delete: (id) => axios.delete(`${API_BASE}/${id}`),
};

export default articleApi;
