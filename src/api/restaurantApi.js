import axios from 'axios';

const restaurantApi = {
  searchByCity: (city) => axios.get(`http://localhost:3000/api/restaurants/search?city=${encodeURIComponent(city)}`),
  // Add other methods as needed
};

export default restaurantApi; 