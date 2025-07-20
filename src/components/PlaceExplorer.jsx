import React, { useEffect, useState } from 'react';

// Example: Hanoi coordinates
const CITY_COORDS = { lat: 21.028511, lon: 105.854444 };
const API_KEY = '5ae2e3f221c38a28845f05b61952da66ed7231df6303c387c3d2a08c'; // Replace with your OpenTripMap API key

const CATEGORY_KINDS = {
  all: '',
  restaurants: 'restaurants',
  hotels: 'hotels',
  entertainment: 'entertainments',
};

const PlaceExplorer = () => {
  const [category, setCategory] = useState('restaurants');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPlaces([]);
    setSelectedPlace(null);
    setPlaceDetails(null);
    const kinds = CATEGORY_KINDS[category];
    fetch(`https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${CITY_COORDS.lon}&lat=${CITY_COORDS.lat}&kinds=${kinds}&apikey=${API_KEY}`)
      .then(res => res.json())
      .then(data => {
        setPlaces(data.features || data.places || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch places');
        setLoading(false);
      });
  }, [category]);

  // Fetch details for a place by xid
  const fetchPlaceDetails = (xid) => {
    setDetailsLoading(true);
    setPlaceDetails(null);
    fetch(`https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${API_KEY}`)
      .then(res => res.json())
      .then(data => {
        setPlaceDetails(data);
        setDetailsLoading(false);
      })
      .catch(() => {
        setPlaceDetails(null);
        setDetailsLoading(false);
      });
  };

  // Helper to get name from place object
  const getPlaceName = (place) => place.properties ? place.properties.name : place.name;
  const getPlaceXid = (place) => place.properties ? place.properties.xid : place.xid;

  return (
    <div>
      <h2 style={{textAlign: 'center', margin: '24px 0'}}>Khám phá địa điểm</h2>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button className={category==='restaurants' ? 'active' : ''} onClick={() => setCategory('restaurants')}>🍽️ Nhà hàng</button>
        <button className={category==='hotels' ? 'active' : ''} onClick={() => setCategory('hotels')}>🏨 Khách sạn</button>
        <button className={category==='entertainment' ? 'active' : ''} onClick={() => setCategory('entertainment')}>🎉 Giải trí</button>
      </div>
      {loading && <p style={{textAlign: 'center'}}>Đang tải...</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
        {places.map((place, idx) => (
          <div key={getPlaceXid(place) || idx} style={{ boxShadow: '0 2px 8px #eee', borderRadius: 12, padding: 18, width: 280, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: 120 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 600 }}>{getPlaceName(place) || 'Không tên'}</h4>
            <button onClick={() => {
              setSelectedPlace(place);
              fetchPlaceDetails(getPlaceXid(place));
            }} style={{ marginTop: 8, alignSelf: 'flex-end', background: '#1a5bb8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}>Xem chi tiết</button>
          </div>
        ))}
      </div>
      {/* Details Modal */}
      {selectedPlace && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setSelectedPlace(null); setPlaceDetails(null); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 340, maxWidth: 440, position: 'relative', boxShadow: '0 4px 24px #bbb' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }} onClick={() => { setSelectedPlace(null); setPlaceDetails(null); }}>×</button>
            {detailsLoading && <p>Đang tải chi tiết...</p>}
            {placeDetails && (
              <>
                <h3 style={{marginTop:0}}>{placeDetails.name}</h3>
                {placeDetails.address && (
                  <p style={{margin:0}}><b>Địa chỉ:</b> {Object.values(placeDetails.address).join(', ')}</p>
                )}
                {placeDetails.wikipedia_extracts && (
                  <p style={{margin:0}}>{placeDetails.wikipedia_extracts.text}</p>
                )}
                {placeDetails.info && placeDetails.info.descr && (
                  <p style={{margin:0}}>{placeDetails.info.descr}</p>
                )}
                {placeDetails.preview && placeDetails.preview.source && (
                  <img src={placeDetails.preview.source} alt={placeDetails.name} style={{ width: '100%', borderRadius: 8, marginTop: 12 }} />
                )}
                <a href={placeDetails.otm} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',marginTop:8,color:'#1a5bb8'}}>Xem trên OpenTripMap</a>
              </>
            )}
            {!detailsLoading && !placeDetails && <p>Không có thông tin chi tiết.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceExplorer;
