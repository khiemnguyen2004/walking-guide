import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import tourApi from '../../api/tourApi';
import hotelApi from '../../api/hotelApi';
import restaurantApi from '../../api/restaurantApi';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import AuthModal from '../../components/AuthModal.jsx';
import LikeButton from '../../components/LikeButton.jsx';
import RatingStars from '../../components/RatingStars.jsx';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Modal, Button } from 'react-bootstrap';
import hotelIconSvg from '../../assets/hotel-marker.svg';
import restaurantIconSvg from '../../assets/restaurant-marker.svg';

// Component to handle map centering
const MapCenterHandler = ({ places }) => {
  const map = useMap();
  
  useEffect(() => {
    if (places && places.length > 0) {
      if (places.length === 1) {
        // Single place - center on it
        map.setView([parseFloat(places[0].latitude), parseFloat(places[0].longitude)], 14);
      } else {
        // Multiple places - fit bounds
        const bounds = L.latLngBounds(places.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]));
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [places, map]);
  
  return null;
};

const createCustomIcon = (place) => {
  const iconSize = 40;
  const iconAnchor = iconSize / 2;
  if (place.image_url) {
    const imageUrl = place.image_url.startsWith('http') ? place.image_url : `http://localhost:3000${place.image_url}`;
    return new L.DivIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${iconSize}px;
          height: ${iconSize}px;
          border-radius: 50%;
          border: 2px solid #3498db;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img 
            src="${imageUrl}" 
            alt="${place.name}"
            style="
              width: 100%;
              height: 100%;
              margin-left: 11px;
              object-fit: cover;
            "
            onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\"bi bi-geo-alt-fill\\" style=\\"font-size: 20px; color: #3498db;\\"></i>';"
          />
        </div>
      `,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconAnchor, iconAnchor],
      popupAnchor: [0, -iconAnchor - 5],
    });
  } else {
    return new L.DivIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${iconSize}px;
          height: ${iconSize}px;
          border-radius: 50%;
          border: 2px solid #3498db;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <i class=\"bi bi-geo-alt-fill\" style=\"font-size: 24px; color: #3498db;\"></i>
        </div>
      `,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconAnchor, iconAnchor],
      popupAnchor: [0, -iconAnchor - 5],
    });
  }
};

