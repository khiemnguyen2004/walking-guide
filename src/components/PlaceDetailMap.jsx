import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import '../css/PlaceDetailMap.css';
import hotelIconSvg from '../assets/hotel-marker.svg';
import restaurantIconSvg from '../assets/restaurant-marker.svg';

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
          <i class=\"bi bi-geo-alt-fill\" style=\"font-size: 24px; color: #3498db;\"></i>
        </div>
      `,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconAnchor, iconAnchor],
      popupAnchor: [0, -iconAnchor - 5],
    });
  }
};

// Current location icon
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

// Component to handle map updates
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

// Component to handle initial map centering
function MapInitializer({ defaultCenter, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (defaultCenter && defaultCenter.length === 2) {
      map.setView(defaultCenter, zoom);
    }
  }, [defaultCenter, zoom, map]);
  
  return null;
}

// Component for current location button
function CurrentLocationButton({ onLocationClick }) {
  const map = useMap();
  
  const handleClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          map.setView([lat, lng], 15);
          onLocationClick({ lat, lng });
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
        }
      );
    } else {
      alert('Trình duyệt của bạn không hỗ trợ định vị.');
    }
  };

  return (
    <div className="leaflet-control leaflet-bar location-control">
      <button
        onClick={handleClick}
        title="Đến vị trí hiện tại"
      >
        <i className="bi bi-geo-alt-fill"></i>
      </button>
    </div>
  );
}

// Component for zoom controls
function ZoomControls() {
  const map = useMap();
  
  const handleZoomIn = () => {
    map.zoomIn();
  };
  
  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="leaflet-control leaflet-bar zoom-controls">
      <button
        onClick={handleZoomIn}
        title="Phóng to"
        className="zoom-in-btn"
      >
        <i className="bi bi-plus-lg"></i>
      </button>
      <button
        onClick={handleZoomOut}
        title="Thu nhỏ"
        className="zoom-out-btn"
      >
        <i className="bi bi-dash-lg"></i>
      </button>
    </div>
  );
}

function PlaceDetailMap({ place, onClose }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [places, setPlaces] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(place);
  const [defaultCenter, setDefaultCenter] = useState([10.8231, 106.6297]); // Default to Ho Chi Minh City
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [locationAlertMessage, setLocationAlertMessage] = useState('');
  const [hotels, setHotels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  // Add state for selectedType
  const [selectedType, setSelectedType] = useState(place?.type || 'place');
  // Add showOverlay state
  const isMobile = () => window.matchMedia('(max-width: 600px)').matches;
  const [showOverlay, setShowOverlay] = useState(!isMobile());

  useEffect(() => {
    const handleResize = () => {
      if (isMobile()) setShowOverlay(false);
      else setShowOverlay(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize selectedPlace with the passed place prop
  useEffect(() => {
    if (place) {
      setSelectedPlace(place);
      setDefaultCenter([parseFloat(place.latitude), parseFloat(place.longitude)]);
    }
  }, [place]);

  // Get current location first
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          
          // Only update default center if no place is selected
          if (!selectedPlace) {
            setDefaultCenter([location.lat, location.lng]);
          }
          
          // Always find nearest place when map opens
          findNearestPlace(location);
        },
        (error) => {
          console.error('Error getting current location:', error);
          // Keep default center as Ho Chi Minh City
        }
      );
    }
  }, [places, selectedPlace]);

  // Fetch all places
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3000/api/places');
        setPlaces(response.data);
        
        // If no place is selected, select the first place
        if (!selectedPlace && response.data.length > 0) {
          setSelectedPlace(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching places:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, [selectedPlace]);

  // Fetch hotels and restaurants
  useEffect(() => {
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
  }, []);

  // Find nearest place to current location
  const findNearestPlace = (location) => {
    if (places.length === 0) return;
    
    let nearestPlace = places[0];
    let shortestDistance = calculateDistance(
      location.lat, location.lng,
      nearestPlace.latitude, nearestPlace.longitude
    );
    
    places.forEach(place => {
      const distance = calculateDistance(
        location.lat, location.lng,
        place.latitude, place.longitude
      );
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestPlace = place;
      }
    });
    
    // Only update if no place is currently selected
    if (!selectedPlace) {
      setSelectedPlace(nearestPlace);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Update handlePlaceClick to accept type
  const handlePlaceClick = (clickedPlace, type = 'place') => {
    setSelectedPlace(clickedPlace);
    setSelectedType(type);
    if (isMobile()) setShowOverlay(true);
  };

  const handleLocationClick = (location) => {
    setCurrentLocation(location);
  };

  // ESC key handler for closing expanded view
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

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatPrice = (price) => {
    if (!price) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Convert HTML to plain text
  const convertHtmlToText = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
          setDefaultCenter([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationAlertMessage('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
          setShowLocationAlert(true);
        }
      );
    } else {
      setLocationAlertMessage('Trình duyệt của bạn không hỗ trợ định vị.');
      setShowLocationAlert(true);
    }
  };

  // Find if selectedPlace is a hotel or restaurant (by id only)
  const findByIdOrCoords = (arr, place) => {
    if (!place) return undefined;
    return arr.find(x => x.id === place.id);
  };
  const selectedHotel = findByIdOrCoords(hotels, selectedPlace);
  const selectedRestaurant = findByIdOrCoords(restaurants, selectedPlace);

  // Show loading state
  if (loading || !selectedPlace) {
    return (
      <div className="place-detail-map-fullscreen">
        <div className="map-container">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            className="fullscreen-map"
            zoomControl={false}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapInitializer defaultCenter={defaultCenter} zoom={13} />
            <CurrentLocationButton onLocationClick={handleLocationClick} />
            <ZoomControls />
          </MapContainer>
        </div>
        
        {/* Loading overlay */}
        <div className="info-overlay">
          <div className="overlay-content">
            <div className="tab-content">
              <div className="place-basic-info">
                <div className="d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                  <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5 className="text-muted">Đang tải thông tin địa điểm...</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="place-detail-map-fullscreen">
      {/* Map Container */}
      <div className="map-container">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="fullscreen-map"
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Current location marker */}
          {currentLocation && (
            <Marker 
              position={[currentLocation.lat, currentLocation.lng]}
              icon={currentLocationIcon}
            >
              <Popup>
                <div className="text-center">
                  <h6 className="text-primary mb-1">Vị trí hiện tại</h6>
                  <small className="text-muted">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </small>
                </div>
              </Popup>
            </Marker>
          )}

          {/* All places markers */}
          {places.map((place) => (
            <Marker
              key={place.id}
              position={[parseFloat(place.latitude), parseFloat(place.longitude)]}
              icon={createCustomIcon(place)}
              eventHandlers={{
                click: () => handlePlaceClick(place, 'place')
              }}
            >
              <Popup>
                <div className="text-center">
                  <h6 className="text-primary mb-1">{place.name}</h6>
                  {place.address && <p className="mb-1 small">{place.address}</p>}
                  {place.city && <p className="mb-0 text-muted small">{place.city}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
          {/* Hotel markers */}
          {hotels.filter(h => h.latitude && h.longitude).map((hotel) => (
            <Marker key={`hotel-${hotel.id}`} position={[hotel.latitude, hotel.longitude]} icon={hotelIcon}
              eventHandlers={{
                click: () => handlePlaceClick(hotel, 'hotel')
              }}
            >
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
          {/* Restaurant markers */}
          {restaurants.filter(r => r.latitude && r.longitude).map((restaurant) => (
            <Marker key={`restaurant-${restaurant.id}`} position={[restaurant.latitude, restaurant.longitude]} icon={restaurantIcon}
              eventHandlers={{
                click: () => handlePlaceClick(restaurant, 'restaurant')
              }}
            >
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

          <MapInitializer defaultCenter={defaultCenter} zoom={13} />
          <CurrentLocationButton onLocationClick={handleLocationClick} />
          <ZoomControls />
        </MapContainer>
      </div>

      {/* Information Overlay */}
      {(showOverlay || !isMobile()) ? (
        <div className={`info-overlay ${isMobile() ? (showOverlay ? 'mobile-visible' : 'mobile-hidden') : ''}`}>
          {isMobile() && (
            <button className="close-overlay-btn" onClick={() => setShowOverlay(false)} style={{position:'absolute',top:10,right:16,zIndex:10,fontSize:'2rem',background:'#fff',border:'none',borderRadius:'50%',width:36,height:36,color:'#888',boxShadow:'0 2px 8px rgba(0,0,0,0.07)'}}>×</button>
          )}
          <div className="overlay-content">
            <div className="tab-content">
              <div className="place-basic-info">
                {/* Overlay Info Section: Show only hotel info if matched, else restaurant, else place */}
                {selectedType === 'hotel' ? (
                  // Hotel Info Only (use selectedPlace as hotel)
                  <>
                    <div className="position-relative" style={{ height: '250px' }}>
                      <img
                        src={(() => {
                          if (selectedHotel.image_url) {
                            return selectedHotel.image_url.startsWith('http') ? selectedHotel.image_url : `http://localhost:3000${selectedHotel.image_url}`;
                          }
                          if (selectedHotel.images && selectedHotel.images[0]?.image_url) {
                            return selectedHotel.images[0].image_url.startsWith('http') ? selectedHotel.images[0].image_url : `http://localhost:3000${selectedHotel.images[0].image_url}`;
                          }
                          return '/default-place.jpg';
                        })()}
                        alt={selectedHotel.name}
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
                          {selectedHotel.name}
                        </h2>
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          {selectedHotel.city && (
                            <span className="badge bg-primary bg-opacity-75 px-3 py-2 rounded-pill">
                              <i className="bi bi-geo-alt-fill me-1"></i>
                              {selectedHotel.city}
                            </span>
                          )}
                          {selectedHotel.rating && (
                            <span className="badge bg-warning bg-opacity-75 px-3 py-2 rounded-pill">
                              <i className="bi bi-star-fill me-1"></i>
                              {selectedHotel.rating?.toFixed ? selectedHotel.rating.toFixed(1) : selectedHotel.rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Gallery if available */}
                    {selectedHotel.images && selectedHotel.images.length > 1 && (
                      <div className="mb-3">
                        <div className="d-flex flex-wrap gap-2">
                          {selectedHotel.images.map((img, idx) => (
                            img?.image_url && <img key={idx} src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:3000${img.image_url}`} alt="Gallery" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mb-4">
                      {selectedHotel.address && (<div className="mb-2"><i className="bi bi-house me-2 text-primary"></i><span className="fw-medium">Địa chỉ:</span> {selectedHotel.address}</div>)}
                      {selectedHotel.city && (<div className="mb-2"><i className="bi bi-geo-alt me-2 text-info"></i><span className="fw-medium">Thành phố:</span> {selectedHotel.city}</div>)}
                      {selectedHotel.stars && (<div className="mb-2"><i className="bi bi-star-fill me-2 text-warning"></i><span className="fw-medium">Hạng sao:</span> {selectedHotel.stars} / 5</div>)}
                      {selectedHotel.price_range && (<div className="mb-2"><i className="bi bi-currency-dollar me-2 text-warning"></i><span className="fw-medium">Mức giá:</span> {selectedHotel.price_range}</div>)}
                      {(selectedHotel.min_price || selectedHotel.max_price) && (<div className="mb-2"><i className="bi bi-cash-coin me-2 text-success"></i><span className="fw-medium">Giá:</span> {selectedHotel.min_price ? formatPrice(selectedHotel.min_price) : ''}{selectedHotel.min_price && selectedHotel.max_price ? ' - ' : ''}{selectedHotel.max_price ? formatPrice(selectedHotel.max_price) : ''}</div>)}
                      {selectedHotel.phone && (<div className="mb-2"><i className="bi bi-telephone me-2 text-info"></i><span className="fw-medium">Điện thoại:</span> {selectedHotel.phone}</div>)}
                      {selectedHotel.email && (<div className="mb-2"><i className="bi bi-envelope me-2 text-info"></i><span className="fw-medium">Email:</span> {selectedHotel.email}</div>)}
                      {selectedHotel.website && (<div className="mb-2"><i className="bi bi-globe me-2 text-info"></i><span className="fw-medium">Website:</span> <a href={selectedHotel.website} target="_blank" rel="noopener noreferrer">{selectedHotel.website}</a></div>)}
                      {(selectedHotel.check_in_time || selectedHotel.check_out_time) && (<div className="mb-2"><i className="bi bi-clock me-2 text-success"></i>{selectedHotel.check_in_time && (<span className="fw-medium me-3">Nhận phòng: <span className="text-dark">{selectedHotel.check_in_time}</span></span>)}{selectedHotel.check_out_time && (<span className="fw-medium">Trả phòng: <span className="text-dark">{selectedHotel.check_out_time}</span></span>)}</div>)}
                      {selectedHotel.amenities && (() => {let ams = selectedHotel.amenities;try {const parsed = JSON.parse(ams);if (Array.isArray(parsed)) {return (<div className="mb-2"><span className="fw-medium">Tiện nghi:</span> {parsed.join(', ')}</div>);}} catch (e) {}return <div className="mb-2"><span className="fw-medium">Tiện nghi:</span> {ams}</div>;})()}
                      {selectedHotel.room_types && (() => {let rms = selectedHotel.room_types;try {const parsed = JSON.parse(rms);if (Array.isArray(parsed)) {return (<div className="mb-2"><span className="fw-medium">Loại phòng:</span> {parsed.join(', ')}</div>);}} catch (e) {}return <div className="mb-2"><span className="fw-medium">Loại phòng:</span> {rms}</div>;})()}
                    </div>
                    {selectedHotel.description && (
                      <div className="mb-4">
                        <h5 className="text-primary mb-3">
                          <i className="bi bi-info-circle me-2"></i>
                          Mô tả
                        </h5>
                        <div className="p-3 bg-light rounded-3 description-text" style={{ fontSize: '0.95rem', maxHeight: '150px', overflowY: 'auto' }}>
                          <div>{convertHtmlToText(selectedHotel.description)}</div>
                        </div>
                      </div>
                    )}
                  </>
                ) : selectedType === 'restaurant' ? (
                  // Restaurant Info Only (use selectedPlace as restaurant)
                  <>
                    <div className="position-relative" style={{ height: '250px' }}>
                      <img
                        src={(() => {
                          if (selectedRestaurant.image_url) {
                            return selectedRestaurant.image_url.startsWith('http') ? selectedRestaurant.image_url : `http://localhost:3000${selectedRestaurant.image_url}`;
                          }
                          if (selectedRestaurant.images && selectedRestaurant.images[0]?.image_url) {
                            return selectedRestaurant.images[0].image_url.startsWith('http') ? selectedRestaurant.images[0].image_url : `http://localhost:3000${selectedRestaurant.images[0].image_url}`;
                          }
                          return '/default-place.jpg';
                        })()}
                        alt={selectedRestaurant.name}
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
                          {selectedRestaurant.name}
                        </h2>
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          {selectedRestaurant.city && (
                            <span className="badge bg-primary bg-opacity-75 px-3 py-2 rounded-pill">
                              <i className="bi bi-geo-alt-fill me-1"></i>
                              {selectedRestaurant.city}
                            </span>
                          )}
                          {selectedRestaurant.rating && (
                            <span className="badge bg-warning bg-opacity-75 px-3 py-2 rounded-pill">
                              <i className="bi bi-star-fill me-1"></i>
                              {selectedRestaurant.rating?.toFixed ? selectedRestaurant.rating.toFixed(1) : selectedRestaurant.rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Gallery if available */}
                    {selectedRestaurant.images && selectedRestaurant.images.length > 1 && (
                      <div className="mb-3">
                        <div className="d-flex flex-wrap gap-2">
                          {selectedRestaurant.images.map((img, idx) => (
                            img?.image_url && <img key={idx} src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:3000${img.image_url}`} alt="Gallery" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mb-4">
                      {selectedRestaurant.address && (<div className="mb-2"><i className="bi bi-house me-2 text-primary"></i><span className="fw-medium">Địa chỉ:</span> {selectedRestaurant.address}</div>)}
                      {selectedRestaurant.city && (<div className="mb-2"><i className="bi bi-geo-alt me-2 text-info"></i><span className="fw-medium">Thành phố:</span> {selectedRestaurant.city}</div>)}
                      {selectedRestaurant.cuisine_type && (<div className="mb-2"><i className="bi bi-egg-fried me-2 text-warning"></i><span className="fw-medium">Ẩm thực:</span> {selectedRestaurant.cuisine_type}</div>)}
                      {selectedRestaurant.price_range && (<div className="mb-2"><i className="bi bi-currency-dollar me-2 text-warning"></i><span className="fw-medium">Mức giá:</span> {selectedRestaurant.price_range}</div>)}
                      {(selectedRestaurant.min_price || selectedRestaurant.max_price) && (<div className="mb-2"><i className="bi bi-cash-coin me-2 text-success"></i><span className="fw-medium">Giá:</span> {selectedRestaurant.min_price ? formatPrice(selectedRestaurant.min_price) : ''}{selectedRestaurant.min_price && selectedRestaurant.max_price ? ' - ' : ''}{selectedRestaurant.max_price ? formatPrice(selectedRestaurant.max_price) : ''}</div>)}
                      {selectedRestaurant.phone && (<div className="mb-2"><i className="bi bi-telephone me-2 text-info"></i><span className="fw-medium">Điện thoại:</span> {selectedRestaurant.phone}</div>)}
                      {selectedRestaurant.email && (<div className="mb-2"><i className="bi bi-envelope me-2 text-info"></i><span className="fw-medium">Email:</span> {selectedRestaurant.email}</div>)}
                      {selectedRestaurant.website && (<div className="mb-2"><i className="bi bi-globe me-2 text-info"></i><span className="fw-medium">Website:</span> <a href={selectedRestaurant.website} target="_blank" rel="noopener noreferrer">{selectedRestaurant.website}</a></div>)}
                      {selectedRestaurant.opening_hours && (<div className="mb-2"><i className="bi bi-clock me-2 text-success"></i><span className="fw-medium">Giờ mở cửa:</span> {(() => {let hours = selectedRestaurant.opening_hours;try {const parsed = JSON.parse(hours);if (Array.isArray(parsed)) {return parsed.map((item, idx) => (<span key={idx} className="ms-2">{item.day}: {item.hours}</span>));}} catch (e) {}return hours;})()}</div>)}
                      <div className="mb-2"><span className="fw-medium me-2">Dịch vụ:</span><span className="me-2"><i className={`bi bi-bag-check${selectedRestaurant.delivery_available ? '' : '-fill text-secondary'}`}></i> Giao hàng: {selectedRestaurant.delivery_available ? 'Có' : 'Không'}</span><span className="me-2"><i className={`bi bi-bag${selectedRestaurant.takeout_available ? '' : '-fill text-secondary'}`}></i> Mang đi: {selectedRestaurant.takeout_available ? 'Có' : 'Không'}</span><span><i className={`bi bi-people${selectedRestaurant.dine_in_available ? '' : '-fill text-secondary'}`}></i> Ăn tại chỗ: {selectedRestaurant.dine_in_available ? 'Có' : 'Không'}</span></div>
                      {selectedRestaurant.dietary_options && (() => {let opts = selectedRestaurant.dietary_options;try {const parsed = JSON.parse(opts);if (Array.isArray(parsed)) {return (<div className="mb-2"><span className="fw-medium">Tùy chọn ăn kiêng:</span> {parsed.join(', ')}</div>);}} catch (e) {}return <div className="mb-2"><span className="fw-medium">Tùy chọn ăn kiêng:</span> {opts}</div>;})()}
                      {selectedRestaurant.features && (() => {let feats = selectedRestaurant.features;try {const parsed = JSON.parse(feats);if (Array.isArray(parsed)) {return (<div className="mb-2"><span className="fw-medium">Tiện ích:</span> {parsed.join(', ')}</div>);}} catch (e) {}return <div className="mb-2"><span className="fw-medium">Tiện ích:</span> {feats}</div>;})()}
                    </div>
                    {selectedRestaurant.description && (
                      <div className="mb-4">
                        <h5 className="text-primary mb-3">
                          <i className="bi bi-info-circle me-2"></i>
                          Mô tả
                        </h5>
                        <div className="p-3 bg-light rounded-3 description-text" style={{ fontSize: '0.95rem', maxHeight: '150px', overflowY: 'auto' }}>
                          <div>{convertHtmlToText(selectedRestaurant.description)}</div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Place Info Only (use selectedPlace)
                  <>
                    <div className="position-relative" style={{ height: '250px' }}>
                      <img
                        src={(() => {
                          if (selectedPlace?.image_url) {
                            return selectedPlace.image_url.startsWith('http') ? selectedPlace.image_url : `http://localhost:3000${selectedPlace.image_url}`;
                          }
                          if (selectedPlace?.images && selectedPlace.images[0]?.image_url) {
                            return selectedPlace.images[0].image_url.startsWith('http') ? selectedPlace.images[0].image_url : `http://localhost:3000${selectedPlace.images[0].image_url}`;
                          }
                          return '/default-place.jpg';
                        })()}
                        alt={selectedPlace?.name}
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
                          {selectedPlace?.name}
                        </h2>
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          {selectedPlace?.city && (
                            <span className="badge bg-primary bg-opacity-75 px-3 py-2 rounded-pill">
                              <i className="bi bi-geo-alt-fill me-1"></i>
                              {selectedPlace.city}
                            </span>
                          )}
                          {selectedPlace?.rating && (
                            <span className="badge bg-warning bg-opacity-75 px-3 py-2 rounded-pill">
                              <i className="bi bi-star-fill me-1"></i>
                              {selectedPlace.rating?.toFixed ? selectedPlace.rating.toFixed(1) : selectedPlace.rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedPlace?.images && selectedPlace.images.length > 1 && (
                      <div className="mb-3">
                        <div className="d-flex flex-wrap gap-2">
                          {selectedPlace.images.map((img, idx) => (
                            img?.image_url && <img key={idx} src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:3000${img.image_url}`} alt="Gallery" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mb-4">
                      {selectedPlace?.address && (<div className="mb-2"><i className="bi bi-house me-2 text-primary"></i><span className="fw-medium">Địa chỉ:</span> {selectedPlace.address}</div>)}
                      {selectedPlace?.city && (<div className="mb-2"><i className="bi bi-geo-alt me-2 text-info"></i><span className="fw-medium">Thành phố:</span> {selectedPlace.city}</div>)}
                      {selectedPlace?.opening_hours && (<div className="mb-2"><i className="bi bi-clock me-2 text-success"></i><span className="fw-medium">Giờ mở cửa:</span> {selectedPlace.opening_hours}</div>)}
                      {selectedPlace?.service && (<div className="mb-2"><i className="bi bi-activity me-2 text-info"></i><span className="fw-medium">Dịch vụ:</span> {selectedPlace.service}</div>)}
                      {selectedPlace?.phone && (<div className="mb-2"><i className="bi bi-telephone me-2 text-info"></i><span className="fw-medium">Điện thoại:</span> {selectedPlace.phone}</div>)}
                      {selectedPlace?.email && (<div className="mb-2"><i className="bi bi-envelope me-2 text-info"></i><span className="fw-medium">Email:</span> {selectedPlace.email}</div>)}
                      {selectedPlace?.website && (<div className="mb-2"><i className="bi bi-globe me-2 text-info"></i><span className="fw-medium">Website:</span> <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer">{selectedPlace.website}</a></div>)}
                    </div>
                    {selectedPlace?.description && (
                      <div className="mb-4">
                        <h5 className="text-primary mb-3">
                          <i className="bi bi-info-circle me-2"></i>
                          Mô tả
                        </h5>
                        <div className="p-3 bg-light rounded-3 description-text" style={{ fontSize: '0.95rem', maxHeight: '150px', overflowY: 'auto' }}>
                          <div>{convertHtmlToText(selectedPlace.description)}</div>
                        </div>
                      </div>
                    )}
                    {selectedPlace && selectedPlace.service && (
                      <div className="mb-4">
                        <h5 className="text-primary mb-3">
                          <i className="bi bi-activity me-2"></i>
                          Dịch vụ
                        </h5>
                        <div className="p-3 service-section">
                          <p className="text-dark mb-0 fw-medium" style={{ fontSize: '0.95rem' }}>{selectedPlace.service}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <div className="d-flex gap-2 justify-content-center pt-3">
                  <button
                    onClick={onClose}
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
      ) : null}

      {/* Location Alert */}
      {showLocationAlert && (
        <div className="alert alert-warning alert-dismissible fade show position-absolute top-0 start-0 m-3" style={{zIndex: 1000}} role="alert">
          <i className="bi bi-geo-alt me-2"></i>
          {locationAlertMessage}
          <button type="button" className="btn-close" onClick={() => setShowLocationAlert(false)}></button>
        </div>
      )}
    </div>
  );
}

export default PlaceDetailMap; 