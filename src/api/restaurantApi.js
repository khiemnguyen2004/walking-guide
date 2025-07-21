import axios from 'axios';

const restaurantApi = {
  searchByCity: (city) => axios.get(`https://walkingguide.onrender.com/api/restaurants/search?city=${encodeURIComponent(city)}`),
  // Add other methods as needed
};

export default restaurantApi; 