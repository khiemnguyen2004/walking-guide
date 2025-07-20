import { useState } from 'react';

export const useAlert = () => {
  const [alertModal, setAlertModal] = useState({ 
    show: false, 
    message: '', 
    title: '', 
    type: 'info',
    confirmText: 'Đóng'
  });
  
  const [confirmModal, setConfirmModal] = useState({ 
    show: false, 
    message: '', 
    title: 'Xác nhận',
    onConfirm: null,
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    type: 'warning',
    confirmVariant: 'danger'
  });

  const showAlert = (message, title = 'Thông báo', type = 'info', confirmText = 'Đóng') => {
    setAlertModal({
      show: true,
      message,
      title,
      type,
      confirmText
    });
  };

  const hideAlert = () => {
    setAlertModal({
      show: false,
      message: '',
      title: '',
      type: 'info',
      confirmText: 'Đóng'
    });
  };

  const showConfirm = (message, onConfirm, title = 'Xác nhận', confirmText = 'Xác nhận', cancelText = 'Hủy', type = 'warning', confirmVariant = 'danger') => {
    setConfirmModal({
      show: true,
      message,
      title,
      onConfirm,
      confirmText,
      cancelText,
      type,
      confirmVariant
    });
  };

  const hideConfirm = () => {
    setConfirmModal({
      show: false,
      message: '',
      title: 'Xác nhận',
      onConfirm: null,
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      type: 'warning',
      confirmVariant: 'danger'
    });
  };

  const handleConfirm = () => {
    if (confirmModal.onConfirm) {
      confirmModal.onConfirm();
    }
    hideConfirm();
  };

  // Convenience methods for common alert types
  const showSuccess = (message, title = 'Thành công') => {
    showAlert(message, title, 'success', 'Đóng');
  };

  const showError = (message, title = 'Lỗi') => {
    showAlert(message, title, 'error', 'Đóng');
  };

  const showWarning = (message, title = 'Cảnh báo') => {
    showAlert(message, title, 'warning', 'Đóng');
  };

  const showInfo = (message, title = 'Thông tin') => {
    showAlert(message, title, 'info', 'Đóng');
  };

  // Convenience methods for common confirm types
  const showDeleteConfirm = (message, onConfirm, title = 'Xác nhận xóa') => {
    showConfirm(message, onConfirm, title, 'Xóa', 'Hủy', 'danger', 'danger');
  };

  const showCancelConfirm = (message, onConfirm, title = 'Xác nhận hủy') => {
    showConfirm(message, onConfirm, title, 'Hủy', 'Không', 'warning', 'warning');
  };

  return {
    alertModal,
    confirmModal,
    showAlert,
    hideAlert,
    showConfirm,
    hideConfirm,
    handleConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showDeleteConfirm,
    showCancelConfirm
  };
}; 