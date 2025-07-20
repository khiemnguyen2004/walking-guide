import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';

const REPORT_TYPES = [
  { value: '', label: 'Chọn loại báo cáo' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Nội dung không phù hợp' },
  { value: 'misinformation', label: 'Thông tin sai lệch' },
  { value: 'copyright', label: 'Vi phạm bản quyền' },
  { value: 'other', label: 'Khác' },
];

const ReportArticleModal = ({ open, onClose, onSubmit, submitting, error, success }) => {
  const [type, setType] = useState('');
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) {
      setType('');
      setReason('');
      setLocalError('');
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!type) {
      setLocalError('Vui lòng chọn loại báo cáo.');
      return;
    }
    if (!reason.trim()) {
      setLocalError('Vui lòng nhập lý do báo cáo.');
      return;
    }
    setLocalError('');
    onSubmit({ type, reason });
  };

  return (
    <Modal show={open} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Báo cáo bài viết</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {success && <Alert variant="success">Báo cáo của bạn đã được gửi!</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        {localError && <Alert variant="warning">{localError}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Loại báo cáo</label>
            <div>
              {REPORT_TYPES.filter(opt => opt.value).map(opt => (
                <div className="form-check form-check-inline" key={opt.value}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="reportType"
                    id={`report-type-${opt.value}`}
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={e => setType(e.target.value)}
                    disabled={submitting || success}
                  />
                  <label className="form-check-label" htmlFor={`report-type-${opt.value}`}>
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Lý do báo cáo</label>
            <textarea
              className="form-control"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Mô tả lý do bạn muốn báo cáo bài viết này..."
              rows={4}
              disabled={submitting || success}
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting || success}>
              Hủy
            </Button>
            <Button type="submit" variant="danger" disabled={submitting || success}>
              {submitting ? <Spinner animation="border" size="sm" /> : 'Gửi báo cáo'}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default ReportArticleModal; 