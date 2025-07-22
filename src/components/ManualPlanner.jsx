import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext.jsx";
import Header from "./Header.jsx";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import LocationAutocomplete from "./LocationAutocomplete.jsx";
import CityAutocomplete from "./CityAutocomplete.jsx";
import "../css/luxury-home.css";
import { useNavigate, Link } from "react-router-dom";
import { Card, Button } from "react-bootstrap";
import groupBy from "lodash/groupBy";
import hotelApi from '../api/hotelApi';
import { Modal, Form } from 'react-bootstrap';
import axiosClient from '../api/axiosClient';
import formatVND from '../utils/formatVND';
const BASE_URL = "https://walkingguide.onrender.com";

function ManualPlanner({ noLayout }) {
  const [places, setPlaces] = useState([]);
  const [tourName, setTourName] = useState("");
  const [description, setDescription] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [steps, setSteps] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, logout, refreshNotifications } = useContext(AuthContext);
  const [start_time, setStart_time] = useState("");
  const [end_time, setEnd_time] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCities, setSelectedCities] = useState([]);
  const [newCity, setNewCity] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [cityPlaces, setCityPlaces] = useState([]);
  const [isLoadingCityPlaces, setIsLoadingCityPlaces] = useState(false);
  const navigate = useNavigate();
  const [createdTour, setCreatedTour] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const userId = user ? user.id : null;
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('danger');
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [start_from, setStart_from] = useState(null); // New state for start_from location
  const [hotelsByCity, setHotelsByCity] = useState({});
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingHotel, setBookingHotel] = useState(null);
  const [bookingCheckIn, setBookingCheckIn] = useState("");
  const [bookingCheckOut, setBookingCheckOut] = useState("");
  const [bookingStatus, setBookingStatus] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState("");

  useEffect(() => {
    axiosClient.get("/places").then((res) => {
      setPlaces(res.data);
    });
    axiosClient.get("/tags").then(res => setTags(res.data));
  }, []);

  useEffect(() => {
    axiosClient.get("/hotels").then((res) => {
      setHotels(res.data.data || res.data);
    });
  }, []);

  // Set default hotel check-in/out to tour start/end
  useEffect(() => {
    if (start_time && end_time) {
      setHotelCheckIn(start_time);
      setHotelCheckOut(end_time);
    }
  }, [start_time, end_time]);

  // Helper to get proper image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/default-hotel.jpg";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${BASE_URL}${imageUrl}`;
  };

  // Helper to get proper place image URL
  const getPlaceImageUrl = (place) => {
    if (!place) return "/default-place.jpg";
    if (place.image_url) {
      if (place.image_url.startsWith("http")) return place.image_url;
      return `${BASE_URL}${place.image_url}`;
    }
    return "/default-place.jpg";
  };

  // Fetch hotels when start_from changes (prefer lat/lng, else city)
  useEffect(() => {
    if (start_from && start_from.latitude && start_from.longitude) {
      axiosClient.get(`${BASE_URL}/api/hotels/search?latitude=${start_from.latitude}&longitude=${start_from.longitude}&radius=10`)
        .then((res) => {
          setHotels(res.data.data || res.data);
        });
    } else if (start_from && start_from.city) {
      axiosClient.get(`${BASE_URL}/api/hotels/search?city=${encodeURIComponent(start_from.city)}`)
        .then((res) => {
          setHotels(res.data.data || res.data);
        });
    }
  }, [start_from]);

  // Fetch hotels for all selected cities
  useEffect(() => {
    if (selectedCities.length > 0) {
      Promise.all(selectedCities.map(city =>
        axiosClient.get(`${BASE_URL}/api/hotels/search?city=${encodeURIComponent(city)}`)
          .then(res => ({ city, hotels: res.data.data || res.data }))
          .catch(() => ({ city, hotels: [] }))
      )).then(results => {
        const grouped = {};
        results.forEach(({ city, hotels }) => {
          grouped[city] = hotels;
        });
        setHotelsByCity(grouped);
      });
    } else {
      // fallback: fetch all hotels
      axiosClient.get(`${BASE_URL}/api/hotels`).then((res) => {
        setHotelsByCity({ All: res.data.data || res.data });
      });
    }
  }, [selectedCities]);

  // Get all available cities from places
  const getAvailableCities = () => {
    const cities = new Set();
    places.forEach(place => {
      if (place.city && place.city.trim()) {
        cities.add(place.city.trim());
      }
    });
    return Array.from(cities).sort();
  };

  // Search places by cities
  const searchPlacesByCities = async (cities) => {
    if (!cities || cities.length === 0) {
      setCityPlaces([]);
      return;
    }
    
    setIsLoadingCityPlaces(true);
    try {
      const allPlaces = [];
      console.log('Searching places for cities:', cities);
      
      for (const city of cities) {
        try {
          console.log(`Searching places for city: "${city}"`);
          const response = await axiosClient.get(`${BASE_URL}/api/places/search?city=${encodeURIComponent(city)}`);
          console.log(`Response for "${city}":`, response.data);
          
          if (response.data && response.data.length > 0) {
            // Add city information to each place
            const placesWithCity = response.data.map(place => ({
              ...place,
              sourceCity: city
            }));
            allPlaces.push(...placesWithCity);
            console.log(`Found ${response.data.length} places for "${city}"`);
          } else {
            console.log(`No places found for "${city}"`);
            
            // Fallback: search all places and filter by city name
            try {
              const allPlacesResponse = await axiosClient.get(`${BASE_URL}/api/places`);
              const allPlacesData = allPlacesResponse.data;
              
              // Try to find places with similar city names
              const cityLower = city.toLowerCase();
              const matchingPlaces = allPlacesData.filter(place => {
                if (!place.city) return false;
                const placeCityLower = place.city.toLowerCase();
                return placeCityLower.includes(cityLower) || cityLower.includes(placeCityLower);
              });
              
              if (matchingPlaces.length > 0) {
                console.log(`Found ${matchingPlaces.length} places with similar city names for "${city}"`);
                const placesWithCity = matchingPlaces.map(place => ({
                  ...place,
                  sourceCity: city
                }));
                allPlaces.push(...placesWithCity);
              }
            } catch (fallbackError) {
              console.error('Error in fallback search:', fallbackError);
            }
          }
        } catch (error) {
          console.error(`Error searching places for city "${city}":`, error);
        }
      }
      
      console.log('Total places found:', allPlaces.length);
      setCityPlaces(allPlaces);
    } catch (error) {
      console.error('Error searching places by cities:', error);
      setCityPlaces([]);
    } finally {
      setIsLoadingCityPlaces(false);
    }
  };

  const removeCity = (cityToRemove) => {
    const updatedCities = selectedCities.filter(city => city !== cityToRemove);
    setSelectedCities(updatedCities);
    // Update selectedCity if it was removed
    if (selectedCity === cityToRemove) {
      setSelectedCity(updatedCities.length > 0 ? updatedCities[0] : "");
    }
    searchPlacesByCities(updatedCities);
  };

  // Group places by city for better organization
  const getPlacesByCity = () => {
    const groupedPlaces = {};
    cityPlaces.forEach(place => {
      const city = place.sourceCity || place.city;
      if (!groupedPlaces[city]) {
        groupedPlaces[city] = [];
      }
      groupedPlaces[city].push(place);
    });
    return groupedPlaces;
  };

  const addTag = () => {
    const tagSelect = document.getElementById('tagSelect');
    const tagId = tagSelect.value;
    if (tagId && !selectedTags.includes(tagId)) {
      setSelectedTags([...selectedTags, tagId]);
      tagSelect.value = "";
    }
  };

  const removeTag = (tagIdToRemove) => {
    setSelectedTags(selectedTags.filter(tagId => tagId !== tagIdToRemove));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Calculate total days based on start and end dates
  const calculateTotalDays = () => {
    if (start_time && end_time) {
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays);
    }
    return Math.max(1, Math.ceil(steps.length / 3)); // Default to 3 places per day
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum end date (start date + 1 day)
  const getMinEndDate = () => {
    if (!start_time) return getTodayDate();
    const startDate = new Date(start_time);
    const nextDay = new Date(startDate);
    nextDay.setDate(startDate.getDate() + 1);
    return nextDay.toISOString().split('T')[0];
  };

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        place_id: "",
        step_order: steps.length + 1,
        start_time: "",
        end_time: "",
        day: 1 // default to day 1
      }
    ]);
  };

  const handleRemoveStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder remaining steps
    const reorderedSteps = newSteps.map((step, i) => ({
      ...step,
      step_order: i + 1
    }));
    setSteps(reorderedSteps);
  };

  const handleMoveStep = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap steps
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Update step_order
    newSteps.forEach((step, i) => {
      step.step_order = i + 1;
    });
    
    setSteps(newSteps);
  };

  const handleChangeStep = (index, field, value) => {
    const newSteps = [...steps];
    if (field === "step_order" || field === "day") {
      newSteps[index][field] = parseInt(value) || 1;
    } else {
      newSteps[index][field] = value;
    }
    setSteps(newSteps);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (steps.length === 0) {
      setAlertMessage('Vui lòng thêm ít nhất một địa điểm!');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }
    if (steps.some(step => !step.place_id)) {
      setAlertMessage('Vui lòng chọn địa điểm cho tất cả các bước!');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }
    // Get first place info
    const firstStep = steps[0];
    const firstPlace = getSelectedPlace(firstStep.place_id);
    const autoTourName = firstPlace ? firstPlace.name : tourName;
    const autoImageUrl = firstPlace && firstPlace.image_url ? firstPlace.image_url : '';
    setIsSubmitting(true);
    try {
      const res = await axiosClient.post(`${BASE_URL}/api/tours`, {
        name: autoTourName,
        description,
        user_id: userId,
        total_cost: parseFloat(totalCost) || 0,
        start_time: start_time,
        end_time: end_time,
        steps,
        image_url: autoImageUrl,
      });
      // Show modal with summary and buttons
      setCreatedTour(res.data.tour || res.data); // support both {tour, steps} and just tour
      setShowSuccessModal(true);
      setTourName("");
      setDescription("");
      setTotalCost(0);
      setSteps([]);
      // Trigger notification refresh to update unread count
      refreshNotifications();
      // Add: redirect to /my-tours after a short delay or after closing modal
      setTimeout(() => navigate('/my-tours'), 1200);
    } catch (error) {
      setAlertMessage('Lỗi khi tạo tour');
      setAlertType('danger');
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedPlace = (placeId) => {
    return places.find(p => p.id == placeId);
  };

  const stepsByDay = steps.reduce((acc, step) => {
    const day = step.day || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(step);
    return acc;
  }, {});
  const sortedDays = Object.keys(stepsByDay).sort((a, b) => a - b);

  if (!user) {
    const content = (
      <div className="container py-4">
        <div className="alert alert-warning mt-3">Bạn cần đăng nhập để sử dụng chức năng này.</div>
      </div>
    );
    if (noLayout) return content;
    return (
      <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
        <Header />
        <Navbar activePage="plan" />
        <main className="container py-4 flex-grow-1">{content}</main>
        <Footer />
      </div>
    );
  }

  const mainContent = (
    <div className="luxury-planner-container">
      
      {/* Alert Component */}
      {showAlert && (
        <div className={`alert alert-${alertType} alert-dismissible fade show`} role="alert">
          <i className={`bi ${alertType === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-exclamation-circle-fill'} me-2`}></i>
          {alertMessage}
          <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
        </div>
      )}

      {/* Tour Basic Info */}
      <div className="luxury-card mb-4">
        <div className="luxury-card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Khởi hành từ <span className="text-danger">*</span></label>
              <LocationAutocomplete
                value={tourName}
                onChange={setTourName}
                placeholder="Nhập điểm khởi hành"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">
                <i className="bi bi-geo-alt me-2 text-primary"></i>
                Thành phố muốn đi
              </label>
              <div className="d-flex gap-2 mb-2">
                <CityAutocomplete
                  value={newCity}
                  onChange={(city) => {
                    // Only update the input value, don't add to selected cities automatically
                    setNewCity(city);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newCity.trim() && !selectedCities.includes(newCity.trim())) {
                      e.preventDefault();
                      const updatedCities = [...selectedCities, newCity.trim()];
                      setSelectedCities(updatedCities);
                      setNewCity("");
                      searchPlacesByCities(updatedCities);
                    }
                  }}
                  placeholder="Chọn hoặc nhập thành phố..."
                />
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={() => {
                    if (newCity.trim() && !selectedCities.includes(newCity.trim())) {
                      const updatedCities = [...selectedCities, newCity.trim()];
                      setSelectedCities(updatedCities);
                      setNewCity("");
                      searchPlacesByCities(updatedCities);
                    }
                  }}
                  disabled={!newCity.trim()}
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
              {selectedCities.length > 0 && (
                <div className="mt-2">
                  {selectedCities.map((city, index) => (
                    <span key={index} className="badge bg-success me-2 mb-1" style={{fontSize: '1em'}}>
                      <i className="bi bi-geo-alt me-1"></i>
                      {city}
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-white ms-1 p-0 text-decoration-none"
                        style={{fontSize: '1em'}}
                        title="Xóa thành phố"
                        onClick={() => removeCity(city)}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">
                <i className="bi bi-tags me-2 text-info"></i>
                Loại địa điểm muốn khám phá
              </label>
              <div className="d-flex gap-2">
                <select
                  id="tagSelect"
                  className="form-select"
                  onChange={addTag}
                >
                  <option value="">Chọn loại địa điểm...</option>
                  {tags.filter(tag => !selectedTags.includes(String(tag.id))).map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-outline-info"
                  onClick={addTag}
                  disabled={!document.getElementById('tagSelect')?.value}
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
              {selectedTags.length > 0 && (
                <div className="mt-2">
                  {selectedTags.map(tagId => {
                    const tag = tags.find(t => String(t.id) === String(tagId));
                    if (!tag) return null;
                    return (
                      <span key={tag.id} className="badge bg-info me-2 mb-1" style={{fontSize: '1em'}}>
                        <i className="bi bi-tag me-1"></i>
                        {tag.name}
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-white ms-1 p-0 text-decoration-none"
                          style={{fontSize: '1em'}}
                          title="Xóa loại địa điểm"
                          onClick={() => removeTag(String(tag.id))}
                        >×</button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">
                <i className="bi bi-currency-dollar me-2 text-success"></i>
                Tổng chi phí (VND)
              </label>
              <input
                className="form-control"
                type="text"
                value={totalCost ? parseInt(totalCost).toLocaleString('vi-VN') : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  setTotalCost(rawValue);
                }}
                placeholder="Nhập chi phí dự kiến"
              />
              {totalCost && (
                <div className="form-text">
                  <i className="bi bi-info-circle me-1"></i>
                  Chi phí: {formatVND(parseInt(totalCost))} VNĐ
                </div>
              )}
              
              {/* Price Suggestions - only show when input is short and not a complete price */}
              {totalCost && totalCost.length > 0 && totalCost.length <= 3 && !totalCost.endsWith('000') && (
                <div className="mt-2">
                  <small className="text-muted">Gợi ý:</small>
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {(() => {
                      const inputNum = totalCost.replace(/\D/g, '');
                      const suggestions = [
                        { value: inputNum + '000', label: inputNum + '.000 VNĐ' },
                        { value: inputNum + '0000', label: inputNum + '0.000 VNĐ' },
                        { value: inputNum + '00000', label: inputNum + '00.000 VNĐ' },
                        { value: inputNum + '000000', label: inputNum + '.000.000 VNĐ' },
                        { value: inputNum + '0000000', label: inputNum + '0.000.000 VNĐ' },
                      ].filter(s => s.value !== totalCost);
                      
                      return suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => setTotalCost(suggestion.value)}
                        >
                          {suggestion.label}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">
                <i className="bi bi-calendar-event me-2 text-primary"></i>
                Ngày bắt đầu
              </label>
              <div className="position-relative">
                <input
                  type="date"
                  className="form-control"
                  value={start_time}
                  onChange={e => setStart_time(e.target.value)}
                  min={getTodayDate()}
                />
                {start_time && (
                  <div className="form-text mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    {formatDate(start_time)}
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">
                <i className="bi bi-calendar-check me-2 text-primary"></i>
                Ngày kết thúc
              </label>
              <div className="position-relative">
                <input
                  type="date"
                  className="form-control"
                  value={end_time}
                  onChange={e => setEnd_time(e.target.value)}
                  min={getMinEndDate()}
                  disabled={!start_time}
                />
                {end_time && (
                  <div className="form-text mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    {formatDate(end_time)} ({calculateTotalDays()} ngày)
                  </div>
                )}
                {!start_time && (
                  <div className="form-text mt-1">
                    <i className="bi bi-exclamation-triangle me-1 text-warning"></i>
                    Vui lòng chọn ngày bắt đầu trước
                  </div>
                )}
              </div>
            </div>
            <div className="col-12">
              <label className="form-label fw-bold">Mô tả</label>
              <textarea
                className="form-control"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết về tour của bạn"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tour Steps */}
      <div className="luxury-card">
        <div className="luxury-card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Hành trình chuyến đi</h4>
            <div className="d-flex gap-2">
              {/* <button className="btn btn-main btn-sm" onClick={() => {
                const totalDays = calculateTotalDays();
                
                // Distribute steps evenly across calculated days
                const stepsPerDay = Math.ceil(steps.length / totalDays);
                const newSteps = steps.map((step, i) => ({
                  ...step,
                  day: Math.floor(i / stepsPerDay) + 1
                }));
                setSteps(newSteps);
              }}>
                <i className="bi bi-magic me-1"></i>Tự động phân ngày
              </button> */}
              <button className="btn btn-main btn-sm" onClick={handleAddStep}>
                Thêm địa điểm
              </button>
            </div>
          </div>

          {/* Summary Section */}
          {(selectedCity || selectedCities.length > 0 || selectedTags.length > 0) && (
            <div className="mt-4">
              <div className="alert alert-info border-0 shadow-sm">
                <h6 className="mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Tóm tắt lựa chọn của bạn
                </h6>
                <div className="row">
                  {(selectedCity || selectedCities.length > 0) && (
                    <div className="col-md-6 mb-2">
                      <strong className="text-primary">
                        <i className="bi bi-geo-alt me-1"></i>
                        Thành phố:
                      </strong>
                      <div className="mt-1">
                        {selectedCity && (
                          <span className="badge bg-primary me-1 mb-1">
                            {selectedCity}
                          </span>
                        )}
                        {selectedCities.map((city, index) => (
                          <span key={index} className="badge bg-success me-1 mb-1">
                            {city}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedTags.length > 0 && (
                    <div className="col-md-6 mb-2">
                      <strong className="text-info">
                        <i className="bi bi-tags me-1"></i>
                        Loại địa điểm:
                      </strong>
                      <div className="mt-1">
                        {selectedTags.map(tagId => {
                          const tag = tags.find(t => String(t.id) === String(tagId));
                          if (!tag) return null;
                          return (
                            <span key={tag.id} className="badge bg-info me-1 mb-1">
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add Place Section - Card-based suggestion */}
          {selectedCities.length > 0 && (
            <div className="mb-4">
              <h5 className="form-label">Gợi ý địa điểm từ thành phố đã chọn</h5>
              <div className="row row-cols-1 row-cols-md-3 g-4">
                {cityPlaces.length === 0 && <div className="col">Không có địa điểm gợi ý cho thành phố này.</div>}
                {cityPlaces.map(place => {
                  const isSelected = steps.some(step => step.place_id === place.id);
                  return (
                    <div className="col" key={place.id}>
                      <Card
                        style={{ border: isSelected ? "2px solid #1a5bb8" : undefined, boxShadow: isSelected ? "0 0 10px #1a5bb844" : undefined, cursor: "pointer", transition: 'box-shadow 0.2s, border 0.2s' }}
                        className={isSelected ? "shadow-lg" : "shadow-sm"}
                        onClick={() => {
                          if (!isSelected) {
                            // Add as a new step
                            setSteps([...steps, {
                              place_id: place.id,
                              step_order: steps.length + 1,
                              day: 1 + Math.floor(steps.length / 3),
                              start_time: "",
                              end_time: ""
                            }]);
                          }
                        }}
                      >
                        <Card.Img variant="top" src={getPlaceImageUrl(place)} style={{ height: 140, objectFit: "cover", borderTopLeftRadius: 12, borderTopRightRadius: 12 }} onError={e => { e.target.style.display = 'none'; }} />
                        <Card.Body>
                          <Card.Title className="fw-bold" style={{ color: isSelected ? '#1a5bb8' : undefined }}>{place.name}</Card.Title>
                          <Card.Text>
                            <span>{place.address}</span><br/>
                            <span className="text-muted">{place.city}</span><br/>
                            {place.description && (
                              <span className="text-muted small">{place.description.substring(0, 60)}...</span>
                            )}
                          </Card.Text>
                          <div className="d-flex gap-2 mt-2">
                            {isSelected ? (
                              <Button variant="primary" size="sm" disabled>Đã thêm</Button>
                            ) : (
                              <Button variant="outline-primary" size="sm" onClick={e => { e.stopPropagation(); setSteps([...steps, {
                                place_id: place.id,
                                step_order: steps.length + 1,
                                day: 1 + Math.floor(steps.length / 3),
                                start_time: "",
                                end_time: ""
                              }]); }}>Thêm vào kế hoạch</Button>
                            )}
                            <Link to={`/places/${place.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-sm" onClick={e => e.stopPropagation()}>
                              Xem chi tiết
                            </Link>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {steps.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-map-marker-alt fa-3x text-muted mb-3"></i>
              <p className="text-muted">Chưa có địa điểm nào. Hãy thêm địa điểm đầu tiên!</p>
            </div>
          ) : (
            <>
              <div className="tour-steps-container">
                {sortedDays.map(dayNum => (
                  <div key={dayNum} className="mb-4">
                    <h5 className="fw-bold mb-3">Ngày {dayNum}</h5>
                    {stepsByDay[dayNum].map((step, i) => {
                      const selectedPlace = getSelectedPlace(step.place_id);
                      const stepIndex = steps.findIndex(s => s === step);
                      return (
                        <div key={stepIndex} className="tour-step-card mb-3">
                          <div className="tour-step-header">
                            <div className="step-number">{step.step_order}</div>
                            <div className="step-controls">
                              <button 
                                className="btn btn-sm btn-outline-secondary me-1"
                                onClick={() => handleMoveStep(stepIndex, 'up')}
                                disabled={stepIndex === 0}
                                title="Di chuyển lên"
                              >
                                <i className="bi bi-arrow-up"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-secondary me-1"
                                onClick={() => handleMoveStep(stepIndex, 'down')}
                                disabled={stepIndex === steps.length - 1}
                                title="Di chuyển xuống"
                              >
                                <i className="bi bi-arrow-down"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveStep(stepIndex)}
                                title="Xóa địa điểm"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                          <div className="tour-step-content">
                            <div className="row g-3">
                              <div className="col-md-8">
                                <label className="form-label fw-bold">Địa điểm <span className="text-danger">*</span></label>
                                <select
                                  className="form-select"
                                  value={step.place_id}
                                  onChange={(e) => handleChangeStep(stepIndex, "place_id", e.target.value)}
                                >
                                  <option value="">-- Chọn địa điểm --</option>
                                  {/* Show suggested places grouped by city */}
                                  {Object.entries(getPlacesByCity()).map(([city, cityPlacesList]) => (
                                    <optgroup key={city} label={`${city} (${cityPlacesList.length} địa điểm)`}>
                                      {cityPlacesList.map((p) => (
                                        <option key={`suggested-${p.id}`} value={p.id}>
                                          {p.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                  {/* Show all other places */}
                                  <optgroup label="Tất cả địa điểm khác">
                                    {places.filter(p => !cityPlaces.some(cp => cp.id === p.id)).map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} - {p.city}
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                                {selectedPlace && (
                                  <div className="mt-2 p-2 bg-light rounded">
                                    <small className="text-muted">
                                      <i className="bi bi-map-marker-alt me-1"></i>
                                      {selectedPlace.address}
                                    </small>
                                  </div>
                                )}
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">Ngày</label>
                                <select
                                  className="form-select"
                                  value={step.day || 1}
                                  onChange={e => handleChangeStep(stepIndex, "day", e.target.value)}
                                >
                                  {Array.from({ length: calculateTotalDays() }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Ngày {i + 1}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">Thứ tự</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  min="1"
                                  value={step.step_order}
                                  onChange={(e) => handleChangeStep(stepIndex, "step_order", e.target.value)}
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">Thời gian bắt đầu</label>
                                <input
                                  type="time"
                                  className="form-control"
                                  value={step.start_time || ""}
                                  onChange={(e) => handleChangeStep(stepIndex, "start_time", e.target.value)}
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">Thời gian kết thúc</label>
                                <input
                                  type="time"
                                  className="form-control"
                                  value={step.end_time || ""}
                                  onChange={(e) => handleChangeStep(stepIndex, "end_time", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <button 
                  className="btn btn-main btn-sm mb-3"
                  onClick={() => handleAddStep()}
                  title="Thêm địa điểm"
                >
                  Thêm
                </button>
              </div>
              {/* Add summary preview below steps */}
              <div className="mt-4">
                <h5 className="fw-bold">Tóm tắt kế hoạch:</h5>
                <ul>
                  {sortedDays.map(dayNum => (
                    <li key={dayNum}>
                      <b>Ngày {dayNum}:</b> {stepsByDay[dayNum].map(step => {
                        const place = getSelectedPlace(step.place_id);
                        return place ? place.name : "(Chưa chọn địa điểm)";
                      }).join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hotel selection section */}
      <div className="mb-4 mt-4">
        <h5 className="form-label">Bạn có thể chọn khách sạn</h5>
        <div>
          {selectedCities.length > 0 ? (
            Object.entries(hotelsByCity).map(([city, hotels]) => (
              <div key={city} className="mb-3">
                <h6 className="fw-bold text-primary mb-2">Khách sạn tại {city}</h6>
                <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 8 }}>
                  {hotels.length === 0 && <div className="d-flex align-items-center">Không tìm thấy khách sạn phù hợp.</div>}
                  {hotels.map(hotel => (
                    <div key={hotel.id} style={{ display: 'inline-block', minWidth: 280, maxWidth: 320 }}>
                      <Card
                        style={{ border: selectedHotel?.id === hotel.id ? "2px solid #007bff" : undefined, boxShadow: selectedHotel?.id === hotel.id ? "0 0 10px #007bff44" : undefined, cursor: "pointer", transition: 'box-shadow 0.2s, border 0.2s' }}
                        className={selectedHotel?.id === hotel.id ? "shadow-lg" : "shadow-sm"}
                        onClick={e => {
                          if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') setSelectedHotel(hotel);
                        }}
                      >
                        <Card.Img variant="top" src={hotel.images && hotel.images[0] ? getImageUrl(hotel.images[0].image_url) : "/default-hotel.jpg"} style={{ height: 180, objectFit: "cover", borderTopLeftRadius: 12, borderTopRightRadius: 12 }} onError={e => { e.target.style.display = 'none'; }} />
                        <Card.Body>
                          <Card.Title className="fw-bold" style={{ color: selectedHotel?.id === hotel.id ? '#1a5bb8' : undefined }}>{hotel.name}</Card.Title>
                          <Card.Text>
                            <span>{hotel.address}</span><br/>
                            <span className="text-muted">{hotel.city}</span><br/>
                            {hotel.min_price && hotel.max_price && (
                              <span>Giá: {formatVND(hotel.min_price)} - {formatVND(hotel.max_price)} VND</span>
                            )}
                          </Card.Text>
                          <div className="d-flex gap-2 mt-2">
                            <Button variant={selectedHotel?.id === hotel.id ? "primary" : "outline-primary"} size="sm" onClick={e => { e.stopPropagation(); setSelectedHotel(hotel); }}>
                              {selectedHotel?.id === hotel.id ? "Đã chọn" : "Chọn"}
                            </Button>
                            <Button variant="success" size="sm" className="ms-2" onClick={e => { e.stopPropagation(); setBookingHotel(hotel); setShowBookingModal(true); setBookingCheckIn(""); setBookingCheckOut(""); setBookingStatus(null); }}>
                              Booking now
                            </Button>
                            <Link to={`/hotels/${hotel.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-sm" onClick={e => e.stopPropagation()}>
                              Xem chi tiết
                            </Link>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 8 }}>
              {hotelsByCity.All && hotelsByCity.All.length === 0 && <div className="d-flex align-items-center">Không tìm thấy khách sạn phù hợp.</div>}
              {hotelsByCity.All && hotelsByCity.All.map(hotel => (
                <div key={hotel.id} style={{ display: 'inline-block', minWidth: 280, maxWidth: 320 }}>
                  <Card
                    style={{ border: selectedHotel?.id === hotel.id ? "2px solid #007bff" : undefined, boxShadow: selectedHotel?.id === hotel.id ? "0 0 10px #007bff44" : undefined, cursor: "pointer", transition: 'box-shadow 0.2s, border 0.2s', borderRadius:'15px' }}
                    className={selectedHotel?.id === hotel.id ? "shadow-lg me-2" : "shadow-sm me-2"}
                    onClick={e => {
                      if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') setSelectedHotel(hotel);
                    }}
                  >
                    <Card.Img variant="top" src={hotel.images && hotel.images[0] ? getImageUrl(hotel.images[0].image_url) : "/default-hotel.jpg"} style={{ height: 180, objectFit: "cover" }} onError={e => { e.target.style.display = 'none'; }} />
                    <Card.Body>
                      <Card.Title className="fw-bold" style={{ color: selectedHotel?.id === hotel.id ? '#1a5bb8' : undefined }}>{hotel.name}</Card.Title>
                      <Card.Text>
                        <span>{hotel.address}</span><br/>
                        <span className="text-muted">{hotel.city}</span>
                      </Card.Text>
                      <div className="d-flex gap-2 mt-2">
                        <Button variant={selectedHotel?.id === hotel.id ? "primary" : "outline-primary"} size="sm" onClick={e => { e.stopPropagation(); setSelectedHotel(hotel); }}>
                          {selectedHotel?.id === hotel.id ? "Đã chọn" : "Chọn"}
                        </Button>
                        <Button variant="success" size="sm" className="ms-2" onClick={e => { e.stopPropagation(); setBookingHotel(hotel); setShowBookingModal(true); setBookingCheckIn(""); setBookingCheckOut(""); setBookingStatus(null); }}>
                          Booking now
                        </Button>
                        <Link to={`/hotels/${hotel.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-sm" onClick={e => e.stopPropagation()}>
                          Xem chi tiết
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Check-in/out date pickers
      <div className="mb-3 d-flex gap-3 align-items-end">
        <div>
          <label className="form-label">Ngày nhận phòng</label>
          <input type="date" className="form-control" value={hotelCheckIn} onChange={e => setHotelCheckIn(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Ngày trả phòng</label>
          <input type="date" className="form-control" value={hotelCheckOut} onChange={e => setHotelCheckOut(e.target.value)} />
        </div>
      </div> */}

      In trip summary, show selected hotel as a card
      {selectedHotel && (
        <div className="mt-4">
          <h6>Khách sạn đã chọn</h6>
          <Card style={{ width: "18rem" }}>
            <Card.Img variant="top" src={selectedHotel.images && selectedHotel.images[0] ? getImageUrl(selectedHotel.images[0].image_url) : "/default-hotel.jpg"} style={{ height: 120, objectFit: "cover" }} onError={e => { e.target.style.display = 'none'; }} />
            <Card.Body>
              <Card.Title>{selectedHotel.name}</Card.Title>
              <Card.Text>
                <span>{selectedHotel.address}</span><br/>
                <span className="text-muted">{selectedHotel.city}</span>
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Submit Button */}
      <div className="text-center mt-4">
        <button 
          className="btn btn-main btn-lg px-5" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <i className="bi bi-spinner fa-spin me-2"></i>
              Đang tạo tour...
            </>
          ) : (
            <>
              <i className="bi bi-save me-2"></i>
              Tạo tour
            </>
          )}
        </button>
      </div>

      {/* Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Đặt phòng khách sạn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Ngày nhận phòng</Form.Label>
              <Form.Control type="date" value={bookingCheckIn} onChange={e => setBookingCheckIn(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ngày trả phòng</Form.Label>
              <Form.Control type="date" value={bookingCheckOut} onChange={e => setBookingCheckOut(e.target.value)} />
            </Form.Group>
            {bookingHotel && bookingHotel.room_types && (
              <Form.Group className="mb-3">
                <Form.Label>Loại phòng</Form.Label>
                <Form.Select value={selectedRoomType} onChange={e => setSelectedRoomType(e.target.value)}>
                  <option value="">Chọn loại phòng</option>
                  {Array.isArray(bookingHotel.room_types)
                    ? bookingHotel.room_types.map((type, idx) => (
                        <option key={idx} value={type}>{type}</option>
                      ))
                    : (JSON.parse(bookingHotel.room_types || '[]')).map((type, idx) => (
                        <option key={idx} value={type}>{type}</option>
                      ))}
                </Form.Select>
              </Form.Group>
            )}
            {bookingStatus === 'success' && <div className="alert alert-success">Đặt phòng thành công!</div>}
            {bookingStatus === 'error' && <div className="alert alert-danger">Đặt phòng thất bại. Vui lòng thử lại.</div>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
            Đóng
          </Button>
          <Button variant="success" onClick={async () => {
            setBookingStatus(null);
            try {
              await hotelApi.bookHotel({
                user_id: user?.id,
                hotel_id: bookingHotel?.id,
                check_in: bookingCheckIn,
                check_out: bookingCheckOut,
                room_type: selectedRoomType,
              });
              setBookingStatus('success');
            } catch {
              setBookingStatus('error');
            }
          }} disabled={!bookingCheckIn || !bookingCheckOut}>
            Xác nhận đặt phòng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  if (noLayout) return mainContent;

  return (
    <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
      <Header />
      <main className="container py-4 flex-grow-1">
        {mainContent}
        {/* Success Modal */}
        {showSuccessModal && createdTour && (
          <div className="planner-modal-overlay" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Tạo tour thành công!</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowSuccessModal(false); navigate('/my-tours'); }}></button>
                </div>
                <div className="modal-body">
                  <p>Bạn đã tạo tour bắt đầu từ <b>{createdTour.name}</b> thành công.</p>
                  <div className="mb-2">
                    <b>Thời gian:</b> {createdTour.start_time || "-"} đến {createdTour.end_time || "-"}
                  </div>
                  
                  {/* Selected Cities and Tags Summary */}
                  {(selectedCity || selectedCities.length > 0 || selectedTags.length > 0) && (
                    <div className="mb-3">
                      <b>Lựa chọn của bạn:</b>
                      <div className="mt-2">
                        {(selectedCity || selectedCities.length > 0) && (
                          <div className="mb-2">
                            <small className="text-muted">
                              <i className="bi bi-geo-alt me-1"></i>
                              <strong>Thành phố:</strong>
                            </small>
                            <div className="mt-1">
                              {selectedCity && (
                                <span className="badge bg-primary me-1 mb-1">
                                  {selectedCity}
                                </span>
                              )}
                              {selectedCities.map((city, index) => (
                                <span key={index} className="badge bg-success me-1 mb-1">
                                  {city}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedTags.length > 0 && (
                          <div className="mb-2">
                            <small className="text-muted">
                              <i className="bi bi-tags me-1"></i>
                              <strong>Loại địa điểm:</strong>
                            </small>
                            <div className="mt-1">
                              {selectedTags.map(tagId => {
                                const tag = tags.find(t => String(t.id) === String(tagId));
                                if (!tag) return null;
                                return (
                                  <span key={tag.id} className="badge bg-info me-1 mb-1">
                                    {tag.name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Auto reminder message */}
                  {createdTour.start_time && (
                    <div className="alert alert-info mt-3">
                      <i className="bi bi-bell me-2"></i>
                      <strong>Nhắc nhở tự động:</strong> Bạn sẽ nhận được thông báo nhắc nhở trước khi tour bắt đầu.
                    </div>
                  )}
                  <div className="mb-2">
                    <b>Kế hoạch:</b>
                    <ul>
                      {sortedDays.map(dayNum => (
                        <li key={dayNum}>
                          <b>Ngày {dayNum}:</b> {stepsByDay[dayNum].map(step => {
                            const place = getSelectedPlace(step.place_id);
                            return place ? place.name : "(Chưa chọn địa điểm)";
                          }).join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  {createdTour.id && (
                    <button className="btn btn-main" onClick={() => navigate(`/tours/${createdTour.id}`)}>
                      Xem chi tiết tour
                    </button>
                  )}
                  <button className="btn btn-outline-secondary" onClick={() => navigate('/my-tours')}>
                    Đến trang My Tours
                  </button>
                  <button className="btn btn-link" onClick={() => setShowSuccessModal(false)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default ManualPlanner;
