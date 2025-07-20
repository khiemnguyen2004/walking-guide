import React, { useEffect, useState } from "react";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import "../../css/AdminLayout.css";

function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [role, setRole] = useState("USER");
  const [password, setPassword] = useState("");
  const [editId, setEditId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('danger');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get("http://localhost:3000/api/users");
    setUsers(res.data);
  };

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
    
    const response = await axios.post('http://localhost:3000/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url;
  };

  const handleCreate = async () => {
    setIsUploading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      await axios.post("http://localhost:3000/api/users", {
        full_name: fullName,
        email,
        image_url: imageUrl,
        password, // required
        role,
      });
      fetchUsers();
      resetForm();
    } catch (error) {
      console.error('Error creating user:', error);
      setAlertMessage('Có lỗi xảy ra khi tạo người dùng');
      setAlertType('danger');
      setShowAlert(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (user) => {
    setEditId(user.id);
    setFullName(user.full_name);
    setEmail(user.email);
    setImageFile(null);
    setImagePreview(user.image_url || "");
    setRole(user.role);
    setPassword(user.password_hash);
    
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

      await axios.put(`http://localhost:3000/api/users/${editId}`, {
        full_name: fullName,
        email,
        image_url: imageUrl,
        password_hash: password || undefined,
        role,
      });
      fetchUsers();
      setEditId(null);
      resetForm();
    } catch (error) {
      console.error('Error updating user:', error);
      setAlertMessage('Có lỗi xảy ra khi cập nhật người dùng');
      setAlertType('danger');
      setShowAlert(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/users/${userToDelete}`);
      fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setAlertMessage('Có lỗi xảy ra khi xóa người dùng');
      setAlertType('danger');
      setShowAlert(true);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const resetForm = () => {
    setEditId(null);
    setFullName("");
    setEmail("");
    setImageFile(null);
    setImagePreview("");
    setPassword("");
    setRole("USER");
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
                <h5>{editId ? "Chỉnh sửa Người dùng" : "Tạo Người dùng Mới"}</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Họ và tên *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Mật khẩu {!editId && '*'}</label>
                      <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={editId ? "Để trống nếu không thay đổi" : "Nhập mật khẩu"}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Vai trò</label>
                      <select
                        className="form-control"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option value="USER">Người dùng</option>
                        <option value="ADMIN">Quản trị viên</option>
                        <option value="MODERATOR">Điều hành viên</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Hình ảnh</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="form-control"
                      />
                      {imagePreview && (
                        <div className="mt-2">
                          <img 
                            src={imagePreview.startsWith('data:') ? imagePreview : `http://localhost:3000${imagePreview}`} 
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
                </div>

                <div className="d-flex gap-2">
                  {editId ? (
                    <>
                      <Button variant="primary" className="admin-main-btn" onClick={handleUpdate} disabled={isUploading}>
                        {isUploading ? "Đang cập nhật..." : "Cập nhật Người dùng"}
                      </Button>
                      <Button variant="secondary" onClick={resetForm} disabled={isUploading}>
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" className="admin-main-btn" onClick={handleCreate} disabled={isUploading}>
                      {isUploading ? "Đang tạo..." : "Tạo Người dùng"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="card">
              <div className="card-header">
                <h5>Tất cả Người dùng</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Hình ảnh</th>
                        <th>Họ và tên</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>
                            {user.image_url ? (
                              <img
                                src={`http://localhost:3000${user.image_url}`}
                                alt={user.full_name}
                                style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "50%" }}
                              />
                            ) : (
                              <div 
                                style={{ 
                                  width: "50px", 
                                  height: "50px", 
                                  backgroundColor: "#e9ecef",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#6c757d",
                                  borderRadius: "50%"
                                }}
                              >
                                <i className="bi bi-person"></i>
                              </div>
                            )}
                          </td>
                          <td>{user.full_name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : user.role === 'MODERATOR' ? 'bg-warning' : 'bg-primary'}`}>
                              {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'MODERATOR' ? 'Điều hành viên' : 'Người dùng'}
                            </span>
                          </td>
                          <td>{user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(user)}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(user.id)}
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
          Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.
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

export default UsersAdmin;
