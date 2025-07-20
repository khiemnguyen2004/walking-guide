import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getUserNotifications, getUnreadCount, markAllAsRead, updateNotification, deleteNotification } from '../api/notificationApi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

console.log('[NotificationIcon] File loaded');

const NotificationIcon = () => {
  const { user, notificationRefreshTrigger } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[NotificationIcon] notificationRefreshTrigger:', notificationRefreshTrigger);
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user, notificationRefreshTrigger]);

  useEffect(() => {
    if (showDropdown && unreadCount > 0 && user) {
      // Mark all as read in backend
      markAllAsRead(user.id).then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      });
    }
    // eslint-disable-next-line
  }, [showDropdown]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getUserNotifications(user.id);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount(user.id);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
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
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(user.id);
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation(); // Prevent triggering mark as read
    setNotificationToDelete(notificationId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;
    
    try {
      await deleteNotification(notificationToDelete);
      const deletedNotification = notifications.find(n => n.notification_id === notificationToDelete);
      setNotifications(prev => prev.filter(notif => notif.notification_id !== notificationToDelete));
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
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

  if (!user) return null;

  return (
    <div className="position-relative">
      <button
        className="btn rounded-circle p-0 d-flex align-items-center justify-content-center border-0 position-relative"
        style={{ width: 48, height: 48, background: 'none', boxShadow: 'none' }}
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <i className="bi bi-bell" style={{ fontSize: 24, color: '#1a5bb8' }}></i>
        {unreadCount > 0 && !showDropdown && (
          <span 
            className="position-absolute badge rounded-pill bg-danger"
            style={{ 
              fontSize: '0.7rem', 
              top: '2px', 
              right: '-8px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 6px'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div 
          className="dropdown-menu show position-absolute d-flex flex-column"
          style={{ 
            minWidth: 350, 
            maxWidth: 400, 
            maxHeight: 500, 
            overflowY: 'auto',
            right: 0,
            left: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: 'none',
            borderRadius: '12px',
            padding: 0
          }}
        >
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0 fw-bold">Thông báo</h6>
            {unreadCount > 0 && (
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={handleMarkAllAsRead}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="flex-grow-1 p-0" style={{overflowY: 'auto'}}>
            {loading ? (
              <div className="text-center p-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-4 text-muted">
                <i className="bi bi-bell-slash" style={{ fontSize: '2rem' }}></i>
                <p className="mt-2 mb-0">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.notification_id}
                  className={`p-3 border-bottom ${!notification.is_read ? 'bg-light' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleMarkAsRead(notification.notification_id);
                    handleNotificationClick(notification);
                  }}
                >
                  <div className="d-flex align-items-start">
                    <div className="me-3 mt-1">
                      <i className={getNotificationIcon(notification.type)} style={{ fontSize: '1.2rem' }}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <p className="mb-1" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                          {notification.content}
                        </p>
                        {!notification.is_read && (
                          <span className="badge bg-primary rounded-pill ms-2" style={{ fontSize: '0.6rem' }}>
                            Mới
                          </span>
                        )}
                      </div>
                      <small className="text-muted">
                        {formatDate(notification.created_at)}
                      </small>
                      {!notification.is_read && (
                        <button
                          className="btn btn-sm btn-outline-primary mt-2"
                          style={{fontSize: '0.8rem', padding: '2px 8px'}}
                          onClick={e => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.notification_id);
                          }}
                        >
                          <i className="bi bi-check me-1"></i>
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div className="ms-2">
                      <i 
                        className="bi bi-trash" 
                        style={{ fontSize: '1.2rem', color: '#dc3545', cursor: 'pointer' }}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteNotification(notification.notification_id, event);
                        }}
                      ></i>
                    </div>
                  </div>
                </div>
              ))
            )}
          {notifications.length > 0 && (
            <div className="p-2 text-center">
              <small className="text-muted">
                {notifications.length} thông báo
              </small>
            </div>
          )}
          </div>
          <div className="border-top bg-white text-center" style={{position: 'sticky', bottom: 0, zIndex: 3, padding: '16px 0'}}>
            <RouterLink to="/notifications" className="btn btn-link fw-bold text-decoration-none" style={{color: '#1a5bb8'}}>
              <i className="bi bi-arrow-right-circle me-2"></i>
              Xem tất cả thông báo
            </RouterLink>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div 
          className="position-fixed" 
          style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
          onClick={() => setShowDropdown(false)}
        />
      )}

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

export default NotificationIcon; 