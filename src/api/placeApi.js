import axios from "axios";
const API_BASE = "https://walkingguide.onrender.com/api/places";

const placeApi = {
  getAll: () => axios.get(API_BASE),
  getById: (id) => axios.get(`${API_BASE}/${id}`),
  searchByCity: (city) => axios.get(`${API_BASE}/search?city=${encodeURIComponent(city)}`),
  create: (data) => axios.post(API_BASE, data),
};

export default placeApi;