const createHotelIcon = () => {
  return new L.Icon({
    iconUrl: hotelIconSvg,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const createRestaurantIcon = () => {
  return new L.Icon({
    iconUrl: restaurantIconSvg,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Utility to normalize city names (remove accents, lowercase, trim)
function normalizeCity(city) {
  return city
    ? city
        .normalize('NFD')
        .replace(/\u0300-\u036f/g, '')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .trim()
        .toLowerCase()
    : '';
}

const TourDetail = () => {
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [newestTours, setNewestTours] = useState([]);
  const [routePlaces, setRoutePlaces] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(null);
  const [addError, setAddError] = useState(null);
  const { user } = React.useContext(AuthContext);
  const [showBookModal, setShowBookModal] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateError, setDateError] = useState("");
  const [spots, setSpots] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('journey');
  const [tabHotels, setTabHotels] = useState([]);
  const [tabRestaurants, setTabRestaurants] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [allHotels, setAllHotels] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/tours/${id}`);
        if (!response.ok) {
          throw new Error('Không tìm thấy lộ trình');
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server trả về dữ liệu không hợp lệ");
        }
        const data = await response.json();
        console.log('Fetched tour:', data); // Debug log
        setTour(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchTour();

    // Fetch newest tours (excluding current)
    const fetchNewest = async () => {
      try {
        const res = await tourApi.getAll({ role: 'ADMIN' });
        let tours = res.data || [];
        setNewestTours(tours);
      } catch (e) {
        setNewestTours([]);
      }
    };
    fetchNewest();
  }, [id]);

  useEffect(() => {
    if (!tour || !tour.steps || tour.steps.length === 0) {
      setRoutePlaces([]);
      return;
    }
    // Fetch all places for the steps in order, attach to steps, and update state once
    const fetchPlacesAndAttach = async () => {
      const sortedSteps = [...tour.steps].sort((a, b) => a.step_order - b.step_order);
      // Only fetch for valid place_id
      const validSteps = sortedSteps.filter(s => s.place_id && !isNaN(Number(s.place_id)));
      const places = await Promise.all(
        validSteps.map(s => axios.get(`http://localhost:3000/api/places/${Number(s.place_id)}`).then(r => r.data))
      );
      setRoutePlaces(places);
      // Attach place objects to valid steps, leave others unchanged
      let placeIdx = 0;
      const stepsWithPlace = sortedSteps.map((step) => {
        if (step.place_id && !isNaN(Number(step.place_id))) {
          const place = places[placeIdx];
          placeIdx++;
          return { ...step, place };
        }
        return step;
      });
      console.log('Steps with place:', stepsWithPlace); // Debug log
      setTour(prev => ({ ...prev, steps: stepsWithPlace }));
    };
    fetchPlacesAndAttach();
  }, [tour?.id, tour?.steps?.length]);

  // Fetch all hotels and restaurants once when the component mounts
  useEffect(() => {
    const fetchAllHotels = async () => {
      try {
        const res = await hotelApi.getAll ? hotelApi.getAll() : hotelApi.searchByCity('');
        setAllHotels(res.data.data || res.data || []);
      } catch {
        setAllHotels([]);
      }
    };
    const fetchAllRestaurants = async () => {
      try {
        const res = await restaurantApi.getAll ? restaurantApi.getAll() : restaurantApi.searchByCity('');
        setAllRestaurants(res.data.data || res.data || []);
      } catch {
        setAllRestaurants([]);
      }
    };
    fetchAllHotels();
    fetchAllRestaurants();
  }, []);

  // Fetch hotels and restaurants for tour cities when routePlaces are loaded
  useEffect(() => {
    if (routePlaces.length > 0) {
      const fetchHotelsForCities = async () => {
        setLoadingHotels(true);
        const cities = getUniqueRouteCities();
        console.log('Fetching hotels for cities:', cities);
        let hotels = [];
        for (const city of cities) {
          try {
            const res = await hotelApi.searchByCity(city);
            console.log(`Hotels for ${city}:`, res.data);
            if (res.data && res.data.data) {
              hotels = hotels.concat(res.data.data);
            }
          } catch (error) {
            console.error(`Error fetching hotels for ${city}:`, error);
          }
        }
        console.log('All fetched hotels:', hotels);
        setAllHotels(hotels);
        setLoadingHotels(false);
      };

      const fetchRestaurantsForCities = async () => {
        setLoadingRestaurants(true);
        const cities = getUniqueRouteCities();
        console.log('Fetching restaurants for cities:', cities);
        let restaurants = [];
        for (const city of cities) {
          try {
            const res = await restaurantApi.searchByCity(city);
            console.log(`Restaurants for ${city}:`, res.data);
            if (res.data && res.data.data) {
              restaurants = restaurants.concat(res.data.data);
            }
          } catch (error) {
            console.error(`Error fetching restaurants for ${city}:`, error);
          }
        }
        console.log('All fetched restaurants:', restaurants);
        setAllRestaurants(restaurants);
        setLoadingRestaurants(false);
      };

      fetchHotelsForCities();
      fetchRestaurantsForCities();
    }
  }, [routePlaces]);

  // Filter hotels/restaurants by city match with routePlaces
  useEffect(() => {
    if (activeTab === 'hotels' && routePlaces.length > 0 && allHotels) {
      setLoadingHotels(true);
      const routeCities = routePlaces.map(p => normalizeCity(p.city)).filter(Boolean);
      const filtered = allHotels.filter(hotel => {
        const hotelCity = normalizeCity(hotel.city);
        return routeCities.includes(hotelCity);
      });
      setTabHotels(filtered);
      setLoadingHotels(false);
    }
    if (activeTab === 'restaurants' && routePlaces.length > 0 && allRestaurants) {
      setLoadingRestaurants(true);
      const routeCities = routePlaces.map(p => normalizeCity(p.city)).filter(Boolean);
      const filtered = allRestaurants.filter(restaurant => {
        const restCity = normalizeCity(restaurant.city);
        return routeCities.includes(restCity);
      });
      setTabRestaurants(filtered);
      setLoadingRestaurants(false);
    }
  }, [activeTab, routePlaces, allHotels, allRestaurants]);

  // Helper to chunk array into groups of 3
  function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  const handleAddToMyTours = async () => {
    if (!user) {
      setAddError('Bạn cần đăng nhập để thêm vào chuyến đi của tôi.');
      return;
    }
    setAddLoading(true);
    setAddSuccess(null);
    setAddError(null);
    try {
      await tourApi.cloneTour(tour.id, user.id);
      setAddSuccess('Đã thêm vào chuyến đi của tôi!');
    } catch (err) {
      setAddError('Không thể thêm vào chuyến đi của tôi.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleBookTour = async () => {
    setDateError("");
    if (!startDate || !endDate) {
      setDateError("Vui lòng chọn cả ngày bắt đầu và kết thúc.");
      return;
    }
    if (endDate < startDate) {
      setDateError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }
    if (!user || !user.id) {
      setDateError("Bạn cần đăng nhập để đặt tour.");
      return;
    }
    if (spots < 1 || spots > 20) {
      setDateError("Số lượng chỗ phải từ 1 đến 20.");
      return;
    }
    setBookingLoading(true);
    try {
      await tourApi.bookTour(tour.id, user.id, startDate, endDate, spots); // Pass spots
      setShowBookModal(false);
      setAddSuccess(`Đặt tour thành công!\nSố lượng khách: ${spots}\nTổng giá: ${(spots * (tour.total_cost || 0)).toLocaleString('vi-VN')} VND`);
    } catch (err) {
      setDateError(err?.response?.data?.error || "Lỗi khi đặt tour. Vui lòng thử lại.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Helper to get unique cities from routePlaces
  const getUniqueCities = () => {
    if (!routePlaces || routePlaces.length === 0) return [];
    const cities = routePlaces.map(p => p.city).filter(Boolean);
    return [...new Set(cities)];
  };

  // Helper to get all unique cities from routePlaces
  function getUniqueRouteCities() {
    console.log('Route places:', routePlaces); // Debug log
    const cities = routePlaces.map(p => p.city && p.city.trim()).filter(Boolean);
    console.log('Extracted cities:', cities); // Debug log
    // Remove duplicates (case-insensitive, normalized)
    const seen = new Set();
    const uniqueCities = cities.filter(city => {
      const norm = normalizeCity(city);
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });
    console.log('Unique normalized cities:', uniqueCities); // Debug log
    return uniqueCities;
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column luxury-home-container">
      <Header />
      <main className="flex-grow-1">
        <div className="container mx-auto p-4 max-w-3xl">
          <div style={{ background: 'rgba(245, 250, 255, 0.95)', borderRadius: '1.5rem', boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.10)', padding: '2.5rem 2rem', margin: '2rem 0' }}>            {/* HERO SECTION: Tour image as background with overlay and title */}
            <div style={{
              position: 'relative',
              width: '100%',
              minHeight: 380,
              maxHeight: 520,
              borderRadius: '1.5rem',
              overflow: 'hidden',
              marginBottom: 40,
              boxShadow: '0 4px 32px 0 rgba(177, 178, 189, 0.13)'
            }}>
                <img
                  src={tour.image_url.startsWith('http') ? tour.image_url : `http://localhost:3000${tour.image_url}`}
                  alt={tour.name}
                style={{
                  width: '100%',
                  height: 520,
                  objectFit: 'cover',
                  objectPosition: 'center',
                  filter: 'brightness(0.6)',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1
                }}
              />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(180deg, rgba(24, 24, 24, 0.55) 0%, rgba(134, 132, 132, 0.18) 60%, rgba(60, 60, 60, 0.65) 100%)',
                zIndex: 2
              }} />
              <div style={{
                position: 'relative',
                zIndex: 3,
                height: 520,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 2.5rem',
                textAlign: 'center',
              }}>
                <h1 className="display-3 fw-bold mb-3" style={{ color: '#fff', textShadow: '0 2px 24px #000a', letterSpacing: '-1.5px', fontSize: '3.2rem' }}>{tour.name}</h1>
                <div className="d-flex gap-3 justify-content-center align-items-center mb-2">
                  <LikeButton id={tour.id} type="tour" />
                  <RatingStars id={tour.id} type="tour" />
                </div>
              </div>
            </div>
            {/* DESCRIPTION SECTION */}
            <div className="mb-5 p-4" style={{ background: '#fafdff', borderRadius: '1.25rem', boxShadow: '0 2px 12px #b6e0fe22' }}>
              <h2 className="h5 fw-bold mb-3" style={{ color: '#3c69b0', letterSpacing: '-0.5px' }}>Giới thiệu về chuyến đi</h2>
              <hr style={{ margin: '0 0 1.5rem 0', borderColor: '#e3f0ff' }} />
              <div className="prose prose-lg" style={{ color: '#223a5f', fontSize: '1.15rem', lineHeight: 1.7 }}>
              <div dangerouslySetInnerHTML={{ __html: tour.description }} />
            </div>
            </div>
            <div style={{ width: '100%', maxWidth: '100%', height: 340, borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 4px 24px #b6e0fe55', border: '1px solid #e3f0ff', flex: '1 1 400px', background: '#fafdff' }}>
                <MapContainer
                  center={[10.8231, 106.6297]}
                  zoom={13}
                  style={{ width: '100%', height: '100%' }}
                  scrollWheelZoom={false}
                  dragging={true}
                  doubleClickZoom={false}
                  boxZoom={false}
                  keyboard={false}
                  zoomControl={true}
                >
                  <MapCenterHandler places={routePlaces} />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {routePlaces.length > 1 && (
                    <Polyline 
                      positions={routePlaces.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)])} 
                      pathOptions={{ color: '#1a5bb8', weight: 4, opacity: 0.8 }} 
                    />
                  )}
                  {/* Tour Places Markers */}
                  {routePlaces.map((p, idx) => (
                    <Marker key={`place-${p.id}`} position={[parseFloat(p.latitude), parseFloat(p.longitude)]} icon={createCustomIcon(p)}>
                      <Popup>
                        <div className="text-center">
                          <h5 className="text-primary mb-2">{p.name}</h5>
                          {p.address && <p className="mb-1 small">{p.address}</p>}
                          {p.city && <p className="mb-0 text-muted small">{p.city}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {/* Hotel Markers */}
                  {allHotels.map((hotel, idx) => (
                    <Marker key={`hotel-${hotel.id}`} position={[parseFloat(hotel.latitude), parseFloat(hotel.longitude)]} icon={createHotelIcon()}>
                      <Popup>
                        <div className="text-center">
                          <h6 className="text-danger mb-2">
                            <i className="bi bi-building me-1"></i>
                            {hotel.name}
                          </h6>
                          {hotel.city && <p className="mb-1 small">{hotel.city}</p>}
                          {hotel.price_range && <p className="mb-1 text-muted small">{hotel.price_range}</p>}
                          <Link to={`/hotels/${hotel.id}`} className="btn btn-sm btn-outline-danger mt-2">
                            <i className="bi bi-arrow-right me-1"></i>
                            Xem chi tiết
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {/* Restaurant Markers */}
                  {allRestaurants.map((restaurant, idx) => (
                    <Marker key={`restaurant-${restaurant.id}`} position={[parseFloat(restaurant.latitude), parseFloat(restaurant.longitude)]} icon={createRestaurantIcon()}>
                      <Popup>
                        <div className="text-center">
                          <h6 className="text-warning mb-2">
                            <i className="bi bi-cup-hot me-1"></i>
                            {restaurant.name}
                          </h6>
                          {restaurant.city && <p className="mb-1 small">{restaurant.city}</p>}
                          {restaurant.cuisine_type && <p className="mb-1 small text-muted">{restaurant.cuisine_type}</p>}
                          {restaurant.price_range && <p className="mb-1 text-muted small">{restaurant.price_range}</p>}
                          <Link to={`/restaurants/${restaurant.id}`} className="btn btn-sm btn-outline-warning mt-2">
                            <i className="bi bi-arrow-right me-1"></i>
                            Xem chi tiết
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            {/* Tab Bar Below Map */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 16 }}>
              <button
                className={`tab-btn${activeTab === 'journey' ? ' active' : ''}`}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '1.5rem 0 0 1.5rem',
                  background: activeTab === 'journey' ? '#b6e0fe' : '#e3f0ff',
                  color: activeTab === 'journey' ? '#1a5bb8' : '#3c69b0',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  outline: 'none',
                }}
                onClick={() => setActiveTab('journey')}
              >
                Hành trình
              </button>
              <button
                className={`tab-btn${activeTab === 'hotels' ? ' active' : ''}`}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: 0,
                  background: activeTab === 'hotels' ? '#b6e0fe' : '#e3f0ff',
                  color: activeTab === 'hotels' ? '#1a5bb8' : '#3c69b0',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  outline: 'none',
                }}
                onClick={() => setActiveTab('hotels')}
              >
                Khách sạn
              </button>
              <button
                className={`tab-btn${activeTab === 'restaurants' ? ' active' : ''}`}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '0 1.5rem 1.5rem 0',
                  background: activeTab === 'restaurants' ? '#b6e0fe' : '#e3f0ff',
                  color: activeTab === 'restaurants' ? '#1a5bb8' : '#3c69b0',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  outline: 'none',
                }}
                onClick={() => setActiveTab('restaurants')}
              >
                Nhà hàng
              </button>
            </div>
            {/* Tab Content */}
            <div style={{ marginTop: 16 }}>
              {activeTab === 'journey' && (
                <div>
                  {/* Existing journey/steps content here */}
                  {tour.steps && tour.steps.length > 0 && (
                    <div>
                      <h2 className="text-xl fw-bold mb-3 mt-4" style={{ color: '#3c69b0' }}>Hành trình:</h2>
                      {(() => {
                        const stepsByDay = tour.steps.reduce((acc, step) => {
                          const day = step.day || 1;
                          if (!acc[day]) acc[day] = [];
                          acc[day].push(step);
                          return acc;
                        }, {});
                        const sortedDays = Object.keys(stepsByDay).sort((a, b) => a - b);
                        return (
                          <div>
                            {sortedDays.map(dayNum => (
                              <div key={dayNum} className="mb-3">
                                <h4 className="fw-bold mb-2" style={{ color: '#3c69b0' }}>Ngày {dayNum}</h4>
                                <div>
                                  {stepsByDay[dayNum].sort((a, b) => a.step_order - b.step_order).map((step) => (
                                    <div key={step.id} className="mb-4" style={{ position: 'relative', paddingLeft: 0 }}>
                                      <div style={{ fontWeight: 700, color: '#3c69b0', fontSize: '1.12rem', marginBottom: 4 }}>
                                        {step.place_name || (step.place && step.place.name)}
                                      </div>
                                      {step.place && step.place.description && (
                                        <div style={{ color: '#223a5f', fontSize: '1.01rem', background: '#fafdff', borderRadius: 8, padding: '10px 14px', boxShadow: '0 1px 6px #e3f0ff33' }}>
                                          {step.place.description.replace(/<[^>]+>/g, '').slice(0, 180)}{step.place.description.length > 180 ? '...' : ''}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'hotels' && (
  <div>
    <h2 className="text-xl fw-bold mb-3 mt-4" style={{ color: '#3c69b0' }}>Khách sạn dọc hành trình</h2>
    {loadingHotels ? (
      <div className="text-muted">Đang tải khách sạn...</div>
    ) : getUniqueRouteCities().length === 0 ? (
      <div className="text-muted">Không tìm thấy thành phố nào trong hành trình.</div>
    ) : (
      getUniqueRouteCities().map(city => {
        const cityHotels = allHotels.filter(hotel => normalizeCity(hotel.city) === normalizeCity(city));
        return (
          <div key={city} className="mb-4">
            <h5 className="fw-bold mb-3">Khách sạn tại {city}</h5>
            <div className="row g-4">
              {cityHotels.length === 0 ? (
                <div className="col-12 text-muted">Không tìm thấy khách sạn phù hợp.</div>
              ) : (
                cityHotels.map((hotel, idx) => (
                  <div className="col-12 col-md-6 col-lg-4" key={hotel.id || idx}>
                    <Link to={`/hotels/${hotel.id}`} className="text-decoration-none">
                      <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                        <div className="position-relative">
                          {hotel.images && hotel.images.length > 0 && hotel.images[0].image_url ? (
                            <img 
                              src={hotel.images[0].image_url.startsWith('http') ? hotel.images[0].image_url : `http://localhost:3000${hotel.images[0].image_url}`} 
                              alt={hotel.name} 
                              className="card-img-top luxury-img-top" 
                              style={{ height: 220, objectFit: 'cover' }} 
                            />
                          ) : (
                            <div 
                              className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                              style={{ height: 220, background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)", color: "white", fontSize: "3rem" }}
                            >
                              <i className="bi bi-building"></i>
                            </div>
                          )}
                          {hotel.stars && (
                            <div className="position-absolute top-0 end-0 m-2">
                              <span className="badge bg-warning text-dark">
                                <i className="bi bi-star-fill me-1"></i>
                                {hotel.stars}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="card-body luxury-card-body">
                          <h3 className="card-title mb-2" style={{ fontWeight: 600 }}>{hotel.name}</h3>
                          {hotel.city && (
                            <p className="card-text text-primary mb-1 small">
                              <i className="bi bi-geo-alt-fill me-1"></i>
                              {hotel.city}
                            </p>
                          )}
                          <p className="card-text text-muted mb-2 luxury-desc">
                            {hotel.description
                              ? `${hotel.description.substring(0, 100)}...`
                              : "Không có mô tả"}
                          </p>
                          <RatingStars id={hotel.id} type="hotel" />
                          {hotel.price_range && (
                            <p className="card-text text-muted small mb-0">
                              <span className="luxury-money"><i className="bi bi-coin"></i></span> {hotel.price_range}
                              {hotel.min_price > 0 && ` (${hotel.min_price.toLocaleString()} VND)`}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
)}
              {activeTab === 'restaurants' && (
  <div>
    <h2 className="text-xl fw-bold mb-3 mt-4" style={{ color: '#3c69b0' }}>Nhà hàng dọc hành trình</h2>
    {loadingRestaurants ? (
      <div className="text-muted">Đang tải nhà hàng...</div>
    ) : getUniqueRouteCities().length === 0 ? (
      <div className="text-muted">Không tìm thấy thành phố nào trong hành trình.</div>
    ) : (
      getUniqueRouteCities().map(city => {
        const cityRestaurants = allRestaurants.filter(restaurant => normalizeCity(restaurant.city) === normalizeCity(city));
        return (
          <div key={city} className="mb-4">
            <h5 className="fw-bold mb-3">Nhà hàng tại {city}</h5>
            <div className="row g-4">
              {cityRestaurants.length === 0 ? (
                <div className="col-12 text-muted">Không tìm thấy nhà hàng phù hợp.</div>
              ) : (
                cityRestaurants.map((restaurant, idx) => (
                  <div className="col-12 col-md-6 col-lg-4" key={restaurant.id || idx}>
                    <Link to={`/restaurants/${restaurant.id}`} className="text-decoration-none">
                      <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                        <div className="position-relative">
                          {restaurant.images && restaurant.images.length > 0 && restaurant.images[0].image_url ? (
                            <img 
                              src={restaurant.images[0].image_url.startsWith('http') ? restaurant.images[0].image_url : `http://localhost:3000${restaurant.images[0].image_url}`} 
                              alt={restaurant.name} 
                              className="card-img-top luxury-img-top" 
                              style={{ height: 220, objectFit: 'cover' }} 
                            />
                          ) : (
                            <div 
                              className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                              style={{ height: 220, background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)", color: "white", fontSize: "3rem" }}
                            >
                              <i className="bi bi-cup-hot"></i>
                            </div>
                          )}
                          {restaurant.cuisine_type && (
                            <div className="position-absolute top-0 start-0 m-2">
                              <span className="badge bg-primary">
                                {restaurant.cuisine_type}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="card-body luxury-card-body">
                          <h3 className="card-title mb-2" style={{ fontWeight: 600 }}>{restaurant.name}</h3>
                          {restaurant.city && (
                            <p className="card-text text-primary mb-1 small">
                              <i className="bi bi-geo-alt-fill me-1"></i>
                              {restaurant.city}
                            </p>
                          )}
                          <p className="card-text text-muted mb-2 luxury-desc">
                            {restaurant.description
                              ? `${restaurant.description.substring(0, 100)}...`
                              : "Không có mô tả"}
                          </p>
                          <RatingStars id={restaurant.id} type="restaurant" />
                          {restaurant.price_range && (
                            <p className="card-text text-muted small mb-0">
                              <span className="luxury-money"><i className="bi bi-coin"></i></span> {restaurant.price_range}
                              {restaurant.min_price > 0 && ` (${restaurant.min_price.toLocaleString()} VND)`}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
)}
            </div>
            <div className="d-flex justify-content-center mt-3">
              {tour && user && tour.user_id !== user.id && (
                <button className="btn btn-main" onClick={() => setShowBookModal(true)} disabled={addLoading}>
                  {addLoading ? 'Đang thêm...' : 'Thêm vào chuyến đi của tôi'}
                </button>
              )}
            </div>
            {/* Pretty success modal */}
            <AuthModal open={!!addSuccess} onClose={() => setAddSuccess(null)}>
              <div className="text-center">
                <div style={{ fontSize: 48, color: '#28a745', marginBottom: 16 }}>
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <h4 className="mb-3" style={{ color: '#28a745' }}>Thành công!</h4>
                <div className="mb-4" style={{ whiteSpace: 'pre-line' }}>{addSuccess}</div>
                <button className="btn btn-main px-4" onClick={() => setAddSuccess(null)}>Đóng</button>
              </div>
            </AuthModal>
            {addError && <div className="alert alert-danger text-center mt-3">{addError}</div>}
          </div>
        </div>
      </main>
      {/* Newest Tours Carousel */}
      <div className="container my-5">
        <h2 className="h4 mb-4 fw-bold luxury-section-title">Chuyến đi khác</h2>
        {(() => {
          // Only show tours that are not the current one
          const otherTours = (Array.isArray(newestTours) ? newestTours : []).filter(t => t.id !== Number(id));
          if (otherTours.length === 0) {
            return <p className="text-muted text-center">Không có chuyến đi nào để hiển thị.</p>;
          }
          return (
            <div id="toursCarousel" className="carousel slide" data-bs-ride="carousel">
              <div className="carousel-inner">
                {chunkArray(otherTours, 3).map((group, idx) => (
                  <div className={`carousel-item${idx === 0 ? ' active' : ''}`} key={group.map(t => t.id).join('-')}>
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-5 justify-content-center">
                      {group.map((t) => (
                        <div className="col" key={t.id}>
                          <Link to={`/tours/${t.id}`} className="text-decoration-none">
                            <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                              <div className="position-relative">
                                {t.image_url ? (
                                  <img
                                    src={t.image_url.startsWith('http') ? t.image_url : `http://localhost:3000${t.image_url}`}
                                    alt={t.name}
                                    className="card-img-top luxury-img-top"
                                    style={{ height: 220, objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div 
                                    className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                                    style={{ height: 220, background: 'linear-gradient(135deg, #1a5bb8 0%, #3c69b0 100%)', color: 'white', fontSize: '3rem', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}
                                  >
                                    <i className="bi bi-map"></i>
                                  </div>
                                )}
                              </div>
                              <div className="card-body luxury-card-body">
                                <h3 className="card-title mb-2" style={{ fontWeight: 600 }}>{t.name}</h3>
                                <p className="card-text text-muted mb-2 luxury-desc">
                                  {t.description ? `${t.description.replace(/<[^>]+>/g, '').substring(0, 100)}...` : 'Chưa có mô tả'}
                                </p>
                                <div className="d-flex align-items-center justify-content-between">
                                  <span className="card-text text-muted small mb-0 luxury-rating">
                                    <span className="luxury-money"><i className="bi bi-coin"></i></span> {t.total_cost ? t.total_cost.toLocaleString('vi-VN') : '0'} VND
                                  </span>
                                  {/* Optionally add rating stars if available */}
                                  {t.rating && <RatingStars id={t.id} type="tour" />}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {chunkArray(otherTours, 3).length > 1 && (
                <>
                  <button className="carousel-control-prev" type="button" data-bs-target="#toursCarousel" data-bs-slide="prev"
                    style={{ width: '5rem', height: '5rem', top: '50%', left: '-4rem', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="carousel-control-prev-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button className="carousel-control-next" type="button" data-bs-target="#toursCarousel" data-bs-slide="next"
                    style={{ width: '5rem', height: '5rem', top: '50%', right: '-4rem', left: 'auto', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="carousel-control-next-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </>
              )}
            </div>
          );
        })()}
      </div>
      {showBookModal && (
        <Modal show={showBookModal} onHide={() => setShowBookModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Chọn ngày bắt đầu, kết thúc và số lượng chỗ</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <label className="form-label"><strong>Ngày bắt đầu:</strong></label>
              <ReactDatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label className="form-label"><strong>Ngày kết thúc:</strong></label>
              <ReactDatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || new Date()}
                dateFormat="dd/MM/yyyy"
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label className="form-label"><strong>Số lượng chỗ:</strong></label>
              <input
                type="number"
                min={1}
                max={20}
                value={spots}
                onChange={e => setSpots(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="form-control"
                style={{ maxWidth: 120 }}
              />
            </div>
            <div className="mb-3">
              <strong>Giá mỗi chỗ:</strong> {tour.total_cost?.toLocaleString('vi-VN')} VND<br />
              <strong>Tổng cộng:</strong> {(spots * (tour.total_cost || 0)).toLocaleString('vi-VN')} VND
            </div>
            {dateError && <div className="alert alert-danger py-2">{dateError}</div>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowBookModal(false)} disabled={bookingLoading}>Đóng</Button>
            <Button variant="primary" onClick={handleBookTour} disabled={bookingLoading || !startDate || !endDate || spots < 1 || spots > 20}>
              {bookingLoading ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : null}
              Xác nhận
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      <Footer />
    </div>
  );
};

export default TourDetail;
