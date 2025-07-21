import React, { useState, useEffect, useRef } from 'react';

const CityAutocomplete = ({ value, onChange, onKeyPress, placeholder = "Thành phố" }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [loading, setLoading] = useState(false);
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

  const searchCities = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      // Using backend geocoding endpoint with focus on Vietnam and cities
      const response = await fetch(
        `https://walkingguide.onrender.com/api/geocoding/search?` +
        `q=${encodeURIComponent(query)}&` +
        `limit=10&` +
        `addressdetails=1`
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Filter for Vietnamese cities and format the results
      const citySuggestions = data
        .filter(item => {
          const address = item.address;
          return (
            address &&
            (address.country === 'Việt Nam' || address.country === 'Vietnam') &&
            (address.city || address.town || address.state) &&
            (address.city || address.town || address.state).toLowerCase().includes(query.toLowerCase())
          );
        })
        .map(item => {
          const address = item.address;
          const cityName = address.city || address.town || address.state;
          return {
            id: item.place_id,
            name: cityName,
            display_name: item.display_name,
            state: address.state,
            country: address.country
          };
        })
        .filter((item, index, self) => 
          index === self.findIndex(t => t.name === item.name)
        )
        .slice(0, 10);

      setSuggestions(citySuggestions);
      setShowSuggestions(citySuggestions.length > 0);
    } catch (error) {
      console.error('Error searching cities:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
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
      searchCities(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    const cityName = typeof suggestion === 'string' ? suggestion : suggestion.name;
    setInputValue(cityName);
    onChange(cityName);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Don't automatically select suggestions, let parent handle Enter
      if (onKeyPress) {
        onKeyPress(e);
      }
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
          className="form-control mb-2"
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </div>
      {showSuggestions && (
        <div 
          className="position-absolute w-100 bg-white border rounded shadow-sm" 
          style={{ 
            zIndex: 1000, 
            maxHeight: '200px', 
            overflowY: 'auto',
            top: '100%',
            left: 0
          }}
        >
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-2 cursor-pointer hover-bg-light"
                style={{ cursor: 'pointer' }}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                {suggestion.display_name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-muted">
              Không tìm thấy thành phố
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete; 