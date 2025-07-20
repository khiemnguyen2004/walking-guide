import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const CustomConfirmModal = ({ 
  show, 
  onClose, 
  onConfirm, 
  title = "Xác nhận", 
  message, 
  confirmText = "Xác nhận", 
  cancelText = "Hủy",
  type = "warning", // danger, warning, info
  confirmVariant = "danger"
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>;
      case 'warning':
        return <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>;
      default:
        return <i className="bi bi-question-circle-fill text-info me-2"></i>;
    }
  };

  const getConfirmVariant = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
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
          variant="secondary" 
          onClick={onClose}
          style={{ minWidth: '100px' }}
        >
          {cancelText}
        </Button>
        <Button 
          variant={getConfirmVariant()} 
          onClick={onConfirm}
          className="btn-main"
          style={{ minWidth: '100px' }}
        >
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CustomConfirmModal; 