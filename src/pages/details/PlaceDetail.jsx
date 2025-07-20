import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import '../../css/PlaceDetailMap.css';
import axios from 'axios';
import LikeButton from '../../components/LikeButton';
import RatingStars from '../../components/RatingStars';
import CommentSection from '../../components/CommentSection';
import hotelIconSvg from '../../assets/hotel-marker.svg';
import restaurantIconSvg from '../../assets/restaurant-marker.svg';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom circular marker with place image (copied from Map.jsx)
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
                          <i className="bi bi-geo-alt-fill" style="fontSize: 24, color: '#3498db'"></i>
        </div>
      `,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconAnchor, iconAnchor],
      popupAnchor: [0, -iconAnchor - 5],
    });
  }
};

// OpenTripMap API constants
const OTM_API_KEY = '5ae2e3f221c38a28845f05b61952da66ed7231df6303c387c3d2a08c';
const OTM_BASE_URL = 'https://api.opentripmap.com/0.1/en/places';

const hotelIcon = new L.Icon({
  iconUrl: hotelIconSvg,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});
const restaurantIcon = new L.Icon({
  iconUrl: restaurantIconSvg,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const PlaceDetail = () => {
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [routeSteps, setRouteSteps] = useState([]);
  const [routePlaces, setRoutePlaces] = useState([]);
  const [routeTour, setRouteTour] = useState(null);
  const [allPlaces, setAllPlaces] = useState([]); // All places for map markers
  const [otmDetails, setOtmDetails] = useState(null);
  const [otmLoading, setOtmLoading] = useState(false);
  const [otmError, setOtmError] = useState(null);
  // Fetch nearby places (restaurants, hotels) from OpenTripMap
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [nearbyHotels, setNearbyHotels] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState(null);
  const [nearbyDetails, setNearbyDetails] = useState({}); // xid -> details
  const [hotels, setHotels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch place details
        const placeResponse = await fetch(`http://localhost:3000/api/places/${id}`);
        if (!placeResponse.ok) {
          throw new Error('Không tìm thấy địa điểm');
        }
        const placeData = await placeResponse.json();
        setPlace(placeData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
    // Fetch all places for map markers
    axios.get('http://localhost:3000/api/places').then(res => setAllPlaces(res.data)).catch(() => setAllPlaces([]));
    // Fetch hotels and restaurants from backend
    const fetchHotels = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/hotels');
        setHotels(res.data.data || res.data);
      } catch (error) {
        setHotels([]);
      }
    };
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/restaurants');
        setRestaurants(res.data.data || res.data);
      } catch (error) {
        setRestaurants([]);
      }
    };
    fetchHotels();
    fetchRestaurants();
  }, [id]);

  useEffect(() => {
    if (!place) return;
    // 1. Fetch all tours
    const fetchNearestRoute = async () => {
      try {
        const toursRes = await axios.get('http://localhost:3000/api/tours');
        const tours = toursRes.data;
        let bestTour = null;
        let bestSteps = [];
        let minDistance = Infinity;
        // 2. For each tour, fetch its steps
        for (const tour of tours) {
          const stepsRes = await axios.get(`http://localhost:3000/api/tour-steps/by-tour/${tour.id}`);
          const steps = stepsRes.data;
          // 3. Check if this tour includes the current place
          const hasCurrentPlace = steps.some(s => s.place_id === place.id);
          if (hasCurrentPlace && steps.length > 0) {
            // 4. Calculate distance from current place to first step
            const firstStep = steps[0];
            const firstPlaceRes = await axios.get(`http://localhost:3000/api/places/${firstStep.place_id}`);
            const firstPlace = firstPlaceRes.data;
            const dist = Math.sqrt(
              Math.pow(place.latitude - firstPlace.latitude, 2) +
              Math.pow(place.longitude - firstPlace.longitude, 2)
            );
            if (dist < minDistance) {
              minDistance = dist;
              bestTour = tour;
              bestSteps = steps;
            }
          }
        }
        if (bestSteps.length > 0) {
          // 5. Fetch all places for the steps
          const places = await Promise.all(
            bestSteps.map(s => axios.get(`http://localhost:3000/api/places/${s.place_id}`).then(r => r.data))
          );
          setRouteSteps(bestSteps);
          setRoutePlaces(places);
          setRouteTour(bestTour);
        } else {
          setRouteSteps([]);
          setRoutePlaces([]);
          setRouteTour(null);
        }
      } catch (err) {
        setRouteSteps([]);
        setRoutePlaces([]);
        setRouteTour(null);
      }
    };
    fetchNearestRoute();
  }, [place]);

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isExpanded]);

  // Convert HTML to plain text
  const convertHtmlToText = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Fetch OpenTripMap details for this place (prefer city/address search)
  const fetchOtmDetails = useCallback(async (place) => {
    if (!place) return;
    setOtmLoading(true);
    setOtmError(null);
    setOtmDetails(null);
    try {
      let found = null;
      // Helper to check if string is ASCII
      const isAscii = (str) => /^[\x00-\x7F]*$/.test(str);
      // 1. Try search by name and city only (not full address) if ASCII
      if (place.name && isAscii(place.name)) {
        let query = place.name;
        if (
          place.city &&
          !place.name.includes(place.city) &&
          !/phường|quận|tỉnh|việt|nam|vn|,|huyện/i.test(place.city)
        ) {
          query += `, ${place.city}`;
        }
        query = encodeURIComponent(query);
        const searchUrl = `${OTM_BASE_URL}/autosuggest?query=${query}&apikey=${OTM_API_KEY}`;
        const searchRes = await fetch(searchUrl);
        if (searchRes.status === 429) {
          setOtmError('Bạn đã gửi quá nhiều yêu cầu tới OpenTripMap. Vui lòng thử lại sau.');
          setOtmDetails(null);
          setOtmLoading(false);
          return;
        }
        if (searchRes.status === 400) {
          // Fallback to /radius below
        } else {
          const searchData = await searchRes.json();
          if (searchData && searchData.features && searchData.features.length > 0) {
            found = searchData.features[0];
          }
        }
      }
      // 2. Fallback: search by coordinates and name (old logic)
      if (!found && place.latitude && place.longitude) {
        const radius = 200;
        const searchUrl = `${OTM_BASE_URL}/radius?radius=${radius}&lon=${place.longitude}&lat=${place.latitude}&apikey=${OTM_API_KEY}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        if (searchData.features && searchData.features.length > 0) {
          const normalize = s => s?.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
          found = searchData.features.find(f => normalize(f.properties.name) === normalize(place.name));
          if (!found) found = searchData.features[0];
        }
      }
      // 3. Fetch details if found
      if (found && found.properties && found.properties.xid) {
        const detailsUrl = `${OTM_BASE_URL}/xid/${found.properties.xid}?apikey=${OTM_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        setOtmDetails(detailsData);
      } else {
        setOtmDetails(null);
      }
    } catch (e) {
      setOtmError('Không thể tải thông tin từ OpenTripMap');
      setOtmDetails(null);
    } finally {
      setOtmLoading(false);
    }
  }, []);

  // Fetch nearby places (restaurants, hotels) from OpenTripMap
  const fetchNearbyPlaces = useCallback(async (place) => {
    if (!place || !place.latitude || !place.longitude) return;
    setNearbyLoading(true);
    setNearbyError(null);
    setNearbyDetails({});
    try {
      // Fetch restaurants (limit 2)
      const restUrl = `${OTM_BASE_URL}/radius?radius=500&lon=${place.longitude}&lat=${place.latitude}&kinds=restaurants&limit=2&apikey=${OTM_API_KEY}`;
      const restRes = await fetch(restUrl);
      const restData = await restRes.json();
      const restaurants = restData.features || [];
      setNearbyRestaurants(restaurants);
      // Fetch hotels (limit 2)
      const hotelUrl = `${OTM_BASE_URL}/radius?radius=500&lon=${place.longitude}&lat=${place.latitude}&kinds=accomodations&limit=2&apikey=${OTM_API_KEY}`;
      const hotelRes = await fetch(hotelUrl);
      if (hotelRes.status === 429) {
        setNearbyError('Bạn đã gửi quá nhiều yêu cầu tới OpenTripMap. Vui lòng thử lại sau.');
        setNearbyHotels([]);
        setNearbyLoading(false);
        return;
      }
      const hotelData = await hotelRes.json();
      const hotels = hotelData.features || [];
      setNearbyHotels(hotels);
      // Fetch details for all (restaurants + hotels) with throttling and caching
      const all = [...restaurants, ...hotels];
      const details = {};
      for (const item of all) {
        if (item.properties && item.properties.xid) {
          const cacheKey = `otm_detail_${item.properties.xid}`;
          let detailData = null;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            detailData = JSON.parse(cached);
          } else {
            try {
              const detailRes = await fetch(`${OTM_BASE_URL}/xid/${item.properties.xid}?apikey=${OTM_API_KEY}`);
              detailData = await detailRes.json();
              localStorage.setItem(cacheKey, JSON.stringify(detailData));
            } catch {}
            await new Promise(res => setTimeout(res, 2000)); // 2 second delay
          }
          details[item.properties.xid] = detailData;
        }
      }
      setNearbyDetails(details);
    } catch (e) {
      setNearbyError('Không thể tải nhà hàng/khách sạn lân cận');
      setNearbyRestaurants([]);
      setNearbyHotels([]);
      setNearbyDetails({});
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (place) fetchOtmDetails(place);
  }, [place, fetchOtmDetails]);

  useEffect(() => {
    if (place) fetchNearbyPlaces(place);
  }, [place, fetchNearbyPlaces]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(90deg, #2196f3, #64b5f6)' }}>
        <div className="text-center text-white">
          <div className="spinner-border mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4>Đang tải thông tin địa điểm...</h4>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' }}>
        <div className="text-center text-white">
          <i className="bi bi-exclamation-triangle display-1 mb-3"></i>
          <h4>{error}</h4>
          <button onClick={() => navigate(-1)} className="btn btn-light mt-3">
            <i className="bi bi-arrow-left me-2"></i>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Header />
      <main className="flex-grow-1">
        <div className="container-fluid p-0">
          <div className="row g-0">
            {/* Map Container - Full width */}
            <div className="col-12">
              <div className="place-detail-map-container">
                <div className="map-background">
                  <MapContainer
                    center={[parseFloat(place.latitude), parseFloat(place.longitude)]}
                    zoom={16}
                    className="detail-map"
                    zoomControl={true}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {/* Markers for route steps */}
                    {routePlaces.map((p, idx) => (
                      <Marker
                        key={p.id}
                        position={[parseFloat(p.latitude), parseFloat(p.longitude)]}
                        icon={createCustomIcon(p.id === place.id ? { ...p, highlight: true } : p)}
                      >
                        <Popup>
                          <div className="text-center">
                            <h5 className="text-primary mb-2">{p.name}</h5>
                            {p.address && <p className="mb-1 small">{p.address}</p>}
                            {p.city && <p className="mb-0 text-muted small">{p.city}</p>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {/* Fallback: marker for current place if no route */}
                    {routePlaces.length === 0 && (
                      <Marker position={[parseFloat(place.latitude), parseFloat(place.longitude)]} icon={createCustomIcon(place)}>
                        <Popup>
                          <div className="text-center">
                            <h5 className="text-primary mb-2">{place.name}</h5>
                            {place.address && <p className="mb-1 small">{place.address}</p>}
                            {place.city && <p className="mb-0 text-muted small">{place.city}</p>}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    {/* Show all other places as default markers (not in route) */}
                    {allPlaces.filter(p => !routePlaces.some(rp => rp.id === p.id)).map((p) => (
                      <Marker
                        key={p.id}
                        position={[parseFloat(p.latitude), parseFloat(p.longitude)]}
                        icon={createCustomIcon(p)}
                      >
                        <Popup>
                          <div className="text-center">
                            <h5 className="text-primary mb-2">{p.name}</h5>
                            {p.address && <p className="mb-1 small">{p.address}</p>}
                            {p.city && <p className="mb-0 text-muted small">{p.city}</p>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {/* Hotel markers (backend) */}
                    {hotels.filter(h => h.latitude && h.longitude).map((hotel) => (
                      <Marker key={`hotel-backend-${hotel.id}`} position={[hotel.latitude, hotel.longitude]} icon={hotelIcon}>
                        <Popup>
                          <div>
                            <strong>{hotel.name}</strong><br/>
                            {hotel.address && <span>{hotel.address}<br/></span>}
                            {hotel.city && <span>{hotel.city}<br/></span>}
                            {hotel.price_range && <span>Giá: {hotel.price_range}<br/></span>}
                            {hotel.rating && <span>Đánh giá: {hotel.rating.toFixed(1)} / 5</span>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {/* Restaurant markers (backend) */}
                    {restaurants.filter(r => r.latitude && r.longitude).map((restaurant) => (
                      <Marker key={`restaurant-backend-${restaurant.id}`} position={[restaurant.latitude, restaurant.longitude]} icon={restaurantIcon}>
                        <Popup>
                          <div>
                            <strong>{restaurant.name}</strong><br/>
                            {restaurant.address && <span>{restaurant.address}<br/></span>}
                            {restaurant.city && <span>{restaurant.city}<br/></span>}
                            {restaurant.price_range && <span>Giá: {restaurant.price_range}<br/></span>}
                            {restaurant.rating && <span>Đánh giá: {restaurant.rating.toFixed(1)} / 5</span>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {/* Hotel markers (OpenTripMap) */}
                    {nearbyHotels.filter(h => h.geometry && h.geometry.coordinates).map((hotel, idx) => (
                      <Marker
                        key={`hotel-otm-${hotel.properties.xid}`}
                        position={[hotel.geometry.coordinates[1], hotel.geometry.coordinates[0]]}
                        icon={hotelIcon}
                      >
                        <Popup>
                          <div>
                            <strong>{hotel.properties.name || 'Khách sạn lân cận'}</strong><br/>
                            {hotel.properties.address && <span>{Object.values(hotel.properties.address).join(', ')}<br/></span>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {/* Restaurant markers (OpenTripMap) */}
                    {nearbyRestaurants.filter(r => r.geometry && r.geometry.coordinates).map((restaurant, idx) => (
                      <Marker
                        key={`restaurant-otm-${restaurant.properties.xid}`}
                        position={[restaurant.geometry.coordinates[1], restaurant.geometry.coordinates[0]]}
                        icon={restaurantIcon}
                      >
                        <Popup>
                          <div>
                            <strong>{restaurant.properties.name || 'Nhà hàng lân cận'}</strong><br/>
                            {restaurant.properties.address && <span>{Object.values(restaurant.properties.address).join(', ')}<br/></span>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                {/* Information Overlay */}
                <div className={`info-overlay ${isExpanded ? 'expanded' : ''}`}>
                  <div className="overlay-content">
                    <div className="tab-content">
                      <div className="place-basic-info">

                        {/* Hero Image */}
                        {place.image_url && (
                          <div className="position-relative" style={{ height: '250px' }}>
                            <img
                              src={place.image_url.startsWith("http") ? place.image_url : `http://localhost:3000${place.image_url}`}
                              alt={place.name}
                              className="w-100 h-100"
                              style={{ objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = "/default-place.jpg";
                              }}
                            />
                            <div className="position-absolute top-0 start-0 w-100 h-100" 
                                 style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)' }}>
                            </div>
                            <div className="position-absolute bottom-0 start-0 w-100 p-3">
                              <h2 className="text-white fw-bold mb-2 text-shadow" style={{ fontSize: '1.8rem' }}>
                                {place.name}
                              </h2>
                              <div className="d-flex flex-wrap gap-2 align-items-center">
                                {place.city && (
                                  <span className="badge bg-primary bg-opacity-75 px-3 py-2 rounded-pill">
                                    <i className="bi bi-geo-alt-fill me-1"></i>
                                    {place.city}
                                  </span>
                                )}
                                <span className="badge bg-warning bg-opacity-75 px-3 py-2 rounded-pill">
                                  <i className="bi bi-star-fill me-1"></i>
                                  {place.rating?.toFixed ? place.rating.toFixed(1) : place.rating}/5
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Open Button */}
                        <div className="d-flex justify-content-end pe-3">
                          <button
                            className="btn btn-primary btn-sm rounded-pill"
                            style={{ fontSize: '0.8rem' }}
                            title={isExpanded ? "Thu nhỏ thông tin" : "Mở rộng thông tin"}
                            onClick={() => setIsExpanded(!isExpanded)}
                          >
                            <i className={`bi ${isExpanded ? 'bi-arrows-collapse' : 'bi-arrows-expand'} me-1`}></i>
                            {isExpanded ? 'Xem bản đồ' : 'Xem thêm'}
                          </button>
                        </div>
                        {/* Place Info */}
                        <div className="p-4">
                          {/* Info Cards */}
                          <div className="row g-3 mb-4">
                            {place.address && (
                              <div className="col-12">
                                <div className="d-flex align-items-center p-3 bg-light rounded-3">
                                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                                    <i className="bi bi-house text-primary"></i>
                                  </div>
                                  <div>
                                    <small className="text-muted d-block">Địa chỉ</small>
                                    <strong className="text-dark">{place.address}</strong>
                                  </div>
                                </div>
                              </div>
                            )}
                            {place.opening_hours && (
                              <div className="col-12">
                                <div className="d-flex align-items-center p-3 bg-light rounded-3">
                                  <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                                    <i className="bi bi-clock text-success"></i>
                                  </div>
                                  <div>
                                    <small className="text-muted d-block">Giờ mở cửa</small>
                                    <strong className="text-dark">{place.opening_hours}</strong>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          <div className="mb-4">
                            <h5 className="text-primary mb-3">
                              <i className="bi bi-info-circle me-2"></i>
                              Mô tả
                            </h5>
                            <div className="p-3 bg-light rounded-3 description-text" style={{ fontSize: '0.95rem', maxHeight: '150px', overflowY: 'auto' }}>
                              <div>{convertHtmlToText(place.description)}</div>
                            </div>
                          </div>

                          {/* Services */}
                          {place.service && (
                            <div className="mb-4">
                              <h5 className="text-primary mb-3">
                                <i className="bi bi-activity me-2"></i>
                                Dịch vụ
                              </h5>
                              <div className="p-3 service-section">
                                <p className="text-dark mb-0 fw-medium" style={{ fontSize: '0.95rem' }}>{place.service}</p>
                              </div>
                            </div>
                          )}
                          <div className="card shadow-sm p-4 mb-4" style={{ borderRadius: 20, background: 'linear-gradient(120deg, #f8fafc 0%, #e3f0ff 100%)' }}>
                              <h5 className="text-warning mb-3">
                                <i className="bi bi-star-fill me-2"></i>
                                Đánh giá
                              </h5>
                            <div className="d-flex align-items-center gap-4 mb-3 flex-wrap">
                              <LikeButton placeId={place.id} />
                              <RatingStars id={place.id} />
                            </div>
                            <CommentSection placeId={place.id} />
                          </div>
                          {/* --- OpenTripMap Section --- */}
                          {/* <div className="mb-4">
                            <h5 className="text-info mb-3">
                              <i className="bi bi-globe2 me-2"></i>
                              Thông tin từ OpenTripMap
                            </h5>
                            {otmLoading && <div>Đang tải thông tin từ OpenTripMap...</div>}
                            {otmError && <div className="text-danger">{otmError}</div>}
                            {otmDetails && (
                              <div className="p-3 bg-light rounded-3" style={{ fontSize: '0.95rem' }}>
                                <div className="mb-2">
                                  <strong>{otmDetails.name}</strong>
                                </div>
                                {otmDetails.address && (
                                  <div className="mb-1"><b>Địa chỉ:</b> {Object.values(otmDetails.address).join(', ')}</div>
                                )}
                                {otmDetails.wikipedia_extracts && (
                                  <div className="mb-1">{otmDetails.wikipedia_extracts.text}</div>
                                )}
                                {otmDetails.info && otmDetails.info.descr && (
                                  <div className="mb-1">{otmDetails.info.descr}</div>
                                )}
                                {otmDetails.preview && otmDetails.preview.source && (
                                  <img src={otmDetails.preview.source} alt={otmDetails.name} style={{ width: '100%', borderRadius: 8, marginTop: 8, marginBottom: 8 }} />
                                )}
                                {otmDetails.otm && (
                                  <div className="mt-2">
                                    <a href={otmDetails.otm} target="_blank" rel="noopener noreferrer" style={{ color: '#1a5bb8' }}>Xem trên OpenTripMap</a>
                                    <div className="mt-2" style={{height: 350, border: '1px solid #e3e3e3', borderRadius: 8, overflow: 'hidden'}}>
                                      <iframe
                                        src={otmDetails.otm}
                                        title="OpenTripMap Preview"
                                        width="100%"
                                        height="100%"
                                        style={{border: 'none'}}
                                        loading="lazy"
                                      ></iframe>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {!otmLoading && !otmDetails && !otmError && (
                              <div className="text-muted">Không tìm thấy thông tin trên OpenTripMap.</div>
                            )}
                          </div> */}
                          {/* --- End OpenTripMap Section --- */}
                          {/* --- Nearby Restaurants & Hotels Section --- */}
                          <div className="mb-4">
                            <h5 className="text-success mb-3">
                              <i className="bi bi-geo-alt me-2"></i>
                              Nhà hàng & Khách sạn lân cận
                            </h5>
                            {nearbyLoading && <div>Đang tải nhà hàng/khách sạn lân cận...</div>}
                            {nearbyError && <div className="text-danger">{nearbyError}</div>}
                            {!nearbyLoading && !nearbyError && (
                              <>
                                <div className="mb-2">
                                  <strong>Nhà hàng gần đây:</strong>
                                  {nearbyRestaurants.length === 0 ? (
                                    <span className="text-muted ms-2">Không có dữ liệu</span>
                                  ) : (
                                    <ul className="list-unstyled ms-2">
                                      {nearbyRestaurants.map(r => {
                                        const d = nearbyDetails[r.properties.xid] || {};
                                        return (
                                          <li key={r.properties.xid} className="mb-3 d-flex align-items-start gap-3">
                                            {d.preview && d.preview.source ? (
                                              <img src={d.preview.source} alt={d.name} style={{width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0}} />
                                            ) : (
                                              <div style={{width: 56, height: 56, background: '#eee', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 24}}>
                                                <i className="bi bi-image"></i>
                                              </div>
                                            )}
                                            <div>
                                              <a href={`https://opentripmap.com/en/place/${r.properties.xid}`} target="_blank" rel="noopener noreferrer" style={{fontWeight: 600}}>
                                                {d.name || r.properties.name || 'Nhà hàng không tên'}
                                              </a>
                                              {d.address && (
                                                <div className="small text-muted">{Object.values(d.address).join(', ')}</div>
                                              )}
                                              {d.wikipedia_extracts && (
                                                <div className="small">{d.wikipedia_extracts.text}</div>
                                              )}
                                            </div>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </div>
                                <div>
                                  <strong>Khách sạn gần đây:</strong>
                                  {nearbyHotels.length === 0 ? (
                                    <span className="text-muted ms-2">Không có dữ liệu</span>
                                  ) : (
                                    <ul className="list-unstyled ms-2">
                                      {nearbyHotels.map(h => {
                                        const d = nearbyDetails[h.properties.xid] || {};
                                        return (
                                          <li key={h.properties.xid} className="mb-3 d-flex align-items-start gap-3">
                                            {d.preview && d.preview.source ? (
                                              <img src={d.preview.source} alt={d.name} style={{width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0}} />
                                            ) : (
                                              <div style={{width: 56, height: 56, background: '#eee', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 24}}>
                                                <i className="bi bi-image"></i>
                                              </div>
                                            )}
                                            <div>
                                              <a href={`https://opentripmap.com/en/place/${h.properties.xid}`} target="_blank" rel="noopener noreferrer" style={{fontWeight: 600}}>
                                                {d.name || h.properties.name || 'Khách sạn không tên'}
                                              </a>
                                              {d.address && (
                                                <div className="small text-muted">{Object.values(d.address).join(', ')}</div>
                                              )}
                                              {d.wikipedia_extracts && (
                                                <div className="small">{d.wikipedia_extracts.text}</div>
                                              )}
                                            </div>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          {/* --- End Nearby Section --- */}
                          {/* Action Buttons */}
                          <div className="d-flex gap-2 justify-content-center pt-3">
                            <button
                              onClick={() => navigate(-1)}
                              className="btn btn-outline-primary px-3 py-2 rounded-pill"
                              style={{ fontSize: '0.9rem' }}
                            >
                              <i className="bi bi-arrow-left me-2"></i>
                              Quay lại
                            </button>
                            <button className="btn btn-primary px-3 py-2 rounded-pill" style={{ fontSize: '0.9rem' }}>
                              <i className="bi bi-share me-2"></i>
                              Chia sẻ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlaceDetail;
