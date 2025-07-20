import axiosClient from "./axiosClient";

const API_BASE = "/tours";
const API_LIKE = "/tour-likes";
const API_RATING = "/tour-ratings";

const tourApi = {
  getAll: (params = { role: 'ADMIN' }) => axiosClient.get(API_BASE, { params }),
  getById: (id) => axiosClient.get(`${API_BASE}/${id}`),
  getUserTours: (userId) => axiosClient.get(`${API_BASE}/user/${userId}`),
  cloneTour: (tourId, userId) => axiosClient.post(`${API_BASE}/${tourId}/clone`, { user_id: userId }),
  like: (tourId) => axiosClient.post(`${API_LIKE}/like`, { tour_id: tourId }),
  unlike: (tourId) => axiosClient.post(`${API_LIKE}/unlike`, { tour_id: tourId }),
  isLiked: (tourId) => axiosClient.get(`${API_LIKE}/is-liked`, { params: { tour_id: tourId } }),
  countLikes: (tourId) => axiosClient.get(`${API_LIKE}/count`, { params: { tour_id: tourId } }),
  rate: (tourId, rating) => axiosClient.post(`${API_RATING}/rate`, { tour_id: tourId, rating }),
  getAverageRating: (tourId) => axiosClient.get(`${API_RATING}/average`, { params: { tour_id: tourId } }),
  getUserRating: (tourId) => axiosClient.get(`${API_RATING}/user`, { params: { tour_id: tourId } }),
  bookTour: (tourId, userId, startDate, endDate, spots) =>
    axiosClient.post(`${API_BASE}/${tourId}/book`, {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      spots,
    }),
  getUserBookedTours: (userId) => axiosClient.get(`/bookings/user/${userId}`),
};

export default tourApi;
