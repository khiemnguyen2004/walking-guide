import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "../css/HomePage.css";
import "../css/luxury-home.css";

function ArticlePage() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:3000/api/articles");
        // Sort articles by updated_at descending (newest first)
        const sortedArticles = res.data.sort((a, b) => 
          new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
        );
        setArticles(sortedArticles);
      } catch (err) {
        console.error("Lỗi khi tải bài viết:", err);
        setError("Không thể tải danh sách bài viết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
      <Header />
      <main className="container px-4 py-5 flex-grow-1">
        {/* Hero Section */}
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold mb-3" style={{color: '#2c3e50'}}>
            {t('Travel Stories & Experiences')}
          </h1>
          <p className="lead text-muted mb-4" style={{maxWidth: '600px', margin: '0 auto'}}>
            {t('Discover amazing travel stories, tips, and experiences shared by our community of travelers')}
          </p>
          <Link to="/create-article" className="btn btn-main btn-lg px-5">
            <i className="bi bi-pencil-square me-2"></i>
            {t('Share Your Story')}
          </Link>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">{t('Loading articles...')}</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-journal-text text-muted" style={{fontSize: '4rem', marginBottom: '1rem'}}></i>
            <h3 className="text-muted mb-3">{t('No Articles Yet')}</h3>
            <p className="text-muted mb-4">{t('Be the first to share your travel experience!')}</p>
            <Link to="/create-article" className="btn btn-main">
              <i className="bi bi-plus-circle me-2"></i>
              {t('Write First Article')}
            </Link>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {articles.map((article) => (
              <div className="col" key={article.article_id || article.id}>
                <div className="card h-100 shadow border-0 rounded-4 luxury-card hover-shadow">
                  <Link to={`/articles/${article.article_id || article.id}`} className="text-decoration-none">
                    {article.image_url ? (
                      <img
                        src={article.image_url.startsWith("http") ? article.image_url : `http://localhost:3000${article.image_url}`}
                        alt={article.title}
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
                        <i className="bi bi-journal-text"></i>
                      </div>
                    )}
                    <div className="card-body luxury-card-body">
                      <h3 className="card-title mb-3" style={{ fontWeight: 600, color: '#2c3e50' }}>
                        {article.title}
                      </h3>
                      <p className="card-text text-muted mb-3 luxury-desc">
                        {article.content 
                          ? `${article.content.replace(/<[^>]+>/g, '').substring(0, 120)}...`
                          : t("No content available")
                        }
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="bi bi-calendar3 me-1"></i>
                          {new Date(article.published_at || article.updated_at).toLocaleDateString()}
                        </small>
                        <span className="badge bg-primary rounded-pill">
                          <i className="bi bi-eye me-1"></i>
                          {t('Read More')}
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

export default ArticlePage;