import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Verifying...');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('Invalid verification link.');
      setLoading(false);
      return;
    }
    fetch(`http://localhost:3000/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('Email verified! You can now log in.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setStatus(data.message || 'Verification failed.');
        }
        setLoading(false);
      })
      .catch(() => {
        setStatus('Verification failed.');
        setLoading(false);
      });
  }, [searchParams, navigate]);

  return (
    <div className="container py-5 text-center">
      {loading ? (
        <>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h2>{status}</h2>
        </>
      ) : (
        <h2>{status}</h2>
      )}
    </div>
  );
};

export default VerifyEmail;
