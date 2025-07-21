import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import Header from '../../components/Header.jsx';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import userApi from '../../api/userApi';
import articleApi from '../../api/articleApi';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import ReportArticleModal from '../../components/ReportArticleModal';

const highlightStyle = `
  .highlight-comment {
    background:rgb(117, 189, 249) !important;
    animation: highlight-comment 0.5s ease-in-out;
  }
`;

const ArticleDetail = () => {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [newestArticles, setNewestArticles] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [userMap, setUserMap] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const location = useLocation();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (!id || isNaN(id)) {
      setError('ID bài viết không hợp lệ');
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      try {
        const apiUrl = `${BASE_URL}/api/articles/${id}`; // Cập nhật URL
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Lỗi ${response.status}: ${errorText || response.statusText}`);
        }

        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await response.text();
          throw new Error(`Response không phải JSON: ${errorText.slice(0, 100)}...`);
        }

        const data = await response.json();
        setArticle(data);
        // Fetch admin info after article is loaded
        fetchAdmin(data.admin_id);
        setLoading(false);
      } catch (err) {
        setError(`Lỗi khi gọi API: ${err.message}`);
        setLoading(false);
      }
    };

    const fetchAdmin = async (adminId) => {
      try {
        const res = await userApi.getAll();
        const found = res.data.find(u => u.id === adminId || u.id === Number(adminId));
        setAdmin(found);
      } catch (e) {
        setAdmin(null);
      }
    };

    fetchArticle();
    // Fetch newest articles (excluding current)
    const fetchNewest = async () => {
      try {
        const res = await articleApi.getAll();
        let articles = res.data || [];
        articles = articles.filter(a => a.article_id !== Number(id));
        articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        setNewestArticles(articles);
      } catch (e) {
        setNewestArticles([]);
      }
    };
    fetchNewest();

    // Fetch likes and comments
    if (!id) return;
    // Fetch like count
    fetch(`${BASE_URL}/api/article-likes/${id}/likes`)
      .then(res => res.json())
      .then(data => setLikeCount(data.count || 0));
    // Fetch liked status
    if (user) {
      fetch(`${BASE_URL}/api/article-likes/is-liked?article_id=${id}&user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setLiked(!!data.liked));
    } else {
      setLiked(false);
    }
    // Fetch comments
    fetch(`${BASE_URL}/api/article-comments/${id}`)
      .then(res => res.json())
      .then(data => setComments(Array.isArray(data) ? data : []));
    // Fetch all users for comment display
    userApi.getAll().then(res => {
      const map = {};
      (res.data || []).forEach(u => { map[u.id] = u.full_name || `User #${u.id}`; });
      setUserMap(map);
    });
  }, [id, user]);

  useEffect(() => {
    if (location.hash.startsWith('#comment-') && comments.length > 0) {
      const commentId = location.hash.replace('#comment-', '');
      const el = document.getElementById(`comment-${commentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-comment');
        setTimeout(() => el.classList.remove('highlight-comment'), 2000);
      }
    }
  }, [location, comments]); // depend on comments

  // Like/unlike handlers
  const handleLike = async () => {
    if (!user) return;
    const url = liked ? 'unlike' : 'like';
    await fetch(`${BASE_URL}/api/article-likes/${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: id, user_id: user.id })
    });
    setLiked(!liked);
    setLikeCount(likeCount + (liked ? -1 : 1));
  };

  // Add comment handler
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setCommentLoading(true);
    setCommentError("");
    try {
      const res = await fetch(`${BASE_URL}/api/article-comments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: id, user_id: user.id, content: commentText })
      });
      if (!res.ok) throw new Error('Lỗi khi gửi bình luận');
      setCommentText("");
      // Refresh comments
      fetch(`${BASE_URL}/api/article-comments/${id}`)
        .then(res => res.json())
        .then(data => setComments(Array.isArray(data) ? data : []));
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  // Edit comment handler
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };
  const handleSaveEdit = async (comment) => {
    if (!editingCommentText.trim()) return;
    setCommentLoading(true);
    setCommentError("");
    try {
      const res = await fetch(`${BASE_URL}/api/article-comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingCommentText, user_id: user.id })
      });
      if (!res.ok) throw new Error('Lỗi khi sửa bình luận');
      setEditingCommentId(null);
      setEditingCommentText("");
      // Refresh comments
      fetch(`${BASE_URL}/api/article-comments/${id}`)
        .then(res => res.json())
        .then(data => setComments(Array.isArray(data) ? data : []));
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };
  // Delete comment handler
  const handleDeleteComment = async (comment) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    setCommentLoading(true);
    setCommentError("");
    try {
      const res = await fetch(`${BASE_URL}/api/article-comments/${comment.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      if (!res.ok) throw new Error('Lỗi khi xóa bình luận');
      // Refresh comments
      fetch(`${BASE_URL}/api/article-comments/${id}`)
        .then(res => res.json())
        .then(data => setComments(Array.isArray(data) ? data : []));
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  // Helper to chunk array into groups of 3
  function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  return (
    <div className="min-vh-100 d-flex flex-column luxury-home-container">
      <Header />
      <main className="flex-grow-1">
        <div className="container mx-auto p-4 max-w-3xl">
          <div style={{ background: 'rgba(245, 250, 255, 0.95)', borderRadius: '1.5rem', boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.10)', padding: '2.5rem 2rem', margin: '2rem 0' }}>
            {article && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ margin: 0 }}>{article.title}</h2>
                {user && (
                  <button onClick={() => setReportOpen(true)} className="btn btn-outline-danger btn-sm">Báo cáo</button>
                )}
              </div>
            )}
            {article.published_at && (
              <div className="text-center text-muted mb-2" style={{fontSize: '1rem'}}>
                Đăng ngày: {new Date(article.published_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {article.image_url && (
              <div className="d-flex justify-content-center mb-4">
                <img
                  src={article.image_url.startsWith('http') ? article.image_url : `${BASE_URL}${article.image_url}`}
                  alt={article.title}
                  style={{ maxWidth: '420px', maxHeight: '260px', width: '100%', objectFit: 'cover', borderRadius: '1rem', boxShadow: '0 2px 12px #b6e0fe55' }}
                />
              </div>
            )}
            <div className="text-gray-600 mb-4 d-flex flex-wrap gap-4 justify-content-center align-items-center" style={{ fontSize: '1.05rem' }}>
              <span className="d-flex align-items-center gap-2">
                Người đăng: <b>{admin ? admin.full_name : 'Admin'}</b>
              </span>
              {/* Like button */}
              <span className="d-flex align-items-center gap-2 ms-3">
                <button
                  className={`btn btn-sm ${liked ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={handleLike}
                  disabled={!user}
                  title={user ? (liked ? 'Bỏ thích' : 'Thích bài viết') : 'Đăng nhập để thích'}
                  style={{ minWidth: 40 }}
                >
                  <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                  <span className="ms-1">{likeCount}</span>
                </button>
              </span>
            </div>
            <div className="prose prose-lg mb-4" style={{ color: '#223a5f', fontSize: '1.15rem', lineHeight: 1.7 }}>
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>
            {/* Comments Section */}
            <div className="mt-5">
              <h4 className="fw-bold mb-3">Bình luận ({comments.length})</h4>
              {user ? (
                <form className="mb-3 d-flex gap-2" onSubmit={handleAddComment}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Viết bình luận..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    disabled={commentLoading}
                  />
                  <button className="btn btn-main" type="submit" disabled={commentLoading || !commentText.trim()}>
                    {commentLoading ? <i className="bi bi-send fa-spin"></i> : <i className="bi bi-send"></i>}
                  </button>
                </form>
              ) : (
                <div className="alert alert-warning">Bạn cần đăng nhập để bình luận.</div>
              )}
              {commentError && <div className="alert alert-danger">{commentError}</div>}
              <div className="comments-list">
                {comments.length === 0 ? (
                  <div className="text-muted">Chưa có bình luận nào.</div>
                ) : (
                  comments.map((c, idx) => (
                    <div key={c.id || idx} id={`comment-${c.id}`} className="mb-3 p-2 bg-light rounded">
                      <b>{c.user_id && userMap[c.user_id] ? userMap[c.user_id] : 'Ẩn danh'}:</b>{' '}
                      {editingCommentId === c.id ? (
                        <>
                          <input
                            type="text"
                            className="form-control d-inline-block w-auto"
                            value={editingCommentText}
                            onChange={e => setEditingCommentText(e.target.value)}
                            disabled={commentLoading}
                            style={{ maxWidth: 300, marginRight: 8 }}
                          />
                          <button className="btn btn-success btn-sm me-1" onClick={() => handleSaveEdit(c)} disabled={commentLoading || !editingCommentText.trim()}>
                            Lưu
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit} disabled={commentLoading}>
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          {c.content}
                          {user && c.user_id === user.id && (
                            <>
                              <button className="btn btn-link btn-sm text-primary ms-2 text-decoration-none" onClick={() => handleEditComment(c)} disabled={commentLoading}>
                                Sửa
                              </button>
                              <button className="btn btn-link btn-sm text-danger text-decoration-none" onClick={() => handleDeleteComment(c)} disabled={commentLoading}>
                                Xóa
                              </button>
                            </>
                          )}
                        </>
                      )}
                      <div className="text-muted small">{c.created_at ? new Date(c.created_at).toLocaleString('vi-VN') : ''}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="d-flex justify-content-center">
              <button
                onClick={() => navigate(-1)}
                className="mt-6 btn btn-main"
                style={{ minWidth: 140 }}
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </main>
      {/* Newest Articles Carousel */}
      <div className="container my-5">
        <h2 className="h4 mb-4 fw-bold luxury-section-title">Bài viết khác</h2>
        {newestArticles.length === 0 ? (
          <p className="text-muted text-center">Không có bài viết nào để hiển thị.</p>
        ) : (
          <div id="articlesCarousel" className="carousel slide" data-bs-ride="carousel">
            <div className="carousel-inner">
              {chunkArray(newestArticles, 3).map((group, idx) => (
                <div className={`carousel-item${idx === 0 ? ' active' : ''}`} key={group.map(a => a.article_id).join('-')}>
                  <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-5 justify-content-center">
                    {group.map((a) => (
                      <div className="col" key={a.article_id}>
                        <div className="card h-100 shadow border-0 rounded-4 luxury-card">
                          <Link to={`/articles/${a.article_id}`} className="text-decoration-none">
                            {a.image_url && (
                              <img
                                src={a.image_url.startsWith('http') ? a.image_url : `${BASE_URL}${a.image_url}`}
                                alt={a.title}
                                className="card-img-top luxury-img-top"
                                style={{ height: 220, objectFit: 'cover', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}
                              />
                            )}
                            <div className="card-body luxury-card-body">
                              <h3 className="card-title mb-2" style={{ fontWeight: 600 }}>{a.title}</h3>
                              <p className="card-text text-muted mb-2 luxury-desc">
                                {a.content ? `${a.content.replace(/<[^>]+>/g, '').substring(0, 100)}...` : 'Chưa có nội dung'}
                              </p>
                            </div>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {newestArticles.length > 3 && (
              <>
                <button className="carousel-control-prev" type="button" data-bs-target="#articlesCarousel" data-bs-slide="prev"
                  style={{ width: '5rem', height: '5rem', top: '50%', left: '-4rem', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="carousel-control-prev-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#articlesCarousel" data-bs-slide="next"
                  style={{ width: '5rem', height: '5rem', top: '50%', right: '-4rem', left: 'auto', transform: 'translateY(-50%)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="carousel-control-next-icon" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}></span>
                  <span className="visually-hidden">Next</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <Footer />
      <style>{highlightStyle}</style>
      <ReportArticleModal
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportError(null);
          setReportSuccess(false);
        }}
        onSubmit={async ({ type, reason }) => {
          setReportSubmitting(true);
          setReportError(null);
          setReportSuccess(false);
          try {
            const res = await fetch(`${BASE_URL}/api/articles/${id}/report`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user?.token}`,
              },
              body: JSON.stringify({ type, reason }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.message || 'Gửi báo cáo thất bại');
            }
            setReportSuccess(true);
            setTimeout(() => setReportOpen(false), 1500);
          } catch (err) {
            setReportError(err.message);
          } finally {
            setReportSubmitting(false);
          }
        }}
        submitting={reportSubmitting}
        error={reportError}
        success={reportSuccess}
      />
      {reportSuccess && <div style={{ color: 'green', marginTop: 8 }}>Report submitted!</div>}
      {reportError && <div style={{ color: 'red', marginTop: 8 }}>{reportError}</div>}
    </div>
  );
};

export default ArticleDetail;