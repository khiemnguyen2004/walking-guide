import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import Map from "../components/Map.jsx";
import ManualPlanner from "../components/ManualPlanner.jsx";
import AutoPlanner from "../components/AutoPlanner.jsx";
import PlaceDetailMap from "../components/PlaceDetailMap";
import PlaceExplorer from '../components/PlaceExplorer';
import "../css/HomePage.css";
import "../css/luxury-home.css";
import { Modal, Button, Form } from "react-bootstrap";
import RatingStars from '../components/RatingStars.jsx';
import dayjs from "dayjs";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../contexts/AuthContext';
import tourApi from '../api/tourApi';
import hotelApi from '../api/hotelApi';
import { AuthContext } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';
import formatVND from '../utils/formatVND';
const BASE_URL = "https://walkingguide.onrender.com";

// Helper to chunk array into groups of 3
function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function HomePage() {
  const { t } = useTranslation();
  const [places, setPlaces] = useState([]);
  const [tours, setTours] = useState([]);
  const [articles, setArticles] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [showAuto, setShowAuto] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showPlaceDetailMap, setShowPlaceDetailMap] = useState(false);
  const [placeForDetailMap, setPlaceForDetailMap] = useState(null);
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const [showAllTours, setShowAllTours] = useState(false);
  const [showAllHotels, setShowAllHotels] = useState(false);
  const [showAllRestaurants, setShowAllRestaurants] = useState(false);
  const mapRef = useRef();
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showTourDateModal, setShowTourDateModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateError, setDateError] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingHotel, setBookingHotel] = useState(null);
  const [bookingCheckIn, setBookingCheckIn] = useState("");
  const [bookingCheckOut, setBookingCheckOut] = useState("");
  const [bookingStatus, setBookingStatus] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const { user } = useContext(AuthContext);

  // Helper function to get proper image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Already absolute URL
    }
    // Prepend backend URL for relative paths
    return `${BASE_URL}${imageUrl}`;
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
    try {
      await tourApi.bookTour(selectedTour.id, user.id, startDate, endDate);
      setShowTourDateModal(false);
      alert("Đặt tour thành công!");
    } catch (err) {
      setDateError(err?.response?.data?.error || "Lỗi khi đặt tour. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [placesRes, toursRes, articlesRes, hotelsRes, restaurantsRes] = await Promise.all([
          axiosClient.get("/places"),
          axiosClient.get("/tours?adminOnly=true"),
          axiosClient.get("/articles"),
          axiosClient.get("/hotels"),
          axiosClient.get("/restaurants"),
        ]);
        setPlaces(placesRes.data);
        setTours(toursRes.data);
        setArticles(articlesRes.data);
        setHotels(hotelsRes.data.data); // Fix: access the data property
        setRestaurants(restaurantsRes.data.data); // Fix: access the data property
      } catch (err) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onlyOneOpen = showManual || showAuto;

  // Sort places by updated_at descending to show recently updated places first
  const sortedPlaces = Array.isArray(places)
    ? [...places].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    : [];

  // Sort tours by updated_at descending to show recently updated tours first
  const sortedTours = Array.isArray(tours)
    ? [...tours].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    : [];

  // Sort articles by updated_at descending to show recently updated articles first
  const sortedArticles = Array.isArray(articles)
    ? [...articles].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    : [];

  // Sort hotels by rating descending to show highly rated hotels first
  const sortedHotels = Array.isArray(hotels)
    ? [...hotels].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    : [];

  // Sort restaurants by rating descending to show highly rated restaurants first
  const sortedRestaurants = Array.isArray(restaurants)
    ? [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    : [];

  // Extract unique cities from places
  const cities = Array.from(new Set(places.map(p => p.city).filter(Boolean)));

  // Handle search input for places
  const handlePlaceInput = (e) => {
    const value = e.target.value;
    setPlaceQuery(value);
    setPlaceSuggestions(
      value
        ? places.filter(place => place.name.toLowerCase().includes(value.toLowerCase()))
        : []
    );
    setHighlightedIndex(-1);
  };

  // Handle place selection
  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    setPlaceQuery(place.name);
    setPlaceSuggestions([]);
    setHighlightedIndex(-1);
  };

  // Keyboard navigation for suggestions
  const handlePlaceKeyDown = (e) => {
    if (placeSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev + 1) % placeSuggestions.length);
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => (prev - 1 + placeSuggestions.length) % placeSuggestions.length);
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handlePlaceSelect(placeSuggestions[highlightedIndex]);
    }
  };

  // Clear search
  const clearSearch = () => {
    setPlaceQuery("");
    setPlaceSuggestions([]);
    setSelectedPlace(null);
    setHighlightedIndex(-1);
  };

  // Handler for the special link
  const handleExploreMapClick = (e) => {
    e.preventDefault();
    setPlaceForDetailMap(null); // Show map with no specific place
    setShowPlaceDetailMap(true);
  };

  // In hotel card rendering, replace hotel.images[0].image_url with the main image logic:
  const getMainHotelImage = (hotel) => {
    if (!hotel.images || hotel.images.length === 0) return null;
    const mainImg = hotel.images.find(img => img.is_primary) || hotel.images[0];
    return mainImg.image_url;
  };

  return (
    <>
      <Header />
      <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
      {/* <Header /> */}
      <div className="bg-planner-map" id="planner-section">
            {/* Hero Section with shared background */}
            <section className="hero-with-bg">
              <h1>{t('Discover & Plan Your Smart Trip')}</h1>
              <p>{t('Find places, create your own itinerary, or let us suggest the perfect trip for you!')}</p>
              <a href="#planner-section" className="btn btn-main">{t('Start Planning')}</a>
            </section>
          <div className={`row mb-5 g-4 luxury-planner-row justify-content-center`}> 
            <div className="col-12 col-md-6 d-flex justify-content-center mb-4">
              <div
                className="luxury-card luxury-planner-card manual-homepage p-4 d-flex flex-column align-items-center justify-content-center text-center hover-shadow"
                style={{ maxWidth: '550px', cursor: 'pointer' }}
                onClick={() => setShowManualModal(true)}
              >
                <div className="d-flex align-items-center gap-2 mb-2 justify-content-center">
                  <h2 className="h5 fw-bold mb-0">{t('Manual Planning')}</h2>
                  <i className="bi bi-car-front" style={{fontSize: 20, marginLeft: 6, color: '#3498db'}} aria-label="manual icon"></i>
                </div>
                <p className="text-muted mb-0">{t('Want to plan your own trip? Use manual mode to create your custom tour.')}</p>
              </div>
            </div>
            <div className="col-12 col-md-6 d-flex justify-content-center mb-4">
              <div
                className="luxury-card luxury-planner-card p-4 d-flex flex-column align-items-center justify-content-center text-center hover-shadow"
                style={{ maxWidth: '550px', cursor: 'pointer' }}
                onClick={() => setShowAutoModal(true)}
              >
                <div className="d-flex align-items-center gap-2 mb-2 justify-content-center">
                  <h2 className="h5 fw-bold mb-0">{t('Auto Planning')}</h2>
                  <i className="bi bi-robot" style={{fontSize: 20, marginLeft: 6, color: '#3498db'}} aria-label="autopilot icon"></i>
                </div>
                <p className="text-muted mb-0">{t('Want us to create a suitable itinerary? Try auto mode for our suggestions!')}</p>
              </div>
            </div>
          </div>

          {/* Manual Planner Modal */}
          <Modal show={showManualModal} onHide={() => setShowManualModal(false)} size="lg" centered dialogClassName="luxury-modal">
            <Modal.Header closeButton className="luxury-modal-header">
              <span className="modal-icon me-2"><i className="bi bi-pencil-square"></i></span>
              <Modal.Title className="luxury-modal-title">{t('Manual Planning')}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="luxury-modal-body">
              <ManualPlanner noLayout />
            </Modal.Body>
          </Modal>

          {/* Auto Planner Modal */}
          <Modal show={showAutoModal} onHide={() => setShowAutoModal(false)} size="lg" centered dialogClassName="luxury-modal">
            <Modal.Header closeButton className="luxury-modal-header">
              <span className="modal-icon me-2"><i className="bi bi-robot"></i></span>
              <Modal.Title className="luxury-modal-title">{t('Auto Planning')}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="luxury-modal-body">
              <AutoPlanner noLayout />
            </Modal.Body>
          </Modal>
            <section className="mb-6">
            <h2 className="h4 mb-3 fw-bold text-center text-light">
              {t('No plans yet? Explore the travel map!')}{' '}
              <a href="#" onClick={handleExploreMapClick} className="arrow-link ms-2" style={{textDecoration: 'none'}}>
                <i className="bi bi-arrow-right" style={{fontSize: 24, verticalAlign: 'middle', color: '#fff'}}></i>
              </a>
            </h2>
            {/* Search bar for place */}
            <div className="mb-3 position-relative" style={{maxWidth: 400, margin: '0 auto'}}>
              <div className="input-group shadow rounded-pill">
                <span className="input-group-text bg-white border-0 rounded-start-pill" style={{paddingRight: 0}}>
                  <i className="bi bi-search text-primary" style={{fontSize: 20}}></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 rounded-end-pill"
                  placeholder={t('Search for a place...')}
                  value={placeQuery}
                  onChange={handlePlaceInput}
                  onKeyDown={handlePlaceKeyDown}
                  style={{boxShadow: 'none', background: 'white'}}
                />
                {placeQuery && (
                  <button className="btn btn-link px-2" style={{color: '#fff'}} onClick={clearSearch} tabIndex={-1}>
                    <i className="bi bi-x-circle" style={{fontSize: 20}}></i>
                  </button>
                )}
              </div>
              {placeSuggestions.length > 0 && (
                <ul className="list-group position-absolute shadow-lg rounded-4 mt-1" style={{zIndex: 10, width: '100%', overflow: 'hidden'}}>
                  {placeSuggestions.map((place, idx) => (
                    <li
                      key={place.id}
                      className={`list-group-item list-group-item-action d-flex align-items-center gap-2 py-2 px-3 border-0 ${idx === highlightedIndex ? 'bg-primary text-white' : ''}`}
                      onClick={() => handlePlaceSelect(place)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      style={{cursor: 'pointer', fontWeight: 500, fontSize: '1rem', borderBottom: idx !== placeSuggestions.length - 1 ? '1px solid #f1f3f4' : 'none', background: idx === highlightedIndex ? '#3498db' : 'white'}}
                    >
                      <i className="bi bi-geo-alt-fill text-primary" style={{fontSize: 18, color: idx === highlightedIndex ? 'white' : '#3498db'}}></i>
                      <span>{place.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div id="map-section" className="card shadow-lg border-0 rounded-4">
              <div className="card-body" style={{ height: "24rem" }}>
                <ErrorBoundary>
                  <Map
                    ref={mapRef}
                    locations={selectedPlace ? [{
                      id: selectedPlace.id,
                      name: selectedPlace.name,
                      lat: selectedPlace.latitude,
                      lng: selectedPlace.longitude,
                      image_url: selectedPlace.image_url,
                    }] : places.map((p) => ({
                      id: p.id,
                      name: p.name,
                      lat: p.latitude,
                      lng: p.longitude,
                        image_url: p.image_url,
                    }))}
                    hotels={hotels}
                    restaurants={restaurants}
                    className="w-100 h-100"
                    selectedPlace={selectedPlace}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </section>
          </div>
        <main className="container flex-grow-1 main-content-mobile" style={{ paddingTop: 80 }}>
        
        {/* </div> */}
        {/* <hr className="my-5 luxury-divider" /> */}
        {loading ? (
          <p className="text-muted text-center">{t('Loading data...')}</p>
        ) : error ? (
          <p className="text-danger text-center">{error}</p>
        ) : (
          <>
            <section className="cards-section mb-6">
              <h2 className="h4 mb-4 fw-bold luxury-section-title">
                {t('Featured Destinations')}
              </h2>
              {sortedPlaces.length === 0 ? (
                <p className="text-muted text-center">{t('No destinations to display.')}</p>
              ) : showAllPlaces ? (
                <>
                  <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {sortedPlaces.map((p) => (
                      <div className="col" key={p.id || p._id || p.name}>
                        <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                          <Link to={`/places/${p.id || p._id}`} className="text-decoration-none">
                            <img
                              src={p.image_url ? (p.image_url.startsWith("http") ? p.image_url : `${BASE_URL}${p.image_url}`) : undefined}
                              alt={p.name}
                              className="card-img-top luxury-img-top"
                              style={{
                                height: 220,
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.target.src = undefined;
                              }}
                            />
                            {!p.image_url && (
                              <div className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                                style={{ height: 220, borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", fontSize: "3rem" }}>
                                <i className="bi bi-geo-alt-fill"></i>
                              </div>
                            )}
                            <div className="card-body luxury-card-body">
                              <h3 className="card-title mb-2" style={{ fontWeight: 600 }}>{p.name}</h3>
                              {p.city && (
                                <p className="card-text text-primary mb-1 small">
                                  <i className="bi bi-geo-alt-fill me-1"></i>
                                  {p.city}
                                </p>
                              )}
                              <p className="card-text text-muted mb-2 luxury-desc">
                                {p.description
                                  ? `${p.description.replace(/<[^>]+>/g, '').substring(0, 100)}...`
                                  : t("No description available")}
                              </p>
                              {p.service && (
                                <p className="card-text text-muted mb-2 small">
                                  <i className="bi bi-activity me-1"></i>
                                  {p.service.length > 80 ? `${p.service.substring(0, 80)}...` : p.service}
                                </p>
                              )}
                              <div className="mb-2">
                                <span className="luxury-star" style={{ color: '#f1c40f', fontSize: 18 }}>★</span>
                                <span style={{ fontWeight: 600, marginLeft: 4 }}>{p.rating ? p.rating.toFixed(1) : '0.0'}</span>
                                <span style={{ color: '#888', marginLeft: 2 }}>/ 5</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-center mt-4">
                    <button
                      className="btn btn-main btn-lg px-5"
                      onClick={() => setShowAllPlaces(false)}
                    >
                      {t('Show Less')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div id="placesCarousel" className="carousel slide" data-bs-ride="carousel">
                    <div className="carousel-inner">
                      {chunkArray(sortedPlaces, 3).map((group, idx) => (
                        <div className={`carousel-item${idx === 0 ? ' active' : ''}`} key={group.map(p => p.id || p._id || p.name).join('-')}>
                          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-5 justify-content-center">
                            {group.map((p) => (
                              <div className="col" key={p.id || p._id || p.name}>
                                <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                                  <Link to={`/places/${p.id || p._id}`} className="text-decoration-none">
                                    <img
                                      src={p.image_url ? (p.image_url.startsWith("http") ? p.image_url : `${BASE_URL}${p.image_url}`) : undefined}
                                      alt={p.name}
                                      className="card-img-top luxury-img-top"
                                      style={{
                                        height: 220,
                                        objectFit: "cover",
                                      }}
                                      onError={(e) => {
                                        e.target.src = undefined;
                                      }}
                                    />
                                    {!p.image_url && (
                                      <div className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                                        style={{ height: 220, borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", fontSize: "3rem" }}>
                                        <i className="bi bi-geo-alt-fill"></i>
                                      </div>
                                    )}
                                    <div className="card-body luxury-card-body">
                                      <h3 className="card-title mb-2" style={{ fontWeight: 600 }}>{p.name}</h3>
                                      {p.city && (
                                        <p className="card-text text-primary mb-1 small">
                                          <i className="bi bi-geo-alt-fill me-1"></i>
                                          {p.city}
                                        </p>
                                      )}
                                      <p className="card-text text-muted mb-2 luxury-desc">
                                        {p.description
                                          ? `${p.description.replace(/<[^>]+>/g, '').substring(0, 100)}...`
                                          : t("No description available")}
                                      </p>
                                      {p.service && (
                                        <p className="card-text text-muted mb-2 small">
                                          <i className="bi bi-activity me-1"></i>
                                          {p.service.length > 80 ? `${p.service.substring(0, 80)}...` : p.service}
                                        </p>
                                      )}
                                      <div className="mb-2">
                                        <span className="luxury-star" style={{ color: '#f1c40f', fontSize: 18 }}>★</span>
                                        <span style={{ fontWeight: 600, marginLeft: 4 }}>{p.rating ? p.rating.toFixed(1) : '0.0'}</span>
                                        <span style={{ color: '#888', marginLeft: 2 }}>/ 5</span>
                                      </div>
                                    </div>
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Carousel controls for places */}
                    <button className="carousel-control-prev" type="button" data-bs-target="#placesCarousel" data-bs-slide="prev"
                      style={{ width: '5rem', height: '5rem', top: '50%', left: '-4rem', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="carousel-control-prev-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                      <span className="visually-hidden">Previous</span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#placesCarousel" data-bs-slide="next"
                      style={{ width: '5rem', height: '5rem', top: '50%', right: '-4rem', left: 'auto', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="carousel-control-next-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                      <span className="visually-hidden">Next</span>
                    </button>
                    <div className="d-flex justify-content-center mt-4">
                      <button
                        className="btn btn-main btn-lg px-5"
                        onClick={() => setShowAllPlaces(true)}
                      >
                        {t('Explore More')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
            <hr className="my-5 luxury-divider" />
            <section className="cards-section mb-6">
              <h2 className="h4 mb-4 fw-bold luxury-section-title">
                {t('Trips & Itineraries')}
              </h2>
              {sortedTours.length === 0 ? (
                <p className="text-muted">{t('No tours to display.')}</p>
              ) : showAllTours ? (
                <>
                  <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {sortedTours.map((tour) => (
                      <div className="col" key={tour.id}>
                        <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                          <Link to={`/tours/${tour.id}`} className="text-decoration-none">
                            {tour.image_url ? (
                              <img
                                src={tour.image_url.startsWith("http") ? tour.image_url : `${BASE_URL}${tour.image_url}`}
                                alt={tour.name}
                                className="card-img-top luxury-img-top"
                                style={{ height: 220, objectFit: "cover"}}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div 
                                className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                                style={{ height: 220, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", fontSize: "3rem" }}
                              >
                                <i className="bi bi-map"></i>
                              </div>
                            )}
                            <div className="card-body luxury-card-body">
                              <h3 className="card-title mb-2" style={{ fontWeight: 600 }}>{tour.name}</h3>
                              {tour.description && (
                                <p className="card-text text-muted mb-2 luxury-desc">
                                  {`${tour.description.replace(/<[^>]+>/g, '').substring(0, 100)}...`}
                                </p>
                              )}
                              <div className="mb-2">
                                <span className="luxury-star" style={{ color: '#f1c40f', fontSize: 18 }}>★</span>
                                <span style={{ fontWeight: 600, marginLeft: 4 }}>{tour.rating ? tour.rating.toFixed(1) : '0.0'}</span>
                                <span style={{ color: '#888', marginLeft: 2 }}>/ 5</span>
                              </div>
                              {tour.total_cost && (
                                <p className="card-text text-muted small mb-0 luxury-rating">
                                  <span className="luxury-money"><i className="bi bi-coin"></i></span> {formatVND(tour.total_cost)}
                                </p>
                              )}
                            </div>
                          </Link>
                          <div className="px-3 pb-3">
                            <button className="btn btn-main w-100 mt-2" onClick={() => { setSelectedTour(tour); setShowTourDateModal(true); }}>{t('Start Tour')}</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-center mt-4">
                    <button
                      className="btn btn-main btn-lg px-5"
                      onClick={() => setShowAllTours(false)}
                    >
                      {t('Show Less')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div id="toursCarousel" className="carousel slide" data-bs-ride="carousel">
                    <div className="carousel-inner">
                      {chunkArray(sortedTours, 3).map((group, idx) => (
                        <div className={`carousel-item${idx === 0 ? ' active' : ''}`} key={group.map(tour => tour.id).join('-')}>
                          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-5 justify-content-center">
                            {group.map((tour) => (
                              <div className="col" key={tour.id}>
                                <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                                  <Link to={`/tours/${tour.id}`} className="text-decoration-none">
                                    {tour.image_url ? (
                                      <img
                                        src={tour.image_url.startsWith("http") ? tour.image_url : `${BASE_URL}${tour.image_url}`}
                                        alt={tour.name}
                                        className="card-img-top luxury-img-top"
                                        style={{ height: 220, objectFit: "cover" }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div 
                                        className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                                        style={{ height: 220, borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", fontSize: "3rem" }}
                                      >
                                        <i className="bi bi-map"></i>
                                      </div>
                                    )}
                                    <div className="card-body luxury-card-body">
                                      <h3 className="card-title mb-2" style={{ fontWeight: 600 }}>{tour.name}</h3>
                                      {tour.description && (
                                        <p className="card-text text-muted mb-2 luxury-desc">
                                          {`${tour.description.replace(/<[^>]+>/g, '').substring(0, 100)}...`}
                                        </p>
                                      )}
                                      <div className="mb-2">
                                        <span className="luxury-star" style={{ color: '#f1c40f', fontSize: 18 }}>★</span>
                                        <span style={{ fontWeight: 600, marginLeft: 4 }}>{tour.rating ? tour.rating.toFixed(1) : '0.0'}</span>
                                        <span style={{ color: '#888', marginLeft: 2 }}>/ 5</span>
                                      </div>
                                      {tour.total_cost && (
                                        <p className="card-text text-muted small mb-0 luxury-rating">
                                          <span className="luxury-money"><i className="bi bi-coin"></i></span> {formatVND(tour.total_cost)}
                                        </p>
                                      )}
                                    </div>
                                  </Link>
                                  <div className="px-3 pb-3">
                                    <Link to={`/tours/${tour.id}`} className="btn btn-main w-100 mt-2">
                                      {t('Start Tour')}
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Carousel controls for tours */}
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
                    <div className="d-flex justify-content-center mt-4">
                      <button
                        className="btn btn-main btn-lg px-5"
                        onClick={() => setShowAllTours(true)}
                      >
                        {t('Join Now')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
            <hr className="my-5 luxury-divider" />
            
            {/* Hotels Section */}
            <section className="cards-section mb-6">
              <h2 className="h4 mb-4 fw-bold luxury-section-title">
                <i className="bi bi-building me-2"></i>
                {t('Top Hotels')}
              </h2>
              {sortedHotels.length === 0 ? (
                <p className="text-muted">{t('No hotels to display.')}</p>
              ) : showAllHotels ? (
                <>
                  <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {sortedHotels.map((hotel) => (
                      <div className="col" key={hotel.id}>
                        <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                          <Link to={`/hotels/${hotel.id}`} className="text-decoration-none" style={{ display: 'block', height: '100%' }}>
                            <div className="position-relative">
                              {hotel.images && hotel.images.length > 0 ? (
                                <div id={`hotelCarousel${hotel.id}`} className="carousel slide" data-bs-ride="false">
                                  <div className="carousel-inner">
                                    {hotel.images.map((image, index) => (
                                      <div className={`carousel-item${index === 0 ? ' active' : ''}`} key={image.id}>
                                        <img
                                          src={getImageUrl(image.image_url)}
                                          alt={image.caption || hotel.name}
                                          className="card-img-top luxury-img-top"
                                          style={{ height: 220, objectFit: "cover"}}
                                          onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  {hotel.images.length > 1 && (
                                    <>
                                      <button className="carousel-control-prev" type="button" data-bs-target={`#hotelCarousel${hotel.id}`} data-bs-slide="prev">
                                        <span className="carousel-control-prev-icon"></span>
                                      </button>
                                      <button className="carousel-control-next" type="button" data-bs-target={`#hotelCarousel${hotel.id}`} data-bs-slide="next">
                                        <span className="carousel-control-next-icon"></span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div 
                                  className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                                  style={{ height: 220, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", fontSize: "3rem" }}
                                >
                                  <i className="bi bi-building"></i>
                                </div>
                              )}
                              <div className="position-absolute top-0 end-0 m-2">
                                <span className="badge bg-warning text-dark">
                                  {hotel.stars} <i className="bi bi-star-fill"></i>
                                </span>
                              </div>
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
                                  : t("No description available")}
                              </p>
                              <RatingStars id={hotel.id} type="hotel" />
                              {hotel.price_range && (
                                <p className="card-text text-muted small mb-0">
                                  <span className="luxury-money"><i className="bi bi-coin"></i></span> {formatVND(hotel.price_range)}
                                  {hotel.min_price > 0 && ` (${formatVND(hotel.min_price)})`}
                                </p>
                              )}
                            </div>
                          </Link>
                          <div className="px-3 pb-3">
                            <Button className="btn btn-main w-100 mt-2 " onClick={() => { setBookingHotel(hotel); setShowBookingModal(true); }}>
                              <i className="bi bi-calendar-check me-2"></i>Đặt ngay
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-center mt-4">
                    <button
                      className="btn btn-main btn-lg px-5"
                      onClick={() => setShowAllHotels(false)}
                    >
                      {t('Show Less')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div id="hotelsCarousel" className="carousel slide" data-bs-ride="carousel">
                    <div className="carousel-inner">
                      {chunkArray(sortedHotels, 3).map((group, idx) => (
                        <div className={`carousel-item${idx === 0 ? ' active' : ''}`} key={group.map(hotel => hotel.id).join('-')}>
                          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-5 justify-content-center">
                            {group.map((hotel) => (
                              <div className="col" key={hotel.id}>
                                <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                                  <Link to={`/hotels/${hotel.id}`} className="text-decoration-none" style={{ display: 'block', height: '100%' }}>
                                    <div className="position-relative">
                                      {hotel.images && hotel.images.length > 0 ? (
                                        <div id={`hotelCarousel${hotel.id}`} className="carousel slide" data-bs-ride="false">
                                          <div className="carousel-inner">
                                            {hotel.images.map((image, index) => (
                                              <div className={`carousel-item${index === 0 ? ' active' : ''}`} key={image.id}>
                                                <img
                                                  src={getImageUrl(image.image_url)}
                                                  alt={image.caption || hotel.name}
                                                  className="card-img-top luxury-img-top"
                                                  style={{ height: 220, objectFit: "cover" }}
                                                  onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                          {hotel.images.length > 1 && (
                                            <>
                                              <button className="carousel-control-prev" type="button" data-bs-target={`#hotelCarousel${hotel.id}`} data-bs-slide="prev">
                                                <span className="carousel-control-prev-icon"></span>
                                              </button>
                                              <button className="carousel-control-next" type="button" data-bs-target={`#hotelCarousel${hotel.id}`} data-bs-slide="next">
                                                <span className="carousel-control-next-icon"></span>
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <div 
                                          className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                                          style={{ height: 220, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", fontSize: "3rem" }}
                                        >
                                          <i className="bi bi-building"></i>
                                        </div>
                                      )}
                                      <div className="position-absolute top-0 end-0 m-2">
                                        <span className="badge bg-warning text-dark">
                                          {hotel.stars} <i className="bi bi-star-fill"></i>
                                        </span>
                                      </div>
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
                                          : t("No description available")}
                                      </p>
                                      <RatingStars id={hotel.id} type="hotel" />
                                      {hotel.price_range && (
                                        <p className="card-text text-muted small mb-0">
                                          <span className="luxury-money"><i className="bi bi-coin"></i></span> {formatVND(hotel.price_range)}
                                          {hotel.min_price > 0 && ` (${formatVND(hotel.min_price)})`}
                                        </p>
                                      )}
                                    </div>
                                  </Link>
                                  <div className="px-3 pb-3">
                                    <Button className="btn btn-main w-100 mt-2" onClick={() => { setBookingHotel(hotel); setShowBookingModal(true); }}>
                                      <i className="bi bi-calendar-check me-2"></i>{t('Đặt ngay')}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="carousel-control-prev" type="button" data-bs-target="#hotelsCarousel" data-bs-slide="prev"
                      style={{ width: '5rem', height: '5rem', top: '50%', left: '-4rem', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="carousel-control-prev-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                      <span className="visually-hidden">Previous</span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#hotelsCarousel" data-bs-slide="next"
                      style={{ width: '5rem', height: '5rem', top: '50%', right: '-4rem', left: 'auto', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="carousel-control-next-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                      <span className="visually-hidden">Next</span>
                    </button>
                    <div className="d-flex justify-content-center mt-4">
                      <button
                        className="btn btn-main btn-lg px-5"
                        onClick={() => setShowAllHotels(true)}
                      >
                        {t('View All Hotels')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
            
            <hr className="my-5 luxury-divider" />
            
            {/* Restaurants Section */}
            <section className="cards-section mb-6">
              <h2 className="h4 mb-4 fw-bold luxury-section-title">
                <i className="bi bi-cup-hot me-2"></i>
                {t('Top Restaurants')}
              </h2>
              {sortedRestaurants.length === 0 ? (
                <p className="text-muted">{t('No restaurants to display.')}</p>
              ) : showAllRestaurants ? (
                <>
                  <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {sortedRestaurants.map((restaurant) => (
                      <div className="col" key={restaurant.id}>
                        <Link to={`/restaurants/${restaurant.id}`} className="text-decoration-none">
                          <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                            <div className="position-relative">
                              {restaurant.images && restaurant.images.length > 0 ? (
                                        <img
                                  src={getImageUrl(restaurant.images[0].image_url)}
                                  alt={restaurant.name}
                                          className="card-img-top luxury-img-top"
                                          style={{ height: 220, objectFit: "cover" }}
                                />
                              ) : (
                                <div className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                                  style={{ height: 220, borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)", color: "white", fontSize: "3rem" }}>
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
                                  : t("No description available")}
                              </p>
                              <RatingStars id={restaurant.id} type="restaurant" />
                              {restaurant.price_range && (
                                <p className="card-text text-muted small mb-0">
                                    <span className="luxury-money"><i className="bi bi-coin"></i></span> {formatVND(restaurant.price_range)}
                                  {restaurant.min_price > 0 && ` (${formatVND(restaurant.min_price)})`}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-center mt-4">
                    <button
                      className="btn btn-main btn-lg px-5"
                      onClick={() => setShowAllRestaurants(false)}
                    >
                      {t('Show Less')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div id="restaurantsCarousel" className="carousel slide" data-bs-ride="carousel">
                    <div className="carousel-inner">
                      {chunkArray(sortedRestaurants, 3).map((group, idx) => (
                        <div className={`carousel-item${idx === 0 ? ' active' : ''}`} key={group.map(restaurant => restaurant.id).join('-')}>
                          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-5 justify-content-center">
                            {group.map((restaurant) => (
                              <div className="col" key={restaurant.id}>
                                <Link to={`/restaurants/${restaurant.id}`} className="text-decoration-none">
                                  <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                                    <div className="position-relative">
                                      {restaurant.images && restaurant.images.length > 0 ? (
                                                <img
                                          src={getImageUrl(restaurant.images[0].image_url)}
                                          alt={restaurant.name}
                                                  className="card-img-top luxury-img-top"
                                                  style={{ height: 220, objectFit: "cover" }}
                                        />
                                      ) : (
                                        <div 
                                          className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                                          style={{ height: 220, borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)", color: "white", fontSize: "3rem" }}
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
                                          : t("No description available")}
                                      </p>
                                      <RatingStars id={restaurant.id} type="restaurant" />
                                      {restaurant.price_range && (
                                        <p className="card-text text-muted small mb-0">
                                          <span className="luxury-money"><i className="bi bi-coin"></i></span> {formatVND(restaurant.price_range)}
                                          {restaurant.min_price > 0 && ` (${formatVND(restaurant.min_price)})`}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="carousel-control-prev" type="button" data-bs-target="#restaurantsCarousel" data-bs-slide="prev"
                      style={{ width: '5rem', height: '5rem', top: '50%', left: '-4rem', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="carousel-control-prev-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                      <span className="visually-hidden">Previous</span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#restaurantsCarousel" data-bs-slide="next"
                      style={{ width: '5rem', height: '5rem', top: '50%', right: '-4rem', left: 'auto', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="carousel-control-next-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                      <span className="visually-hidden">Next</span>
                    </button>
                    <div className="d-flex justify-content-center mt-4">
                      <button
                        className="btn btn-main btn-lg px-5"
                        onClick={() => setShowAllRestaurants(true)}
                      >
                        {t('View All Restaurants')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
            
            {/* Fast Plan Banner Section with Winding Route and Random Places */}
            <section className="autoplanner-banner-section my-5 py-5 text-center rounded-4 shadow-lg" style={{
              background: `url('/banner2.jpg') center/cover no-repeat`,
              position: 'relative',
              boxShadow: '0 8px 32px 0 rgba(125, 127, 167, 0.13)'
            }}>
              <div style={{position: 'absolute', inset: 0, background: 'rgba(23, 22, 22, 0.25)', borderRadius: '1.5rem', zIndex: 1}}></div>
              <div className="container py-4" style={{position: 'relative', zIndex: 2}}>
                <h2 className="display-6 fw-bold mb-4" style={{color: '#fff'}}>
                  {t('Plan Quickly with')} <span style={{color: '#fff'}}>{t('AutoPlanner')}</span>
                </h2>
                {/* Winding route line with random places */}
                <div className="route-banner position-relative mb-4">
                  {/* SVG winding path */}
                  <svg width="100%" height="100" viewBox="0 0 1000 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position: 'absolute', top: 30, left: 0, zIndex: 1}}>
                    <defs>
                      <linearGradient id="routeGradient" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#5b9df9" />
                        <stop offset="1" stopColor="#b6e0fe" />
                      </linearGradient>
                    </defs>
                    <path d="M 50 50 Q 200 10, 350 50 T 650 50 T 950 50" stroke="url(#routeGradient)" strokeWidth="6" fill="none" strokeLinecap="round"/>
                  </svg>
                  {/* Place stops positioned along the path */}
                  {(() => {
                    const shuffled = [...sortedPlaces].sort(() => 0.5 - Math.random());
                    const picks = shuffled.slice(0, Math.min(5, shuffled.length));
                    // Adjusted positions for 5 stops along the SVG path with better spacing
                    const stopPositions = [50, 250, 500, 750, 950];
                    return picks.map((place, idx) => (
                      <Link to={`/places/${place.id}`} key={place.id} className="route-stop d-flex flex-column align-items-center position-absolute text-decoration-none route-stop-link" style={{zIndex: 2, left: `${stopPositions[idx] / 10}%`, top: idx % 2 === 0 ? 0 : 60, minWidth: 80, cursor: 'pointer'}}>
                        <div className="route-img-wrapper mb-2 shadow-lg rounded-circle bg-white d-flex align-items-center justify-content-center" style={{width: 64, height: 64, overflow: 'hidden', border: '3px solid #fff', transition: 'box-shadow 0.2s, border-color 0.2s'}}>
                          {place.image_url ? (
                            <img src={place.image_url.startsWith('http') ? place.image_url : `${BASE_URL}${place.image_url}`} alt={place.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                          ) : (
                            <i className="bi bi-geo-alt-fill" style={{fontSize: 36, color: '#fff'}}></i>
                          )}
                        </div>
                        <span className="fw-semibold small" style={{color: '#fff', maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{place.name}</span>
                      </Link>
                    ));
                  })()}
                </div>
                <p className="lead mb-3" style={{color: '#fff', fontWeight: 500}}>
                  {t('Your journey will be optimized with just one click!')}
                </p>
                <a href="#planner-section" className="btn btn-main btn-lg mt-2 px-4 py-2" style={{fontSize: '1.2rem'}}>{t('Get Started with AutoPlanner')}</a>
              </div>
            </section>
            <section className="cards-section mb-6">
              <h2 className="h4 mb-4 fw-bold luxury-section-title">
                {t('Read interesting shares from travelers')}
              </h2>
              {/* Bootstrap Carousel for all articles, 3 per slide */}
                {sortedArticles.length === 0 ? (
                  <p className="text-muted">{t('No articles to display.')}</p>
                ) : (
                <div id="articlesCarousel" className="carousel slide" data-bs-ride="carousel">
                  <div className="carousel-inner">
                    {chunkArray(sortedArticles, 3).map((group, idx) => (
                      <div className={`carousel-item${idx === 0 ? ' active' : ''}`} key={group.map(a => a.article_id).join('-')}>
                        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-5 justify-content-center">
                          {group.map((a) => (
                    <div className="col" key={a.article_id}>
                      <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                                <Link to={`/articles/${a.article_id}`} className="text-decoration-none">
                                  {a.image_url && (
                            <img
                                      src={a.image_url.startsWith("http") ? a.image_url : `${BASE_URL}${a.image_url}`}
                              alt="Ảnh"
                              className="card-img-top luxury-img-top"
                                      style={{ height: 220, objectFit: "cover"}}
                            />
                          )}
                          <div className="card-body luxury-card-body">
                                    <h3 className="card-title mb-2" style={{ fontWeight: 600 }}>{a.title}</h3>
                                    {a.content && (
                            <p className="card-text text-muted mb-2 luxury-desc">
                                        {`${a.content.replace(/<[^>]+>/g, '').substring(0, 100)}...`}
                            </p>
                                    )}
                          </div>
                        </Link>
                      </div>
                    </div>
                          ))}
                        </div>
                      </div>
                    ))}
              </div>
                  {/* Always show controls for consistency */}
                  <button className="carousel-control-prev" type="button" data-bs-target="#articlesCarousel" data-bs-slide="prev"
                    style={{ width: '5rem', height: '5rem', top: '50%', left: '-4rem', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="carousel-control-prev-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button className="carousel-control-next" type="button" data-bs-target="#articlesCarousel" data-bs-slide="next"
                    style={{ width: '5rem', height: '5rem', top: '50%', right: '-4rem', left: 'auto', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="carousel-control-next-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                  <div className="d-flex justify-content-center mt-4">
                    <Link to="/create-article" className="btn btn-main btn-lg px-5">
                      <i className="bi bi-pencil-square me-2"></i>
                      {t('Write Blog')}
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
      {showPlaceDetailMap && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2000, background: 'rgba(0,0,0,0.15)'}}>
          <PlaceDetailMap place={placeForDetailMap} onClose={() => setShowPlaceDetailMap(false)} />
        </div>
      )}
      {showTourDateModal && selectedTour && (
        <div className="modal fade show" style={{display:'block'}} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chọn ngày bắt đầu và kết thúc tour</h5>
                <button type="button" className="btn-close" onClick={() => setShowTourDateModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
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
                {dateError && <div className="alert alert-danger py-2">{dateError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTourDateModal(false)}>Đóng</button>
                <button type="button" className="btn btn-main" onClick={handleBookTour}>Xác nhận</button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex:1040}}></div>
        </div>
      )}
      {showBookingModal && bookingHotel && (
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
            }} disabled={!bookingCheckIn || !bookingCheckOut || !selectedRoomType}>
              Xác nhận đặt phòng
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  </>
  );
}

export default HomePage;