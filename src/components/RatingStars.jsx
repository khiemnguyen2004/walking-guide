import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext.jsx';

const RatingStars = ({ id, type = 'place' }) => {
  const { user } = useAuth();
  const [average, setAverage] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [loading, setLoading] = useState(false);

  const getRatingApi = (type) => {
    if (type === 'tour') return 'tour-ratings';
    if (type === 'hotel') return 'hotel-ratings';
    if (type === 'restaurant') return 'restaurant-ratings';
    return 'place-ratings';
  };

  useEffect(() => {
    if (!id) return;
    const ratingApi = getRatingApi(type);
    axiosClient.get(`${ratingApi}/average`, { params: { [`${type}_id`]: id } })
      .then(res => setAverage(res.data.average))
      .catch(err => {
        if (err.response && err.response.status === 404) setAverage(0);
      });
    if (user) {
      axiosClient.get(`${ratingApi}/user`, { params: { [`${type}_id`]: id } })
        .then(res => setUserRating(res.data.rating || 0))
        .catch(err => {
          if (err.response && err.response.status === 404) setUserRating(0);
        });
    }
  }, [id, user, type]);

  const handleRate = async (rating) => {
    if (!user) return alert('Bạn cần đăng nhập để đánh giá!');
    setLoading(true);
    const ratingApi = getRatingApi(type);
    try {
      await axiosClient.post(`${ratingApi}/rate`, { [`${type}_id`]: id, rating });
      setUserRating(rating);
      const res = await axiosClient.get(`${ratingApi}/average`, { params: { [`${type}_id`]: id } });
      setAverage(res.data.average);
    } catch (e) {
      alert('Có lỗi khi gửi đánh giá.');
    }
    setLoading(false);
  };

  return (
    <div className="d-flex align-items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={24}
          style={{
            cursor: user ? 'pointer' : 'default',
            color: (hover || userRating) >= star ? '#f1c40f' : '#ddd',
            transition: 'color 0.2s, transform 0.1s',
            transform: hover === star ? 'scale(1.2)' : 'scale(1)',
            filter: (hover || userRating) >= star ? 'drop-shadow(0 0 4px #f1c40f88)' : 'none',
          }}
          onMouseEnter={() => user && setHover(star)}
          onMouseLeave={() => user && setHover(null)}
          onClick={() => user && handleRate(star)}
        />
      ))}
      <span style={{ fontWeight: 500, color: '#888', fontSize: 15, minWidth: 40 }}>
        {average ? average.toFixed(1) : 'Chưa có đánh giá'}
      </span>
    </div>
  );
};

export default RatingStars; 