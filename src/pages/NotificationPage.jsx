import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getUserNotifications, markAllAsRead, updateNotification, deleteNotification } from '../api/notificationApi';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/UserPage.css';

const NotificationPage = () => {
  const { user, notificationRefreshTrigger } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, notificationRefreshTrigger]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getUserNotifications(user.id);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await updateNotification(notificationId, { is_read: true });
      setNotifications(prev => 
        prev.map(notif => 
          notif.notification_id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(user.id);
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    setNotificationToDelete(notificationId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;
    
    try {
      await deleteNotification(notificationToDelete);
      setNotifications(prev => prev.filter(notif => notif.notification_id !== notificationToDelete));
      setShowDeleteModal(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setNotificationToDelete(null);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'tour_reminder':
        return 'bi bi-calendar-event text-warning';
      case 'tour_completion':
        return 'bi bi-check-circle text-success';
      case 'tour_created':
        return 'bi bi-plus-circle text-primary';
      default:
        return 'bi bi-bell text-info';
    }
  };

  const getNotificationBadge = (type) => {
    switch (type) {
      case 'tour_reminder':
        return 'badge bg-warning text-dark';
      case 'tour_completion':
        return 'badge bg-success';
      case 'tour_created':
        return 'badge bg-primary';
      default:
        return 'badge bg-info';
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.article_id && notification.comment_id) {
      navigate(`/articles/${notification.article_id}#comment-${notification.comment_id}`);
    } else if (notification.article_id) {
      navigate(`/articles/${notification.article_id}`);
    } else if (notification.tour_id) {
      navigate(`/tours/${notification.tour_id}`);
    } else if (notification.place_id) {
      navigate(`/places/${notification.place_id}`);
    }
  };

  if (!user) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
        <Header />
        <main className="container py-4 flex-grow-1">
          <div className="alert alert-warning">Bạn cần đăng nhập để xem thông báo.</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-gradient-to-br from-gray-100 to-white luxury-home-container">
      <Header />
      <main className="container py-4 flex-grow-1">
        <div className="user-page-content">
          <div className="profile-header">
            <h1 className="text-center mb-0">
              <i className="bi bi-bell me-3"></i>
              Thông báo của tôi
            </h1>
          </div>

          <div className="profile-sections">
            <div className="profile-section">
              <div className="section-header">
                <h3>Danh sách thông báo</h3>
                {notifications.length > 0 && (
                  <button 
                    className="btn btn-outline-primary"
                    onClick={handleMarkAllAsRead}
                  >
                    <i className="bi bi-check-all me-2"></i>
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>

              {loading ? (
                <div className="loading">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Đang tải thông báo...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              ) : notifications.length === 0 ? (
                <div className="no-tours">
                  <i className="bi bi-bell-slash fa-3x text-muted mb-3"></i>
                  <p>Bạn chưa có thông báo nào</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.notification_id}
                      className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-content">
                        <div className="notification-header">
                          <div className="d-flex align-items-center">
                            <i className={getNotificationIcon(notification.type)} style={{ fontSize: '1.5rem', marginRight: '1rem' }}></i>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start">
                                <p className="notification-text mb-1">
                                  {notification.content}
                                </p>
                                <div className="notification-actions">
                                  {!notification.is_read && (
                                    <span className="badge bg-primary rounded-pill me-2">
                                      Mới
                                    </span>
                                  )}
                                  <span className={getNotificationBadge(notification.type)}>
                                    {notification.type === 'tour_reminder' && 'Nhắc nhở'}
                                    {notification.type === 'tour_completion' && 'Hoàn thành'}
                                    {notification.type === 'tour_created' && 'Tạo tour'}
                                    {!notification.type && 'Thông báo'}
                                  </span>
                                </div>
                              </div>
                              <small className="text-muted">
                                {formatDate(notification.created_at)}
                              </small>
                            </div>
                          </div>
                        </div>
                        <div className="notification-actions mt-2">
                          {!notification.is_read && (
                            <button 
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleMarkAsRead(notification.notification_id)}
                            >
                              <i className="bi bi-check me-1"></i>
                              Đánh dấu đã đọc
                            </button>
                          )}
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteNotification(notification.notification_id)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Delete Confirmation Modal */}
      <div className={`modal fade ${showDeleteModal ? 'show' : ''}`} 
           style={{ display: showDeleteModal ? 'block' : 'none' }} 
           tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Xác nhận xóa
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={cancelDelete}></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">Bạn có chắc muốn xóa thông báo này? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cancelDelete}>
                <i className="bi bi-x-circle me-1"></i>
                Hủy
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                <i className="bi bi-trash me-1"></i>
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
      {showDeleteModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default NotificationPage; 