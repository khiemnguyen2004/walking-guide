import React, { useState, useEffect, useRef } from 'react';

const LocationAutocomplete = ({ value, onChange, placeholder = "Nhập địa điểm..." }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      // Using backend geocoding endpoint for location search
      const response = await fetch(
        `https://walkingguide.onrender.com/api/geocoding/search?` +
        `q=${encodeURIComponent(query)}&` +
        `limit=8&` +
        `addressdetails=1`
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Format the results for better display
      const locationSuggestions = data
        .filter(item => {
          const address = item.address;
          return (
            address &&
            (address.country === 'Việt Nam' || address.country === 'Vietnam') &&
            (address.city || address.town || address.state || address.suburb || address.neighbourhood)
          );
        })
        .map(item => {
          const address = item.address;
          const cityName = address.city || address.town || address.state;
          const districtName = address.suburb || address.neighbourhood || address.district;
          
          let displayName = item.display_name;
          if (cityName && districtName) {
            displayName = `${districtName}, ${cityName}`;
          } else if (cityName) {
            displayName = cityName;
          }
          
          return {
            id: item.place_id,
            name: displayName,
            full_name: item.display_name,
            city: cityName,
            district: districtName,
            country: address.country,
            coordinates: {
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon)
            }
          };
        })
        .filter((item, index, self) => 
          index === self.findIndex(t => t.name === item.name)
        )
        .slice(0, 8);

      setSuggestions(locationSuggestions);
      setShowSuggestions(locationSuggestions.length > 0);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        try {
          // Reverse geocode to get address
          const response = await fetch(`https://walkingguide.onrender.com/api/geocoding/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address;
            const cityName = address.city || address.town || address.state;
            const districtName = address.suburb || address.neighbourhood || address.district;
            
            let locationName = 'Vị trí hiện tại';
            if (cityName && districtName) {
              locationName = `${districtName}, ${cityName}`;
            } else if (cityName) {
              locationName = cityName;
            }
            
            const currentLocationSuggestion = {
              id: 'current-location',
              name: locationName,
              full_name: data.display_name,
              city: cityName,
              district: districtName,
              country: address.country,
              coordinates: { lat: latitude, lon: longitude },
              isCurrentLocation: true
            };
            
            setInputValue(locationName);
            onChange(locationName);
            setSuggestions([currentLocationSuggestion]);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          // Fallback to coordinates
          const locationName = `Vị trí hiện tại (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setInputValue(locationName);
          onChange(locationName);
        }
      },
      (error) => {
        console.error('Error getting current location:', error);
        let errorMessage = 'Không thể lấy vị trí hiện tại.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Quyền truy cập vị trí bị từ chối. Vui lòng cho phép truy cập vị trí trong trình duyệt.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Thông tin vị trí không khả dụng.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Hết thời gian lấy vị trí.';
            break;
        }
        alert(errorMessage);
      }
    );
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onChange(value);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the API call to avoid too many requests
    timeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    const locationName = suggestion.isCurrentLocation ? suggestion.name : suggestion.name;
    setInputValue(locationName);
    onChange(locationName);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSuggestionClick(suggestions[0]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="position-relative">
      <div className="position-relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="form-control"
          placeholder={placeholder}
          autoComplete="off"
        />
        <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
          {loading && (
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
          {!loading && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              title="Sử dụng vị trí hiện tại"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
            >
              {isGettingLocation ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <i className="bi bi-geo-alt-fill"></i>
              )}
            </button>
          )}
        </div>
      </div>
      
      {showSuggestions && (
        <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg" style={{ zIndex: 1000 }}>
          <ul className="list-group list-group-flush">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2 px-3"
                onClick={() => handleSuggestionClick(suggestion)}
                style={{ cursor: 'pointer' }}
              >
                <i 
                  className={`bi ${suggestion.isCurrentLocation ? 'bi-geo-alt-fill text-primary' : 'bi-geo-alt text-muted'}`}
                  style={{ fontSize: '1rem' }}
                ></i>
                <div className="flex-grow-1">
                  <div className="fw-semibold">{suggestion.name}</div>
                  {suggestion.full_name && suggestion.full_name !== suggestion.name && (
                    <small className="text-muted">{suggestion.full_name}</small>
                  )}
                </div>
                {suggestion.isCurrentLocation && (
                  <span className="badge bg-primary">Hiện tại</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete; 