import axios from "axios";
const API_BASE = "http://localhost:3000/api";

const tourStepApi = {
  getByTourId: (tourId) => axios.get(`${API_BASE}/tour-steps/by-tour/${tourId}`),
};

export default tourStepApi;
