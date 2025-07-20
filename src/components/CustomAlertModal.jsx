import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const CustomAlertModal = ({ 
  show, 
  onClose, 
  title = "Thông báo", 
  message, 
  type = "info", // success, error, warning, info
  confirmText = "Đóng"
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="bi bi-check-circle-fill text-success me-2"></i>;
      case 'error':
        return <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>;
      case 'warning':
        return <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>;
      default:
        return <i className="bi bi-info-circle-fill text-info me-2"></i>;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered className="luxury-modal">
      <Modal.Header closeButton className="luxury-modal-header">
        <Modal.Title className="luxury-modal-title d-flex align-items-center">
          {getIcon()}
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="luxury-modal-body">
        <div className="text-center">
          <p className="mb-0" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            {message}
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer className="luxury-modal-footer">
        <Button 
          variant={getButtonVariant()} 
          onClick={onClose}
          className="btn-main"
          style={{ minWidth: '100px' }}
        >
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CustomAlertModal; 