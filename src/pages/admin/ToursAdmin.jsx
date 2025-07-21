import React, { useEffect, useState, useContext, useCallback } from "react";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext.jsx";
import CKEditorField from "../../components/CKEditorField";
import placeApi from "../../api/placeApi";
import tourStepApi from "../../api/tourStepApi";
import { Modal, Button } from "react-bootstrap";
import "../../css/AdminLayout.css";

function ToursAdmin() {
  const { user } = useContext(AuthContext);
  const [tours, setTours] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editId, setEditId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [allPlaces, setAllPlaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [tourStepsMap, setTourStepsMap] = useState({});
  const [selectedSteps, setSelectedSteps] = useState({});
  const [totalCost, setTotalCost] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('danger');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tourToDelete, setTourToDelete] = useState(null);
  const [pendingTours, setPendingTours] = useState([]);

  const fetchTours = async () => {
    const res = await axios.get(`${BASE_URL}/api/tours?role=ADMIN`);
    setTours(res.data);
    // Fetch steps for all tours
    const stepsMap = {};
    await Promise.all(
      res.data.map(async (tour) => {
        try {
          const stepsRes = await tourStepApi.getByTourId(tour.id);
          stepsMap[tour.id] = stepsRes.data;
        } catch {
          stepsMap[tour.id] = [];
        }
      })
    );
    setTourStepsMap(stepsMap);
  };

  const fetchPendingTours = useCallback(async () => {
    const res = await axios.get(`${BASE_URL}/api/tours/pending/user`);
    setPendingTours(res.data);
  }, []);

  useEffect(() => {
    fetchTours();
    fetchPendingTours();
    placeApi.getAll().then(res => setAllPlaces(res.data)).catch(() => setAllPlaces([]));
  }, [fetchPendingTours]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${BASE_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url;
  };

  const handleAddPlace = (placeId) => {
    if (!selectedPlaces.includes(placeId)) {
      setSelectedPlaces([...selectedPlaces, placeId]);
      setSelectedSteps(prev => ({
        ...prev,
        [placeId]: { day: 1, stay_duration: 60, start_time: '', end_time: '' }
      }));
    }
  };

  const handleRemovePlace = (placeId) => {
    setSelectedPlaces(selectedPlaces.filter(id => id !== placeId));
    setSelectedSteps(prev => {
      const copy = { ...prev };
      delete copy[placeId];
      return copy;
    });
  };

  const handleStepChange = (placeId, field, value) => {
    setSelectedSteps(prev => ({
      ...prev,
      [placeId]: { ...prev[placeId], [field]: value }
    }));
  };

  const handleMovePlace = (index, direction) => {
    const newArr = [...selectedPlaces];
    const target = newArr[index];
    newArr.splice(index, 1);
    newArr.splice(index + direction, 0, target);
    setSelectedPlaces(newArr);
  };

  const handleCreate = async () => {
    if (!user) {
      setAlertMessage('Bạn cần đăng nhập để tạo tour.');
      setAlertType('warning');
      setShowAlert(true);
      return;
    }
    setIsUploading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const steps = selectedPlaces.map((placeId, idx) => ({
        place_id: placeId,
        step_order: idx + 1,
        day: selectedSteps[placeId]?.day || 1,
        stay_duration: Number(selectedSteps[placeId]?.stay_duration) || 60,
      }));
      await axios.post("https://walkingguide.onrender.com/api/tours", {
        name,
        description,
        image_url: imageUrl,
        user_id: user.id,
        total_cost: parseFloat(totalCost) || 0,
        steps,
      });
      fetchTours();
      resetForm();
    } catch (error) {
      console.error("Error creating tour:", error);
      setAlertMessage('Có lỗi xảy ra khi tạo tour');
      setAlertType('danger');
      setShowAlert(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (tour) => {
    setEditId(tour.id);
    setName(tour.name);
    setDescription(tour.description);
    setImageFile(null);
    setImagePreview(tour.image_url || "");
    setTotalCost(tour.total_cost ? tour.total_cost.toString() : "0");
    // Load current stops for editing
    const steps = tourStepsMap[tour.id] || [];
    setSelectedPlaces(steps.sort((a, b) => a.step_order - b.step_order).map(s => s.place_id));
    const stepsObj = {};
    steps.forEach(s => {
      stepsObj[s.place_id] = {
        day: s.day || 1,
        stay_duration: s.stay_duration || 60,
      };
    });
    setSelectedSteps(stepsObj);
    // Scroll to top of the page to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async () => {
    setIsUploading(true);
    try {
      let imageUrl = imagePreview;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      // Send updated steps
      const steps = selectedPlaces.map((placeId, idx) => ({
        place_id: placeId,
        step_order: idx + 1,
        day: selectedSteps[placeId]?.day || 1,
        stay_duration: Number(selectedSteps[placeId]?.stay_duration) || 60,
      }));
      await axios.put(`https://walkingguide.onrender.com/api/tours/${editId}`, {
        name,
        description,
        image_url: imageUrl,
        total_cost: parseFloat(totalCost) || 0,
        steps,
      });
      fetchTours();
      setEditId(null);
      resetForm();
    } catch (error) {
      console.error("Error updating tour:", error);
      setAlertMessage('Có lỗi xảy ra khi cập nhật tour');
      setAlertType('danger');
      setShowAlert(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id) => {
    setTourToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!tourToDelete) return;
    
    try {
      await axios.delete(`https://walkingguide.onrender.com/api/tours/${tourToDelete}`);
      fetchTours();
      setShowDeleteModal(false);
      setTourToDelete(null);
    } catch (error) {
      console.error('Error deleting tour:', error);
      setAlertMessage('Có lỗi xảy ra khi xóa tour');
      setAlertType('danger');
      setShowAlert(true);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTourToDelete(null);
  };

  const handleApprove = async (id) => {
    await axios.post(`https://walkingguide.onrender.com/api/tours/${id}/approve`);
    fetchPendingTours();
    fetchTours();
  };
  const handleReject = async (id) => {
    await axios.post(`https://walkingguide.onrender.com/api/tours/${id}/reject`);
    fetchPendingTours();
    fetchTours();
  };

  const resetForm = () => {
    setEditId(null);
    setName("");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
    setSelectedPlaces([]);
    setSelectedSteps({});
    setTotalCost(0);
    setStartTime("");
    setEndTime("");
  };

  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="container-fluid">
            {/* Alert Component */}
            {showAlert && (
              <div className={`alert alert-${alertType} alert-dismissible fade show`} role="alert">
                <i className={`bi ${alertType === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-exclamation-circle-fill'} me-2`}></i>
                {alertMessage}
                <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
              </div>
            )}

            {/* Create/Edit Form */}
            <div className="card mb-4">
              <div className="card-header">
                <h5>{editId ? "Chỉnh sửa Tour" : "Tạo Tour Mới"}</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tên tour *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập tên tour"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Hình ảnh tour</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="form-control"
                      />
                      {imagePreview && (
                        <div className="mt-2">
                          <img 
                            src={imagePreview.startsWith('data:') ? imagePreview : `https://walkingguide.onrender.com${imagePreview}`} 
                            alt="Xem trước" 
                            style={{ 
                              maxWidth: '200px', 
                              maxHeight: '150px', 
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #ddd'
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tổng chi phí (VND)</label>
                      <input
                        type="text"
                        value={totalCost ? parseInt(totalCost).toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '');
                          setTotalCost(rawValue);
                        }}
                        className="form-control"
                        placeholder="Nhập tổng chi phí tour"
                      />
                      {totalCost && (
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Chi phí: {parseInt(totalCost).toLocaleString('vi-VN')} VNĐ
                        </div>
                      )}
                      
                      {/* Price Suggestions */}
                      {totalCost && totalCost.length > 0 && totalCost.length <= 3 && !totalCost.endsWith('000') && (
                        <div className="mt-2">
                          <small className="text-muted">Gợi ý:</small>
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {(() => {
                              const inputNum = totalCost.replace(/\D/g, '');
                              const suggestions = [
                                { value: inputNum + '000', label: inputNum + '.000 VNĐ' },
                                { value: inputNum + '0000', label: inputNum + '0.000 VNĐ' },
                                { value: inputNum + '00000', label: inputNum + '00.000 VNĐ' },
                                { value: inputNum + '000000', label: inputNum + '.000.000 VNĐ' },
                                { value: inputNum + '0000000', label: inputNum + '0.000.000 VNĐ' },
                              ].filter(s => s.value !== totalCost);
                              
                              return suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                  onClick={() => setTotalCost(suggestion.value)}
                                >
                                  {suggestion.label}
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Mô tả</label>
                  <CKEditorField
                    value={description}
                    onChange={setDescription}
                    placeholder="Mô tả tour"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Chọn các địa điểm cho tour (kéo để sắp xếp):</label>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {allPlaces.map(place => (
                      <button
                        key={place.id}
                        type="button"
                        className={`btn btn-sm ${selectedPlaces.includes(place.id) ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handleAddPlace(place.id)}
                        disabled={selectedPlaces.includes(place.id)}
                      >
                        {place.name}
                      </button>
                    ))}
                  </div>
                  {selectedPlaces.length > 0 && (
                    <ul className="list-group">
                      {selectedPlaces.map((placeId, idx) => {
                        const place = allPlaces.find(p => p.id === placeId);
                        const step = selectedSteps[placeId] || {};
                        return (
                          <li key={placeId} className="list-group-item d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <span>{place ? place.name : placeId}</span>
                            <select
                              className="form-select form-select-sm"
                              style={{ width: 90 }}
                              value={step.day || 1}
                              onChange={e => handleStepChange(placeId, 'day', Number(e.target.value))}
                            >
                              {[...Array(15)].map((_, i) => (
                                <option key={i+1} value={i+1}>Ngày {i+1}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: 70 }}
                              min={1}
                              value={step.stay_duration || 60}
                              onChange={e => handleStepChange(placeId, 'stay_duration', e.target.value)}
                              placeholder="Phút"
                              title="Thời gian lưu trú (phút)"
                            />
                            <div>
                              <button type="button" className="btn btn-sm btn-light me-1" disabled={idx === 0} onClick={() => handleMovePlace(idx, -1)}><i className="bi bi-arrow-up" /></button>
                              <button type="button" className="btn btn-sm btn-light me-1" disabled={idx === selectedPlaces.length - 1} onClick={() => handleMovePlace(idx, 1)}><i className="bi bi-arrow-down" /></button>
                              <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemovePlace(placeId)}><i className="bi bi-x" /></button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                
                <div className="d-flex gap-2">
                  {editId ? (
                    <>
                      <Button variant="primary" className="admin-main-btn" onClick={handleUpdate} disabled={isUploading}>
                        {isUploading ? "Đang cập nhật..." : "Cập nhật Tour"}
                      </Button>
                      <Button variant="secondary" onClick={resetForm} disabled={isUploading}>
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" className="admin-main-btn" onClick={handleCreate} disabled={isUploading}>
                      {isUploading ? "Đang tạo..." : "Tạo Tour"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Approval Tours */}
            <div className="card mb-4">
              <div className="card-header bg-warning text-dark">
                <h5>Tour do người dùng tạo chờ duyệt</h5>
              </div>
              <div className="card-body">
                {pendingTours.length === 0 ? (
                  <div className="text-muted">Không có tour nào chờ duyệt.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Tên tour</th>
                          <th>Người tạo</th>
                          <th>Mô tả</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingTours.map((t) => (
                          <tr key={t.id}>
                            <td>{t.id}</td>
                            <td>{t.name}</td>
                            <td>{t.user_id}</td>
                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                            <td>
                              <button className="btn btn-success btn-sm me-2" onClick={() => handleApprove(t.id)}>Duyệt</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleReject(t.id)}>Từ chối</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Tours List */}
            <div className="card">
              <div className="card-header">
                <h5>Tất cả Tour</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Hình ảnh</th>
                        <th>Tên tour</th>
                        <th>Mô tả</th>
                        <th>Địa điểm (thứ tự)</th>
                        <th>Tổng chi phí</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tours.map((t) => (
                        <tr key={t.id}>
                          <td>{t.id}</td>
                          <td>
                            {t.image_url ? (
                              <img 
                                src={`https://walkingguide.onrender.com${t.image_url}`} 
                                alt={t.name}
                                style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                            ) : (
                              <div 
                                style={{ 
                                  width: '80px', 
                                  height: '60px', 
                                  backgroundColor: '#e9ecef',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#6c757d',
                                  borderRadius: '4px'
                                }}
                              >
                                <i className="bi bi-image"></i>
                              </div>
                            )}
                          </td>
                          <td>{t.name}</td>
                          <td>
                            <div 
                              style={{ 
                                maxHeight: '60px', 
                                overflow: 'hidden',
                                fontSize: '0.9rem'
                              }}
                              dangerouslySetInnerHTML={{ __html: t.description }}
                            />
                          </td>
                          <td>
                            {tourStepsMap[t.id] && tourStepsMap[t.id].length > 0 ? (
                              <div style={{ maxHeight: '60px', overflow: 'hidden', fontSize: '0.8rem' }}>
                                {tourStepsMap[t.id]
                                  .sort((a, b) => a.step_order - b.step_order)
                                  .map((step, index) => {
                                    const place = allPlaces.find(p => p.id === step.place_id);
                                    return (
                                      <div key={step.id} style={{ marginBottom: '2px' }}>
                                        <span className="badge bg-primary me-1">Ngày {step.day}</span>
                                        <span>{place ? place.name : `Place ${step.place_id}`}</span>
                                        {index < tourStepsMap[t.id].length - 1 && <i className="bi bi-arrow-right ms-1" style={{ fontSize: '0.7rem' }}></i>}
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : (
                              <span className="text-muted">Chưa có địa điểm</span>
                            )}
                          </td>
                          <td>
                            {t.total_cost ? (
                              <span className="fw-semibold text-success">
                                {t.total_cost.toLocaleString('vi-VN')} VND
                              </span>
                            ) : (
                              <span className="text-muted">Chưa có</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(t)}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(t.id)}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={cancelDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa tour này? Hành động này không thể hoàn tác.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            Hủy
          </Button>
          <Button variant="danger" className="admin-btn-danger" onClick={confirmDelete}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ToursAdmin;
