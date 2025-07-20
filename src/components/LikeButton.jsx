import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext.jsx';

const LikeButton = ({ id, type = 'place' }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const likeApi = type === 'tour' ? 'tour-likes' : 'place-likes';
    axiosClient.get(`${likeApi}/count`, { params: { [`${type}_id`]: id } })
      .then(res => setCount(res.data.count))
      .catch(err => {
        if (err.response && err.response.status === 404) setCount(0);
      });
    if (user) {
      axiosClient.get(`${likeApi}/is-liked`, { params: { [`${type}_id`]: id } })
        .then(res => setLiked(res.data.liked))
        .catch(err => {
          if (err.response && err.response.status === 404) setLiked(false);
        });
    }
  }, [id, user, type]);

  const handleToggle = async () => {
    if (!user) return alert('Bạn cần đăng nhập để thích!');
    setLoading(true);
    const likeApi = type === 'tour' ? 'tour-likes' : 'place-likes';
    try {
      if (liked) {
        await axiosClient.post(`${likeApi}/unlike`, { [`${type}_id`]: id });
        setLiked(false);
        setCount(c => c - 1);
      } else {
        await axiosClient.post(`${likeApi}/like`, { [`${type}_id`]: id });
        setLiked(true);
        setCount(c => c + 1);
      }
    } catch (e) {
      alert('Có lỗi khi cập nhật lượt thích.');
    }
    setLoading(false);
  };

  return (
    <button
      className={`btn btn-sm d-flex align-items-center gap-1 shadow-sm px-3 py-2 ${liked ? 'btn-primary' : 'btn-outline-danger'}`}
      onClick={handleToggle}
      disabled={loading}
      style={{ borderRadius: 24, fontWeight: 600, fontSize: 16, transition: 'all 0.2s' }}
    >
      <FaHeart
        style={{
          color: liked ? '#e74c3c' : '#aaa',
          transition: 'color 0.2s',
          filter: liked ? 'drop-shadow(0 0 6px #e74c3c88)' : 'none',
          transform: liked ? 'scale(1.2)' : 'scale(1)',
        }}
      />
      <span style={{ minWidth: 24, textAlign: 'center' }}>{count}</span>
    </button>
  );
};

export default LikeButton; 