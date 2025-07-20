import React, { useEffect, useState } from 'react';

const Toast = ({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose, 
  position = 'top-right' 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="bi bi-check-circle-fill"></i>;
      case 'error':
        return <i className="bi bi-exclamation-triangle-fill"></i>;
      case 'warning':
        return <i className="bi bi-exclamation-triangle-fill"></i>;
      case 'info':
        return <i className="bi bi-info-circle-fill"></i>;
      default:
        return <i className="bi bi-check-circle-fill"></i>;
    }
  };

  const getToastClass = () => {
    const baseClass = 'toast-notification';
    const typeClass = `toast-${type}`;
    const positionClass = `toast-${position.replace('-', '-')}`;
    const animationClass = isExiting ? 'toast-exit' : 'toast-enter';
    
    return `${baseClass} ${typeClass} ${positionClass} ${animationClass}`;
  };

  if (!isVisible) return null;

  return (
    <div className={getToastClass()}>
      <div className="toast-content">
        <div className="toast-icon">
          {getIcon()}
        </div>
        <div className="toast-message">
          {message}
        </div>
        <button 
          className="toast-close" 
          onClick={handleClose}
          aria-label="Close notification"
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
      <div className="toast-progress">
        <div 
          className="toast-progress-bar" 
          style={{ 
            animationDuration: `${duration}ms`,
            animationDelay: '0ms'
          }}
        ></div>
      </div>
    </div>
  );
};

export default Toast; 