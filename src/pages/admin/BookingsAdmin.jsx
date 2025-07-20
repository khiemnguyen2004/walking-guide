import React, { useEffect, useState } from "react";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";
import axios from "axios";
import { Modal, Button, Badge, Alert } from "react-bootstrap";
import "../../css/AdminLayout.css";

function BookingsAdmin() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionType, setActionType] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [selectedStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let url = "http://localhost:3000/api/bookings/admin/all";
      if (selectedStatus !== "all") {
        url = `http://localhost:3000/api/bookings/admin/status/${selectedStatus}`;
      }
      
      const response = await axios.get(url);
      setBookings(response.data.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Lỗi khi tải danh sách đặt tour");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/bookings/admin/stats");
      setStats(response.data.data || {});
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleAction = (booking, type) => {
    setSelectedBooking(booking);
    setActionType(type);
    setAdminNotes("");
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedBooking) return;

    try {
      setProcessing(true);
      let url = "";
      let data = {};

      switch (actionType) {
        case "approve":
          url = `http://localhost:3000/api/bookings/admin/${selectedBooking.id}/approve`;
          data = { admin_notes: adminNotes };
          break;
        case "reject":
          url = `http://localhost:3000/api/bookings/admin/${selectedBooking.id}/reject`;
          data = { admin_notes: adminNotes };
          break;
        case "cancel":
          url = `http://localhost:3000/api/bookings/admin/${selectedBooking.id}/cancel`;
          data = { admin_notes: adminNotes };
          break;
        default:
          return;
      }

      const response = await axios.put(url, data);
      
      if (response.data.success) {
        // Refresh data
        fetchBookings();
        fetchStats();
        setShowActionModal(false);
        setSelectedBooking(null);
        setActionType("");
        setAdminNotes("");
      }
    } catch (error) {
      console.error("Error processing action:", error);
      alert("Lỗi khi xử lý yêu cầu. Vui lòng thử lại.");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "warning", text: "Chờ xử lý" },
      approved: { variant: "success", text: "Đã phê duyệt" },
      rejected: { variant: "danger", text: "Đã từ chối" },
      cancelled: { variant: "secondary", text: "Đã hủy" }
    };

    const config = statusConfig[status] || { variant: "light", text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const summarizeTourName = (tourName, maxLength = 30) => {
    if (!tourName) return 'N/A';
    if (tourName.length <= maxLength) return tourName;
    return tourName.substring(0, maxLength) + '...';
  };

  const getActionButton = (booking) => {
    if (booking.status === 'pending') {
      return (
        <div className="btn-group" role="group">
          <button
            className="btn btn-sm btn-success"
            onClick={() => handleAction(booking, 'approve')}
            title="Phê duyệt"
          >
            <i className="bi bi-check-circle"></i>
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => handleAction(booking, 'reject')}
            title="Từ chối"
          >
            <i className="bi bi-x-circle"></i>
          </button>
        </div>
      );
    } else if (booking.status !== 'cancelled') {
      return (
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => handleAction(booking, 'cancel')}
          title="Hủy đặt tour"
        >
          <i className="bi bi-x-circle"></i> Hủy
        </button>
      );
    }
    return null;
  };

  const getModalTitle = () => {
    switch (actionType) {
      case "approve":
        return "Phê duyệt đặt tour";
      case "reject":
        return "Từ chối đặt tour";
      case "cancel":
        return "Hủy đặt tour";
      default:
        return "Xử lý đặt tour";
    }
  };

  const getModalBody = () => {
    switch (actionType) {
      case "approve":
        return "Bạn có chắc chắn muốn phê duyệt đặt tour này?";
      case "reject":
        return "Bạn có chắc chắn muốn từ chối đặt tour này? Vui lòng cung cấp lý do.";
      case "cancel":
        return "Bạn có chắc chắn muốn hủy đặt tour này?";
      default:
        return "";
    }
  };

  const isNotesRequired = () => {
    return actionType === "reject";
  };

  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="container-fluid">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="all">Tất cả ({stats.total})</option>
                  <option value="pending">Chờ xử lý ({stats.pending})</option>
                  <option value="approved">Đã phê duyệt ({stats.approved})</option>
                  <option value="rejected">Đã từ chối ({stats.rejected})</option>
                  <option value="cancelled">Đã hủy ({stats.cancelled})</option>
                </select>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    fetchBookings();
                    fetchStats();
                  }}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-4">
              <div className="col-md-2">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-primary">{stats.total}</h5>
                    <p className="card-text small">Tổng cộng</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-warning">{stats.pending}</h5>
                    <p className="card-text small">Chờ xử lý</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-success">{stats.approved}</h5>
                    <p className="card-text small">Đã phê duyệt</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-danger">{stats.rejected}</h5>
                    <p className="card-text small">Đã từ chối</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-secondary">{stats.cancelled}</h5>
                    <p className="card-text small">Đã hủy</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="card">
              <div className="card-header">
                <h5>Danh sách đặt tour</h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-2">Không có đặt tour nào</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Người dùng</th>
                          <th>Tour</th>
                          <th>Ngày đi</th>
                          <th>Ngày về</th>
                          <th>Số chỗ</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                          <th>Ngày tạo</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id}>
                            <td>{booking.id}</td>
                            <td>
                              <div>
                                <div className="fw-semibold">{booking.user?.full_name || 'N/A'}</div>
                                <small className="text-muted">{booking.user?.email || 'N/A'}</small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div 
                                  className="fw-semibold" 
                                  title={booking.tour?.name && booking.tour.name.length > 30 ? booking.tour.name : ''}
                                  style={{ cursor: booking.tour?.name && booking.tour.name.length > 30 ? 'help' : 'default' }}
                                >
                                  {summarizeTourName(booking.tour?.name)}
                                </div>
                                <small className="text-muted">ID: {booking.tour_id}</small>
                              </div>
                            </td>
                            <td>{formatDate(booking.start_date)}</td>
                            <td>{formatDate(booking.end_date)}</td>
                            <td>{booking.spots}</td>
                            <td>{formatPrice(booking.total_price)}</td>
                            <td>{getStatusBadge(booking.status)}</td>
                            <td>
                              <div>
                                <div>{formatDate(booking.created_at)}</div>
                                <small className="text-muted">{formatDateTime(booking.created_at).split(' ')[1]}</small>
                              </div>
                            </td>
                            <td>
                              {getActionButton(booking)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{getModalTitle()}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{getModalBody()}</p>
          {selectedBooking && (
            <div className="mb-3">
              <strong>Thông tin đặt tour:</strong>
              <ul className="mt-2">
                <li>ID: {selectedBooking.id}</li>
                <li>Người dùng: {selectedBooking.user?.full_name}</li>
                <li>Tour: {selectedBooking.tour?.name || 'N/A'}</li>
                <li>Ngày đi: {formatDate(selectedBooking.start_date)}</li>
                <li>Ngày về: {formatDate(selectedBooking.end_date)}</li>
                <li>Số chỗ: {selectedBooking.spots}</li>
                <li>Tổng tiền: {formatPrice(selectedBooking.total_price)}</li>
              </ul>
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">
              Ghi chú {isNotesRequired() && <span className="text-danger">*</span>}
            </label>
            <textarea
              className="form-control"
              rows="3"
              placeholder={actionType === "reject" ? "Vui lòng nhập lý do từ chối..." : "Ghi chú (tùy chọn)..."}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              required={isNotesRequired()}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActionModal(false)}>
            Hủy
          </Button>
          <Button
            variant={
              actionType === "approve" ? "success" :
              actionType === "reject" ? "danger" : "secondary"
            }
            onClick={confirmAction}
            disabled={processing || (isNotesRequired() && !adminNotes.trim())}
          >
            {processing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Đang xử lý...
              </>
            ) : (
              actionType === "approve" ? "Phê duyệt" :
              actionType === "reject" ? "Từ chối" : "Hủy"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default BookingsAdmin; 