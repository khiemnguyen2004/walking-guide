import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import userApi from "../api/userApi";
import tourApi from "../api/tourApi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/UserPage.css";

function UserPage() {
  const { user: authUser, login } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: ""
  });
  const [userTours, setUserTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (authUser) {
      loadUserProfile();
      loadUserTours();
    }
  }, [authUser]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userApi.getProfile();
      setUserProfile(response.data);
      setEditForm({
        full_name: response.data.full_name,
        email: response.data.email
      });
    } catch (err) {
      setError("Failed to load profile");
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserTours = async () => {
    try {
      const response = await tourApi.getUserTours(authUser.id);
      console.log("UserPage - User tours:", response.data); // Debug log
      console.log("UserPage - First tour image_url:", response.data[0]?.image_url); // Debug log
      setUserTours(response.data);
    } catch (err) {
      console.error("Error loading user tours:", err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      full_name: userProfile.full_name,
      email: userProfile.email
    });
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const response = await userApi.updateProfile(editForm);
      setUserProfile(response.data);
      setIsEditing(false);
      
      // Update auth context with new user data
      login(response.data);
      
      setError(null);
    } catch (err) {
      setError("Failed to update profile");
      console.error("Error updating profile:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }
    try {
      setPasswordLoading(true);
      await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Failed to update password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://walkingguide.onrender.com/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return data.url;
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    
    try {
      setIsUploadingImage(true);
      const imageUrl = await uploadImage(imageFile);
      
      // Update user profile with new image
      const response = await userApi.updateProfile({
        ...editForm,
        image_url: imageUrl
      });
      
      setUserProfile(response.data);
      login(response.data);
      setImageFile(null);
      setImagePreview("");
      setError(null);
    } catch (err) {
      setError("Failed to upload image");
      console.error("Error uploading image:", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!authUser) {
    return (
      <div className="user-page-container">
        <Header />
        <div className="user-page-content">
          <h1>Hồ sơ người dùng</h1>
          <p>Vui lòng đăng nhập để xem hồ sơ của bạn.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="user-page-container">
        <Header />
        <div className="user-page-content">
          <div className="loading">Đang tải hồ sơ...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="user-page-container">
      <Header />
      <div className="user-page-content">
        <div className="profile-header">
          <h1>Hồ sơ người dùng</h1>
          <div className="profile-avatar">
            {userProfile?.image_url ? (
              <img
                src={userProfile.image_url.startsWith("http") ? userProfile.image_url : `${BASE_URL}${userProfile.image_url}`}
                alt={userProfile.full_name}
                className="avatar-image"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #fff',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="avatar-circle"
              style={{ display: userProfile?.image_url ? 'none' : 'flex' }}
            >
              {userProfile?.full_name?.charAt(0).toUpperCase()}
            </div>
            {!isEditing && (
              <div className="avatar-upload">
                <label htmlFor="profile-image" className="upload-btn">
                  <i className="bi bi-camera"></i>
                </label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
          
          {/* Image preview and upload section */}
          {(imageFile || imagePreview) && (
            <div className="image-upload-section" style={{ marginTop: '20px', textAlign: 'center' }}>
              <div style={{ marginBottom: '10px' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #ddd'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  className="save-btn"
                  onClick={handleImageUpload}
                  disabled={isUploadingImage}
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  {isUploadingImage ? 'Đang tải...' : 'Lưu ảnh'}
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="profile-sections">
          {/* Personal Information Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Thông tin cá nhân</h2>
              {!isEditing && (
                <button className="edit-btn" onClick={handleEdit}>
                  Chỉnh sửa hồ sơ
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label htmlFor="full_name">Họ và tên</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={editForm.full_name}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-actions">
                  <button 
                    className="save-btn" 
                    onClick={handleSave}
                    disabled={saveLoading}
                  >
                    {saveLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Họ và tên:</span>
                  <span className="info-value">{userProfile?.full_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{userProfile?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Mật khẩu:</span>
                  <span className="info-value">
                    ••••••••
                  </span>
                  <button
                    className="edit-btn"
                    style={{ background: showPasswordForm ? '#6c757d' : '#3498db', marginTop: 10 }}
                    onClick={() => setShowPasswordForm((v) => !v)}
                    type="button"
                  >
                    {showPasswordForm ? 'Hủy đổi mật khẩu' : 'Đổi mật khẩu'}
                  </button>
                </div>
                {showPasswordForm && (
                  <form className="edit-form" onSubmit={handlePasswordChange} style={{marginTop: 20}}>
                    <div className="form-group">
                      <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newPassword">Mật khẩu mới</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        value={passwordForm.confirmNewPassword}
                        onChange={handlePasswordInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                    {passwordError && <div className="error-message">{passwordError}</div>}
                    {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
                    <div className="form-actions">
                      <button
                        className="save-btn"
                        type="submit"
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? 'Đang lưu...' : 'Lưu mật khẩu'}
                      </button>
                    </div>
                  </form>
                )}
                <div className="info-item">
                  <span className="info-label">Thành viên từ:</span>
                  <span className="info-value">
                    {userProfile?.created_at ? formatDate(userProfile.created_at) : 'Không rõ'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Section */}
          <div className="profile-section">
            <h2>Thống kê của bạn</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{userTours.length}</div>
                <div className="stat-label">Tổng số tour</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Tour đã hoàn thành</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{userTours.length}</div>
                <div className="stat-label">Tour đã lên kế hoạch</div>
              </div>
            </div>
          </div>

          {/* Recent Tours Section */}
          <div className="profile-section">
            <h2>Tour gần đây</h2>
            {userTours.length > 0 ? (
              <div className="tours-list">
                {userTours.slice(0, 5).map(tour => {
                  console.log("UserPage - Rendering tour:", tour.name, "image_url:", tour.image_url); // Debug log
                  return (
                  <div key={tour.id} className="tour-item">
                      <div className="tour-image">
                        {tour.image_url ? (
                          <img
                            src={tour.image_url.startsWith("http") ? tour.image_url : `${BASE_URL}${tour.image_url}`}
                            alt={tour.name}
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                              border: '2px solid #e9ecef'
                            }}
                            onError={(e) => {
                              console.log("UserPage - Tour image failed to load:", e.target.src); // Debug log
                              e.target.style.display = 'none';
                            }}
                            onLoad={() => console.log("UserPage - Tour image loaded successfully:", tour.name)} // Debug log
                          />
                        ) : (
                          <div 
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #1a5bb8 0%, #1a5bb8 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '1.5rem'
                            }}
                          >
                            <i className="bi bi-map"></i>
                          </div>
                        )}
                      </div>
                    <div className="tour-info">
                      <h3 className="tour-title">{tour.name}</h3>
                      <p className="tour-description">{tour.description}</p>
                      <div className="tour-meta">
                        <span className="tour-date">
                          {tour.start_time && tour.end_time 
                            ? `${formatDate(tour.start_time)} - ${formatDate(tour.end_time)}`
                            : 'Chưa đặt ngày'
                          }
                        </span>
                        <span className={`tour-status status-planned`}>
                          Đã lên kế hoạch
                        </span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-tours">
                <p>Bạn chưa tạo tour nào.</p>
                <a href="/plan-trip" className="create-tour-btn">
                  Tạo tour đầu tiên của bạn
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default UserPage;