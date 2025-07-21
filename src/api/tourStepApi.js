import axios from "axios";
const API_BASE = "https://walkingguide.onrender.com/api";

const tourStepApi = {
  getByTourId: (tourId) => axios.get(`${API_BASE}/tour-steps/by-tour/${tourId}`),
};

export default tourStepApi;
