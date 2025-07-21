import React, { useEffect, useState, useContext } from "react";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext.jsx";
import CKEditorField from "../../components/CKEditorField";
import { Modal, Button } from "react-bootstrap";
import { Modal as RBModal } from "react-bootstrap";
import "../../css/AdminLayout.css";

function ArticlesAdmin() {
  const { user } = useContext(AuthContext);
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportActionStatus, setReportActionStatus] = useState(null);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnUserId, setWarnUserId] = useState(null);
  const [warnMessage, setWarnMessage] = useState("");
  const [warnStatus, setWarnStatus] = useState(null);

  useEffect(() => {
    fetchArticles();
    fetchReports();
  }, []);

  const fetchArticles = async () => {
    const res = await axios.get("https://walkingguide.onrender.com/api/articles");
    setArticles(res.data);
  };

  const fetchReports = async () => {
    try {
      console.log('Admin fetching reports with token:', user?.token);
      const res = await axios.get('https://walkingguide.onrender.com/api/article-reports', {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setReports(res.data);
    } catch (e) {
      setReports([]);
    }
  };

  const handleCreate = async () => {
    if (!user || !user.id) {
      setAlertMessage('Bạn cần đăng nhập để tạo bài viết.');
      setShowAlert(true);
      return;
    }
    let uploadedImageUrl = "";
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      // You need to have an endpoint to handle this upload, e.g. /api/upload
      const uploadRes = await axios.post(`${BASE_URL}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      uploadedImageUrl = uploadRes.data.url;
    }
    await axios.post(`${BASE_URL}/api/articles`, {
      title,
      content,
      image_url: uploadedImageUrl,
      admin_id: user.id,
    });
    fetchArticles();
    resetForm();
  };

  const handleEdit = (article) => {
    setEditId(article.article_id);
    setTitle(article.title);
    setContent(article.content);
    setEditImageUrl(article.image_url);
    setImageFile(null);
    
    // Scroll to top of the page to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async () => {
    let uploadedImageUrl = editImageUrl;
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await axios.post(`${BASE_URL}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      uploadedImageUrl = uploadRes.data.url;
    }
    await axios.put(`${BASE_URL}/api/articles/${editId}`, {
      title,
      content,
      image_url: uploadedImageUrl,
    });
    fetchArticles();
    setEditId(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    setArticleToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    
    try {
      await axios.delete(`https://walkingguide.onrender.com/api/articles/${articleToDelete}`);
      fetchArticles();
      setShowDeleteModal(false);
      setArticleToDelete(null);
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setArticleToDelete(null);
  };

  const handleReportStatus = async (reportId, status) => {
    try {
      console.log('Admin updating report with token:', user?.token, 'role:', user?.role);
      await axios.patch(`https://walkingguide.onrender.com/api/article-reports/${reportId}`, { status }, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setReportActionStatus('success');
      fetchReports();
    } catch (e) {
      setReportActionStatus('error');
    }
  };

  const handleDeleteReportedArticle = async (articleId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.')) return;
    try {
      await axios.delete(`https://walkingguide.onrender.com/api/articles/${articleId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      fetchArticles();
      fetchReports();
      setReportActionStatus('success');
    } catch (e) {
      setReportActionStatus('error');
    }
  };

  const handleWarnUser = (userId) => {
    setWarnUserId(userId);
    setWarnMessage("");
    setWarnStatus(null);
    setShowWarnModal(true);
  };

  const confirmWarnUser = async () => {
    if (!warnUserId) return;
    try {
      // Find the article being warned (from the current report context)
      const report = reports.find(r => articles.find(a => a.article_id === r.article_id && a.admin_id === warnUserId));
      const articleId = report ? report.article_id : null;
      await axios.post(`https://walkingguide.onrender.com/api/notifications`, {
        user_id: warnUserId,
        content: warnMessage || "Bài viết của bạn đã bị báo cáo. Vui lòng kiểm tra lại nội dung.",
        type: "warning",
        article_id: articleId,
      }, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setWarnStatus("success");
      setTimeout(() => setShowWarnModal(false), 1200);
    } catch (e) {
      setWarnStatus("error");
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImageFile(null);
    setEditImageUrl("");
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
              <div className="alert alert-warning alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-circle-fill me-2"></i>
                {alertMessage}
                <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
              </div>
            )}

            {/* Create/Edit Form */}
            <div className="card mb-4">
              <div className="card-header">
                <h5>{editId ? "Chỉnh sửa Bài viết" : "Tạo Bài viết Mới"}</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Tiêu đề *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài viết"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Nội dung</label>
                  <CKEditorField
                    value={content}
                    onChange={setContent}
                    placeholder="Nhập nội dung bài viết"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Hình ảnh</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setImageFile(e.target.files[0])}
                    className="form-control"
                  />
                  {editImageUrl && !imageFile && (
                    <div className="mt-2">
                      <img 
                        src={editImageUrl.startsWith('http') ? editImageUrl : `https://walkingguide.onrender.com${editImageUrl}`}
                        alt="Ảnh hiện tại" 
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

                <div className="d-flex gap-2">
                  {editId ? (
                    <>
                      <Button variant="primary" className="admin-main-btn" onClick={handleUpdate}>
                        Cập nhật Bài viết
                      </Button>
                      <Button variant="secondary" onClick={() => { setEditId(null); resetForm(); }}>
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" className="admin-main-btn" onClick={handleCreate}>
                      Tạo Bài viết
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Articles List */}
            <div className="card">
              <div className="card-header">
                <h5>Tất cả Bài viết</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tiêu đề</th>
                        <th>Nội dung</th>
                        <th>Hình ảnh</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((a) => (
                        <tr key={a.article_id}>
                          <td>{a.article_id}</td>
                          <td>{a.title}</td>
                          <td>
                            <div 
                              style={{ 
                                maxHeight: '60px', 
                                overflow: 'hidden',
                                fontSize: '0.9rem'
                              }}
                              dangerouslySetInnerHTML={{ __html: a.content ? (a.content.length > 60 ? a.content.substring(0, 60) + "..." : a.content) : "" }}
                            />
                          </td>
                          <td>
                            {a.image_url ? (
                              <img
                                src={a.image_url.startsWith('http') ? a.image_url : `${BASE_URL}${a.image_url}`}
                                alt="Ảnh bài viết"
                                style={{ 
                                  width: '80px', 
                                  height: '60px', 
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
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
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(a)}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(a.article_id)}
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

            {/* Article Reports Section */}
            <div className="card mt-5">
              <div className="card-header bg-danger text-white d-flex align-items-center" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
                <i className="bi bi-flag-fill me-2" style={{ fontSize: 22 }}></i>
                <h5 className="mb-0">Báo cáo bài viết</h5>
              </div>
              <div className="card-body bg-light" style={{ borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}>
                {reportActionStatus === 'success' && <div className="alert alert-success">Cập nhật trạng thái thành công!</div>}
                {reportActionStatus === 'error' && <div className="alert alert-danger">Có lỗi khi cập nhật trạng thái.</div>}
                {/* Card-style report display */}
                <div className="row mb-4 g-4">
                  {reports
                    .filter(report => report.status === 'pending')
                    .filter(report => articles.some(a => a.article_id === report.article_id))
                    .map(report => {
                      const article = articles.find(a => a.article_id === report.article_id);
                      return (
                        <div className="col-md-6 col-lg-4" key={report.id}>
                          <div className="card h-100 shadow border-0 report-card position-relative" style={{ borderRadius: '1rem', transition: 'box-shadow 0.2s', background: '#fff' }}>
                            <div className="card-body p-4">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-flag text-danger me-2" style={{ fontSize: 20 }}></i>
                                <h6 className="card-title mb-0">Báo cáo #{report.id}</h6>
                                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.95em' }}>{report.status}</span>
                              </div>
                              <div className="mb-2">
                                <b>Bài viết:</b> <a href={`/articles/${report.article_id}`} target="_blank" rel="noopener noreferrer" className="text-decoration-underline fw-semibold">{article?.title || 'Không tìm thấy'}</a>
                              </div>
                              <div className="mb-2"><b>Người báo cáo:</b> <span className="badge bg-secondary">User #{report.user_id}</span></div>
                              <div className="mb-2"><b>Loại báo cáo:</b> <span className="badge bg-info text-dark text-capitalize">{report.type || 'Không rõ'}</span></div>
                              <div className="mb-2"><b>Lý do:</b> <span className="fst-italic">{report.reason}</span></div>
                              <div className="mb-2"><b>Ngày tạo:</b> {new Date(report.created_at).toLocaleString()}</div>
                              <div className="d-flex gap-2 mt-3 flex-wrap">
                                <button className="btn btn-success btn-sm px-3" onClick={() => handleReportStatus(report.id, 'resolved')} title="Đánh dấu đã xử lý">
                                  <i className="bi bi-check-circle me-1"></i>Đã xử lý
                                </button>
                                <button className="btn btn-secondary btn-sm px-3" onClick={() => handleReportStatus(report.id, 'dismissed')} title="Bỏ qua báo cáo">
                                  <i className="bi bi-x-circle me-1"></i>Bỏ qua
                                </button>
                                <button className="btn btn-danger btn-sm px-3" onClick={() => handleDeleteReportedArticle(report.article_id)} title="Xóa bài viết này">
                                  <i className="bi bi-trash me-1"></i>Xóa bài viết
                                </button>
                                {article?.admin_id && (
                                  <button className="btn btn-warning btn-sm px-3 text-white" style={{ background: '#ffc107', border: 'none' }} onClick={() => handleWarnUser(article.admin_id)} title="Cảnh báo tác giả">
                                    <i className="bi bi-exclamation-triangle me-1"></i>Cảnh báo tác giả
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {reports.filter(report => report.status === 'pending').filter(report => articles.some(a => a.article_id === report.article_id)).length === 0 && (
                    <div className="col-12 text-center text-muted">Không có báo cáo nào.</div>
                  )}
                </div>
                {/* Table-style report display (existing) */}
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Bài viết</th>
                        <th>Người báo cáo</th>
                        <th>Lý do</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports
                        .filter(report => report.status === 'pending')
                        .filter(report => articles.some(a => a.article_id === report.article_id))
                        .length === 0 && (
                        <tr><td colSpan="7" className="text-center">Không có báo cáo nào.</td></tr>
                      )}
                      {reports
                        .filter(report => report.status === 'pending')
                        .filter(report => articles.some(a => a.article_id === report.article_id))
                        .map(report => (
                        <tr key={report.id}>
                          <td>{report.id}</td>
                          <td>
                            <a href={`/articles/${report.article_id}`} target="_blank" rel="noopener noreferrer">Xem bài viết</a>
                          </td>
                          <td>{report.user_id}</td>
                          <td>{report.reason}</td>
                          <td>{report.status}</td>
                          <td>{new Date(report.created_at).toLocaleString()}</td>
                          <td>
                            <button className="btn btn-success btn-sm me-2" onClick={() => handleReportStatus(report.id, 'resolved')}>Đã xử lý</button>
                            <button className="btn btn-secondary btn-sm me-2" onClick={() => handleReportStatus(report.id, 'dismissed')}>Bỏ qua</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReportedArticle(report.article_id)}>Xóa bài viết</button>
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
          Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
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

      {/* Warn User Modal */}
      <RBModal show={showWarnModal} onHide={() => setShowWarnModal(false)} centered>
        <RBModal.Header closeButton>
          <RBModal.Title>Gửi cảnh báo tới tác giả</RBModal.Title>
        </RBModal.Header>
        <RBModal.Body>
          {warnStatus === 'success' && <div className="alert alert-success">Đã gửi cảnh báo thành công!</div>}
          {warnStatus === 'error' && <div className="alert alert-danger">Có lỗi khi gửi cảnh báo.</div>}
          <div className="mb-3">
            <label className="form-label">Nội dung cảnh báo</label>
            <textarea
              className="form-control"
              value={warnMessage}
              onChange={e => setWarnMessage(e.target.value)}
              placeholder="Nhập nội dung cảnh báo gửi tới tác giả..."
              rows={3}
            />
          </div>
        </RBModal.Body>
        <RBModal.Footer>
          <Button variant="secondary" onClick={() => setShowWarnModal(false)}>
            Hủy
          </Button>
          <Button variant="warning" className="text-white" onClick={confirmWarnUser}>
            Gửi cảnh báo
          </Button>
        </RBModal.Footer>
      </RBModal>
    </div>
  );
}

export default ArticlesAdmin;
