import axiosClient from './axiosClient';

export const getNotifications = () => {
  return axiosClient.get('/notifications');
};

export const getUserNotifications = (userId) => {
  return axiosClient.get(`/notifications/user/${userId}`);
};

export const getUnreadCount = (userId) => {
  return axiosClient.get(`/notifications/user/${userId}/unread-count`);
};

export const createNotification = (data) => {
  return axiosClient.post('/notifications', data);
};

export const updateNotification = (id, data) => {
  return axiosClient.put(`/notifications/${id}`, data);
};

export const markAllAsRead = (userId) => {
  return axiosClient.put(`/notifications/user/${userId}/mark-all-read`);
};

export const deleteNotification = (id) => {
  return axiosClient.delete(`/notifications/${id}`);
};

export const createTourReminder = (data) => {
  return axiosClient.post('/notifications/tour-reminder', data);
}; 