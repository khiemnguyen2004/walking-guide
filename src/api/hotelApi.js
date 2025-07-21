import axiosClient from './axiosClient';
import axios from 'axios';

const hotelApi = {
  bookHotel: (data) => axiosClient.post('/hotels/hotel-bookings', data),
  getUserHotelBookings: (userId) => axiosClient.get(`/hotels/hotel-bookings/user/${userId}`),
  searchByCity: (city) => axios.get(`https://walkingguide.onrender.com/api/hotels/search?city=${encodeURIComponent(city)}`),
};

export default hotelApi; 