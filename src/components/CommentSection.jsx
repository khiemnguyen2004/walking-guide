import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext.jsx';

const CommentSection = ({ placeId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await axiosClient.get(`comments/place/${placeId}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    if (placeId) fetchComments();
    // eslint-disable-next-line
  }, [placeId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) return alert('Bạn cần đăng nhập để bình luận!');
    if (!content.trim()) return;
    setLoading(true);
    try {
      await axiosClient.post('comments', { place_id: placeId, user_id: user.id, content });
      setContent('');
      fetchComments();
    } catch {
      alert('Có lỗi khi gửi bình luận.');
    }
    setLoading(false);
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Xóa bình luận này?')) return;
    setLoading(true);
    try {
      await axiosClient.delete(`comments/${commentId}`);
      fetchComments();
    } catch {
      alert('Không thể xóa bình luận.');
    }
    setLoading(false);
  };

  return (
    <div className="comment-section mt-3">
      <h6 className="fw-bold mb-2" style={{ color: '#3498db' }}>Bình luận</h6>
      <form onSubmit={handleAdd} className="mb-2 d-flex gap-2">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Viết bình luận..."
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={loading}
          style={{ borderRadius: 16, border: '1px solid #b6e0fe' }}
        />
        <button className="btn btn-primary btn-sm px-3" type="submit" disabled={loading || !content.trim()} style={{ borderRadius: 16 }}>
          Gửi
        </button>
      </form>
      <div className="comments-list">
        {(!Array.isArray(comments) || comments.length === 0) && <div className="text-muted">Chưa có bình luận.</div>}
        {Array.isArray(comments) && comments.map(c => (
          <div key={c.comment_id || c.id} className="border rounded p-2 mb-2 bg-light d-flex justify-content-between align-items-center shadow-sm" style={{ borderRadius: 14 }}>
            <div>
              <span className="fw-bold" style={{ color: '#1a2a47' }}>{c.user_full_name || `Người dùng #${c.comment_user_id || c.user_id}`}:</span> {c.comment_content || c.content}
            </div>
            {user && (user.id === c.comment_user_id || user.id === c.user_id) && (
              <button className="btn btn-link text-danger btn-sm text-decoration-none" onClick={() => handleDelete(c.comment_id || c.id)}>
                Xóa
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection; 