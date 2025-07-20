import React, { useEffect, useState } from "react";
import AdminHeader from "../../components/AdminHeader.jsx";
import AdminSidebar from "../../components/AdminSidebar.jsx";
import { getTags, createTag, updateTag, deleteTag } from "../../api/tagApi";

function TagsAdmin() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const res = await getTags();
    setTags(res.data);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createTag({ name });
    setName("");
    fetchTags();
  };

  const handleEdit = (tag) => {
    setEditId(tag.id);
    setName(tag.name);
    
    // Scroll to top of the page to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async () => {
    if (!name.trim()) return;
    await updateTag(editId, { name });
    setEditId(null);
    setName("");
    fetchTags();
  };

  const handleDelete = async (id) => {
    setTagToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;
    
    try {
      await deleteTag(tagToDelete);
      fetchTags();
      setShowDeleteModal(false);
      setTagToDelete(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTagToDelete(null);
  };

  return (
    <div className="min-vh-100 d-flex flex-row" style={{ background: "#f6f8fa" }}>
      <AdminSidebar alwaysExpanded />
      <div className="flex-grow-1 d-flex flex-column admin-dashboard" style={{ marginLeft: 220, minHeight: "100vh", padding: 0, background: "#f6f8fa" }}>
        <AdminHeader />
        <main className="flex-grow-1" style={{ padding: 0, maxWidth: "100%", width: "100%", margin: 0 }}>
          <div className="admin-dashboard-cards-row">
            <div className="container py-4">
              <div className="mb-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control mb-2"
                  placeholder="Tên thẻ"
                />
                {editId ? (
                  <>
                    <button onClick={handleUpdate} className="btn admin-main-btn me-2">Cập nhật</button>
                    <button onClick={() => { setEditId(null); setName(""); }} className="btn admin-btn-secondary">Hủy</button>
                  </>
                ) : (
                  <button onClick={handleCreate} className="btn admin-main-btn">Thêm</button>
                )}
              </div>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên thẻ</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr key={tag.id}>
                      <td>{tag.id}</td>
                      <td>{tag.name}</td>
                      <td>
                        <button className="btn admin-main-btn btn-sm me-2" onClick={() => handleEdit(tag)}>Sửa</button>
                        <button className="btn admin-btn-danger btn-sm" onClick={() => handleDelete(tag.id)}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <div className={`modal fade ${showDeleteModal ? 'show' : ''}`} 
           style={{ display: showDeleteModal ? 'block' : 'none' }} 
           tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Xác nhận xóa
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={cancelDelete}></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">Bạn có chắc muốn xóa thẻ này? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cancelDelete}>
                <i className="bi bi-x-circle me-1"></i>
                Hủy
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                <i className="bi bi-trash me-1"></i>
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
      {showDeleteModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default TagsAdmin;
