import React, { useState } from 'react';

const OtpInput = ({ onVerify, email }) => {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('https://walkingguide.onrender.com/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('OTP verified!');
        if (onVerify) onVerify();
      } else {
        setMessage(data.message || 'Invalid OTP.');
      }
    } catch {
      setMessage('Failed to verify OTP.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2 className="mb-4">Enter OTP</h2>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter OTP"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          required
        />
      </div>
      <button className="btn btn-primary w-100" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
      {message && <div className="alert alert-info mt-3">{message}</div>}
    </form>
  );
};

export default OtpInput;
