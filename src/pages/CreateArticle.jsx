import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import articleApi from "../api/articleApi";
import { useAuth } from '../contexts/AuthContext';
import CKEditorField from "../components/CKEditorField";
import axios from "axios";
import "../css/HomePage.css";
import "../css/luxury-home.css";

function CreateArticle() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const BASE_URL = "https://walkingguide.onrender.com";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content: content
    }));
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Vui lòng chọn một file ảnh hợp lệ.");
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return "";
    
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await axios.post(`${BASE_URL}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return uploadRes.data.url;
    } catch (err) {
      console.error("Lỗi khi upload ảnh:", err);
      throw new Error("Không thể upload ảnh. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      setError("Bạn cần đăng nhập để viết bài.");
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Vui lòng điền đầy đủ tiêu đề và nội dung bài viết.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // Upload image if selected
      let uploadedImageUrl = "";
      if (imageFile) {
        uploadedImageUrl = await handleImageUpload();
      }

      const articleData = {
        ...formData,
        image_url: uploadedImageUrl,
        admin_id: user.id
      };

      console.log('Sending article data:', articleData);
      await articleApi.create(articleData);
      setSuccess("Bài viết đã được đăng thành công!");
      
      // Redirect to articles page after 2 seconds
      setTimeout(() => {
        navigate("/articles");
      }, 2000);
      
    } catch (err) {
      console.error("Lỗi khi tạo bài viết:", err);
      setError(err?.response?.data?.message || err?.response?.data?.error || err.message || "Có lỗi xảy ra khi đăng bài viết. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/articles");
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
      <Header />
      <main className="container px-4 py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card shadow-lg border-0 rounded-4 luxury-card">
              <div className="card-header luxury-card-header bg-white border-0 rounded-top-4 py-4">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <i className="bi bi-pencil-square text-primary" style={{fontSize: '2rem'}}></i>
                  </div>
                  <div>
                    <h1 className="h3 mb-1 fw-bold">{t('Write Your Travel Blog')}</h1>
                    <p className="text-muted mb-0">{t('Share your amazing travel experiences with the community')}</p>
                  </div>
                </div>
              </div>
              
              <div className="card-body luxury-card-body p-4">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                  </div>
                )}
                
                {success && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {success}
                    <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="title" className="form-label fw-semibold">
                      {t('Article Title')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg border-0 shadow-sm"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder={t('Enter your article title...')}
                      style={{borderRadius: '0.75rem'}}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-image me-2 text-primary"></i>
                      {t('Cover Image')} ({t('Optional')})
                    </label>
                    
                    {/* Image Upload Area */}
                    <div
                      className={`border-2 border-dashed rounded-4 p-4 text-center position-relative ${
                        isDragOver ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
                      }`}
                      style={{
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="position-relative w-100">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="img-fluid rounded-3"
                            style={{ maxHeight: '300px', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage();
                            }}
                            style={{ zIndex: 10 }}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      ) : (
                        <>
                          <i className="bi bi-cloud-upload text-muted" style={{fontSize: '3rem', marginBottom: '1rem'}}></i>
                          <h5 className="text-muted mb-2">{t('Upload Cover Image')}</h5>
                          <p className="text-muted mb-3">
                            {t('Drag and drop an image here, or click to select')}
                          </p>
                          <div className="d-flex gap-2 flex-wrap justify-content-center">
                            <span className="badge bg-light text-dark">JPG</span>
                            <span className="badge bg-light text-dark">PNG</span>
                            <span className="badge bg-light text-dark">GIF</span>
                            <span className="badge bg-light text-dark">WEBP</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="d-none"
                    />
                    
                    <div className="form-text mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      {t('Add a cover image to make your article more attractive. Recommended size: 1200x630px')}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-file-text me-2 text-primary"></i>
                      {t('Article Content')} <span className="text-danger">*</span>
                    </label>
                    <CKEditorField
                      value={formData.content}
                      onChange={handleContentChange}
                      placeholder={t('Share your travel story, tips, experiences, and recommendations...')}
                    />
                    <div className="form-text mt-2">
                      <i className="bi bi-lightbulb me-1"></i>
                      {t('Tips: Include details about places visited, food tried, cultural experiences, and travel tips')}
                    </div>
                  </div>

                  <div className="d-flex gap-3 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-lg px-4"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      {t('Cancel')}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-main btn-lg px-5"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {t('Publishing...')}
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          {t('Publish Article')}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CreateArticle; 