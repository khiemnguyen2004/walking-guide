import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../css/index.css";
import hotelIconSvg from '../assets/hotel-marker.svg';
import restaurantIconSvg from '../assets/restaurant-marker.svg';

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

// Current location icon (blue marker)
const currentLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

// Function to create custom circular icon with place image
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
    // Fallback to default icon with custom styling
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

// Custom icon for hotel
const hotelIcon = new L.Icon({
  iconUrl: hotelIconSvg,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Custom icon for restaurant
const restaurantIcon = new L.Icon({
  iconUrl: restaurantIconSvg,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Component for current location button
function CurrentLocationButton({ onLocationUpdate }) {
  const map = useMap();
  
  const handleClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          map.setView([lat, lng], 15);
          // Notify parent component about location update
          if (onLocationUpdate) {
            onLocationUpdate({ lat, lng });
          }
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

// Component for auto-centering map to show all markers
function MapAutoCenter({ locations, selectedCity, currentLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      // Create bounds that include all place markers
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      
      // If we have current location, include it in the bounds
      if (currentLocation) {
        bounds.extend([currentLocation.lat, currentLocation.lng]);
      }
      
      // Fit the map to show all markers with some padding
      map.fitBounds(bounds, { 
        padding: [20, 20], // Add padding around the bounds
        maxZoom: 15, // Don't zoom in too much
        animate: true 
      });
    }
  }, [selectedCity, locations, currentLocation, map]);
  
  return null;
}

// Component for fit all markers button
function FitAllMarkersButton({ locations, currentLocation }) {
  const map = useMap();
  
  const handleClick = () => {
    if (locations.length > 0) {
      // Create bounds that include all place markers
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      
      // If we have current location, include it in the bounds
      if (currentLocation) {
        bounds.extend([currentLocation.lat, currentLocation.lng]);
      }
      
      // Fit the map to show all markers with some padding
      map.fitBounds(bounds, { 
        padding: [20, 20], // Add padding around the bounds
        maxZoom: 15, // Don't zoom in too much
        animate: true 
      });
    }
  };

  return (
    <div className="leaflet-control leaflet-bar fit-markers-control">
      <button
        onClick={handleClick}
        title="Hiển thị tất cả địa điểm"
      >
        <i className="bi bi-grid-3x3-gap"></i>
      </button>
    </div>
  );
}

function Map({ locations = [], hotels = [], restaurants = [], className, selectedCity }) {
  const defaultCenter = [10.8231, 106.6297]; // Ho Chi Minh City
  let center = defaultCenter;
  let zoom = 13;

  const [currentLocation, setCurrentLocation] = useState(null);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [locationAlertMessage, setLocationAlertMessage] = useState('');

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
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

  const handleLocationUpdate = (location) => {
    setCurrentLocation(location);
  };

  // Prepare valid locations for places, hotels, and restaurants
  const validLocations = locations.filter(
    (loc) => typeof loc.lat === "number" && typeof loc.lng === "number" && !isNaN(loc.lat) && !isNaN(loc.lng)
  );
  const validHotels = hotels.filter(
    (h) => typeof h.latitude === "number" && typeof h.longitude === "number" && !isNaN(h.latitude) && !isNaN(h.longitude)
  );
  const validRestaurants = restaurants.filter(
    (r) => typeof r.latitude === "number" && typeof r.longitude === "number" && !isNaN(r.latitude) && !isNaN(r.longitude)
  );

  // Debug logs
  console.log('validHotels', validHotels);
  console.log('validRestaurants', validRestaurants);

  // Calculate initial center and zoom based on all markers
  const allLatLngs = [
    ...validLocations.map(loc => [loc.lat, loc.lng]),
    ...validHotels.map(h => [h.latitude, h.longitude]),
    ...validRestaurants.map(r => [r.latitude, r.longitude]),
  ];
  if (allLatLngs.length > 0) {
    if (allLatLngs.length === 1) {
      center = allLatLngs[0];
      zoom = 15;
    } else {
      const bounds = L.latLngBounds(allLatLngs);
      center = bounds.getCenter();
      zoom = 10;
    }
  }

  return (
    <div className={className} style={{ height: "24rem", width: "100%", background: "#e9ecef", overflow: "hidden" }}>
      {/* Location Alert */}
      {showLocationAlert && (
        <div className="alert alert-warning alert-dismissible fade show position-absolute top-0 start-0 m-3" style={{zIndex: 1000}} role="alert">
          <i className="bi bi-geo-alt me-2"></i>
          {locationAlertMessage}
          <button type="button" className="btn-close" onClick={() => setShowLocationAlert(false)}></button>
        </div>
      )}
      {allLatLngs.length === 0 ? (
        <div className="text-center text-muted h-100 d-flex align-items-center justify-content-center">
          Không có địa điểm hợp lệ để hiển thị
        </div>
      ) : (
        <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapAutoCenter locations={validLocations} selectedCity={selectedCity} currentLocation={currentLocation} />
          <FitAllMarkersButton locations={validLocations} currentLocation={currentLocation} />
          <CurrentLocationButton onLocationUpdate={handleLocationUpdate} />
          <ZoomControls />
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
          {/* Place markers */}
          {validLocations.map((location) => (
            <Marker key={location.id} position={[location.lat, location.lng]} icon={createCustomIcon(location)}>
              <Popup>{location.name}</Popup>
            </Marker>
          ))}
          {/* Hotel markers */}
          {validHotels.map((hotel) => (
            <Marker key={`hotel-${hotel.id}`} position={[hotel.latitude, hotel.longitude]} icon={hotelIcon}>
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
          {validRestaurants.map((restaurant) => (
            <Marker key={`restaurant-${restaurant.id}`} position={[restaurant.latitude, restaurant.longitude]} icon={restaurantIcon}>
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
        </MapContainer>
      )}
    </div>
  );
}

export default Map;