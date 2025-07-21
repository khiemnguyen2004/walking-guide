import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "../css/HomePage.css";
import "../css/luxury-home.css";
import axiosClient from '../api/axiosClient';
const BASE_URL = "https://walkingguide.onrender.com";

function PlacePage() {
  const { t } = useTranslation();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get("/places");
        // Sort places by updated_at descending (newest first)
        const sortedPlaces = res.data.sort((a, b) => 
          new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
        );
        setPlaces(sortedPlaces);
      } catch (err) {
        console.error("Error:", {
          message: err.message,
          code: err.code,
          response: err.response ? err.response.data : null,
        });
        setError("Không thể kết nối đến server. Dữ liệu mặc định sẽ được sử dụng.");
        setPlaces([
          {
            id: 4,
            name: "Hòn Chồng",
            description: "Địa điểm ngắm biển đẹp, yên bình.",
            latitude: 12.2701,
            longitude: 109.2038,
            image_url: "https://example.com/honchong.jpg",
            rating: 4.2,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  return (
    <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
      <Header />
      <main className="container px-4 py-5 flex-grow-1">
        {/* Hero Section */}
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold mb-3" style={{color: '#2c3e50'}}>
            {t('Explore Amazing Destinations')}
          </h1>
          <p className="lead text-muted mb-4" style={{maxWidth: '600px', margin: '0 auto'}}>
            {t('Discover beautiful places, hidden gems, and must-visit destinations around the world')}
          </p>
          <Link to="/" className="btn btn-main btn-lg px-5">
            <i className="bi bi-map me-2"></i>
            {t('View on Map')}
          </Link>
        </div>

        {/* Places Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">{t('Loading destinations...')}</p>
          </div>
        ) : error ? (
          <div className="alert alert-warning text-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-geo-alt text-muted" style={{fontSize: '4rem', marginBottom: '1rem'}}></i>
            <h3 className="text-muted mb-3">{t('No Destinations Found')}</h3>
            <p className="text-muted mb-4">{t('Check back later for new destinations!')}</p>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {places.map((place) => (
              <div className="col" key={place.id}>
                <div className="card h-100 shadow border-0 rounded-4 luxury-card hover-shadow">
                  <Link to={`/places/${place.id}`} className="text-decoration-none">
                    <img
                      src={place.image_url 
                        ? (place.image_url.startsWith('http') 
                            ? place.image_url 
                            : `${BASE_URL}${place.image_url}`)
                        : "/default-place.jpg"}
                      alt={place.name}
                      className="card-img-top luxury-img-top"
                      style={{
                        height: 220,
                        objectFit: "cover",
                        borderTopLeftRadius: "1.5rem",
                        borderTopRightRadius: "1.5rem"
                      }}
                      onError={(e) => {
                        e.target.src = "/default-place.jpg";
                      }}
                    />
                    <div className="card-body luxury-card-body">
                      <h3 className="card-title mb-2" style={{ fontWeight: 600, color: '#2c3e50' }}>
                        {place.name}
                      </h3>
                      {place.city && (
                        <p className="card-text text-primary mb-2 small">
                          <i className="bi bi-geo-alt-fill me-1"></i>
                          {place.city}
                        </p>
                      )}
                      <p className="card-text text-muted mb-3 luxury-desc">
                        {place.description 
                          ? `${place.description.replace(/<[^>]+>/g, '').substring(0, 120)}...`
                          : t("No description available")
                        }
                      </p>
                      {place.service && (
                        <p className="card-text text-muted mb-3 small">
                          <i className="bi bi-activity me-1"></i>
                          {place.service.length > 80 ? `${place.service.substring(0, 80)}...` : place.service}
                        </p>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <span className="luxury-star" style={{ color: '#f1c40f', fontSize: 18 }}>★</span>
                          <span style={{ fontWeight: 600, marginLeft: 4 }}>{place.rating ? place.rating.toFixed(1) : '0.0'}</span>
                          <span style={{ color: '#888', marginLeft: 2 }}>/ 5</span>
                        </div>
                        <span className="badge bg-primary rounded-pill">
                          <i className="bi bi-arrow-right me-1"></i>
                          {t('Explore')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default PlacePage;