import React, { useState } from 'react';
import { createTourReminder } from '../api/notificationApi';

const TourReminder = ({ tourId, tourName, onReminderSet }) => {
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSetReminder = async () => {
    if (!reminderDate || !reminderTime) {
      setMessage('Vui lòng chọn ngày và giờ nhắc nhở');
      return;
    }

    try {
      setLoading(true);
      const reminderDateTime = `${reminderDate}T${reminderTime}`;
      
      await createTourReminder({
        tour_id: tourId,
        tour_name: tourName,
        reminder_date: reminderDateTime
      });

      setMessage('Đã đặt nhắc nhở thành công!');
      setReminderDate('');
      setReminderTime('');
      
      if (onReminderSet) {
        onReminderSet();
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      setMessage('Có lỗi xảy ra khi đặt nhắc nhở');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-primary text-white">
        <h6 className="mb-0">
          <i className="bi bi-bell me-2"></i>
          Đặt nhắc nhở cho tour
        </h6>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label fw-bold">Tour: {tourName}</label>
        </div>
        
        <div className="row">
          <div className="col-md-6">
            <label className="form-label">Ngày nhắc nhở:</label>
            <input
              type="date"
              className="form-control"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Giờ nhắc nhở:</label>
            <input
              type="time"
              className="form-control"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>
        </div>

        {message && (
          <div className={`alert ${message.includes('thành công') ? 'alert-success' : 'alert-danger'} mt-3`}>
            {message}
          </div>
        )}

        <div className="mt-3">
          <button
            className="btn btn-primary"
            onClick={handleSetReminder}
            disabled={loading || !reminderDate || !reminderTime}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Đang đặt nhắc nhở...
              </>
            ) : (
              <>
                <i className="bi bi-bell me-2"></i>
                Đặt nhắc nhở
              </>
            )}
          </button>
        </div>

        <div className="mt-3">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Bạn sẽ nhận được thông báo khi đến thời gian nhắc nhở
          </small>
        </div>
      </div>
    </div>
  );
};

export default TourReminder; 