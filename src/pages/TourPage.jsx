import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "../css/HomePage.css";
import "../css/luxury-home.css";

function TourPage() {
  const { t } = useTranslation();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:3000/api/tours");
        // Sort tours by updated_at descending (newest first)
        const sortedTours = res.data.sort((a, b) => 
          new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
        );
        setTours(sortedTours);
      } catch (err) {
        console.error("Lỗi khi tải tour:", err);
        setError("Không thể tải danh sách tour. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  return (
    <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
      <Header />
      <main className="container px-4 py-5 flex-grow-1">
        {/* Hero Section */}
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold mb-3" style={{color: '#2c3e50'}}>
            {t('Discover Amazing Tours')}
          </h1>
          <p className="lead text-muted mb-4" style={{maxWidth: '600px', margin: '0 auto'}}>
            {t('Explore carefully curated tours and itineraries designed to give you the best travel experience')}
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Link to="/manual-planner" className="btn btn-main btn-lg px-4">
              <i className="bi bi-pencil-square me-2"></i>
              {t('Create Custom Tour')}
            </Link>
            <Link to="/ai/generate-tour" className="btn btn-outline-primary btn-lg px-4">
              <i className="bi bi-robot me-2"></i>
              {t('AI Tour Planner')}
            </Link>
          </div>
        </div>

        {/* Tours Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">{t('Loading tours...')}</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-map text-muted" style={{fontSize: '4rem', marginBottom: '1rem'}}></i>
            <h3 className="text-muted mb-3">{t('No Tours Available')}</h3>
            <p className="text-muted mb-4">{t('Create your first tour and start exploring!')}</p>
            <Link to="/manual-planner" className="btn btn-main">
              <i className="bi bi-plus-circle me-2"></i>
              {t('Create First Tour')}
            </Link>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {tours.map((tour) => (
              <div className="col" key={tour.id}>
                <div className="card h-100 shadow border-0 rounded-4 luxury-card hover-shadow">
                  <Link to={`/tours/${tour.id}`} className="text-decoration-none">
                    {tour.image_url ? (
                      <img
                        src={tour.image_url.startsWith("http") ? tour.image_url : `http://localhost:3000${tour.image_url}`}
                        alt={tour.name}
                        className="card-img-top luxury-img-top"
                        style={{
                          height: 220,
                          objectFit: "cover",
                          borderTopLeftRadius: "1.5rem",
                          borderTopRightRadius: "1.5rem"
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div 
                        className="card-img-top luxury-img-top d-flex align-items-center justify-content-center"
                        style={{
                          height: 220,
                          borderTopLeftRadius: "1.5rem",
                          borderTopRightRadius: "1.5rem",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          fontSize: "3rem"
                        }}
                      >
                        <i className="bi bi-map"></i>
                      </div>
                    )}
                    <div className="card-body luxury-card-body">
                      <h3 className="card-title mb-3" style={{ fontWeight: 600, color: '#2c3e50' }}>
                        {tour.name}
                      </h3>
                      <p className="card-text text-muted mb-3 luxury-desc">
                        {tour.description 
                          ? `${tour.description.replace(/<[^>]+>/g, '').substring(0, 120)}...`
                          : t("No description available")
                        }
                      </p>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                          <span className="luxury-star" style={{ color: '#f1c40f', fontSize: 18 }}>★</span>
                          <span style={{ fontWeight: 600, marginLeft: 4 }}>{tour.rating ? tour.rating.toFixed(1) : '0.0'}</span>
                          <span style={{ color: '#888', marginLeft: 2 }}>/ 5</span>
                        </div>
                        {tour.total_cost && (
                          <span className="badge bg-success rounded-pill">
                            <i className="bi bi-currency-dollar me-1"></i>
                            {tour.total_cost.toLocaleString()} VND
                          </span>
                        )}
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="bi bi-calendar3 me-1"></i>
                          {new Date(tour.created_at || tour.updated_at).toLocaleDateString()}
                        </small>
                        <span className="badge bg-primary rounded-pill">
                          <i className="bi bi-arrow-right me-1"></i>
                          {t('View Tour')}
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

export default TourPage;