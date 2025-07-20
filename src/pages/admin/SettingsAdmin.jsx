import React, { useState, useEffect } from "react";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";
import { Button } from "react-bootstrap";
import "../../css/AdminLayout.css";
import { getFooterSettings, updateFooterSettings } from "../../api/settingsApi";

function SettingsAdmin() {
  const defaultSettings = {
    footerDescription: "Walking Guide là một trang web giúp bạn lên kế hoạch du lịch, và tìm kiếm các địa điểm du lịch gần bạn.",
    footerCopyright: `© ${new Date().getFullYear()} Walking Guide. Tất cả quyền được bảo lưu.`,
    contactEmail: "info@walkingguide.com",
    contactPhone: "+1 234 567 890",
    contactAddress: "Hà Nội, Việt Nam",
    facebookUrl: "https://facebook.com/walkingguide",
    instagramUrl: "https://instagram.com/walkingguide",
    twitterUrl: "https://twitter.com/walkingguide",
    youtubeUrl: "https://youtube.com/walkingguide"
  };
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getFooterSettings()
      .then(res => {
        if (mounted && res.data && res.data.success) {
          setSettings({ ...defaultSettings, ...res.data.data });
        }
      })
      .catch(() => {
        setSaveStatus({ type: 'error', message: 'Không thể tải cài đặt từ máy chủ.' });
      })
      .finally(() => setInitialLoading(false));
    return () => { mounted = false; };
  }, []);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus({ type: '', message: '' });
    try {
      await updateFooterSettings(settings);
      setSaveStatus({ type: 'success', message: 'Cài đặt footer đã được lưu thành công!' });
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 2000);
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Có lỗi xảy ra khi lưu cài đặt!' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="admin-content"><div className="container-fluid py-5 text-center">Đang tải cài đặt...</div></div>;
  }

  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="container-fluid">
            {/* Alert Component */}
            {saveStatus.message && (
              <div className={`alert alert-${saveStatus.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show mb-4`}>
                {saveStatus.message}
                <button type="button" className="btn-close" onClick={() => setSaveStatus({ type: '', message: '' })}></button>
              </div>
            )}

            {/* Settings Form */}
            <div className="card mb-4">
              <div className="card-header">
                <h5>Cài đặt</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-control"
                    value={settings.footerDescription}
                    onChange={e => handleInputChange('footerDescription', e.target.value)}
                    placeholder="Mô tả hiển thị trong footer"
                    rows={3}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Bản quyền</label>
                  <input
                    className="form-control"
                    value={settings.footerCopyright}
                    onChange={e => handleInputChange('footerCopyright', e.target.value)}
                    placeholder="© 2024 Walking Guide. Tất cả quyền được bảo lưu."
                  />
                </div>
                <hr className="my-4" />
                <h5 className="mb-3">Thông tin liên hệ & Mạng xã hội</h5>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      className="form-control"
                      value={settings.contactEmail}
                      onChange={e => handleInputChange('contactEmail', e.target.value)}
                      placeholder="info@walkingguide.com"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      className="form-control"
                      value={settings.contactPhone}
                      onChange={e => handleInputChange('contactPhone', e.target.value)}
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Địa chỉ</label>
                    <input
                      className="form-control"
                      value={settings.contactAddress}
                      onChange={e => handleInputChange('contactAddress', e.target.value)}
                      placeholder="Hà Nội, Việt Nam"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Facebook URL</label>
                    <input
                      className="form-control"
                      value={settings.facebookUrl}
                      onChange={e => handleInputChange('facebookUrl', e.target.value)}
                      placeholder="https://facebook.com/walkingguide"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Instagram URL</label>
                    <input
                      className="form-control"
                      value={settings.instagramUrl}
                      onChange={e => handleInputChange('instagramUrl', e.target.value)}
                      placeholder="https://instagram.com/walkingguide"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Twitter URL</label>
                    <input
                      className="form-control"
                      value={settings.twitterUrl}
                      onChange={e => handleInputChange('twitterUrl', e.target.value)}
                      placeholder="https://twitter.com/walkingguide"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">YouTube URL</label>
                    <input
                      className="form-control"
                      value={settings.youtubeUrl}
                      onChange={e => handleInputChange('youtubeUrl', e.target.value)}
                      placeholder="https://youtube.com/walkingguide"
                    />
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="admin-main-btn"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
            {/* Preview Card */}
            <div className="card">
              <div className="card-header">
                <h5>
                  <i className="bi bi-eye me-2"></i>
                  Xem trước Footer
                </h5>
              </div>
              <div className="card-body">
                <div className="preview-content">
                  <p className="text-muted mb-2">{settings.footerDescription}</p>
                  <p className="text-muted small mb-0">{settings.footerCopyright}</p>
                  <div className="mt-2">
                    <span className="me-3"><i className="bi bi-envelope me-1"></i>{settings.contactEmail}</span>
                    <span className="me-3"><i className="bi bi-telephone me-1"></i>{settings.contactPhone}</span>
                    <span className="me-3"><i className="bi bi-geo-alt me-1"></i>{settings.contactAddress}</span>
                  </div>
                  <div className="mt-2">
                    {settings.facebookUrl && <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="me-2"><i className="bi bi-facebook"></i></a>}
                    {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="me-2"><i className="bi bi-instagram"></i></a>}
                    {settings.twitterUrl && <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="me-2"><i className="bi bi-twitter-x"></i></a>}
                    {settings.youtubeUrl && <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="me-2"><i className="bi bi-youtube"></i></a>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsAdmin; 