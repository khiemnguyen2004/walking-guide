import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const BASE_URL = "https://walkingguide.onrender.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("Liên kết không hợp lệ hoặc đã hết hạn.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        token,
        password,
        confirmPassword,
      });
      setSuccess(res.data.message || "Đặt lại mật khẩu thành công.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đặt lại mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column luxury-home-container">
      <Header />
      <main className="container d-flex flex-column align-items-center justify-content-center flex-grow-1 py-5">
        <div className="card shadow border-0 rounded-4 p-4 luxury-card" style={{ maxWidth: 420, width: '100%', background: 'rgba(255,255,255,0.97)' }}>
          <h2 className="mb-4 text-center" style={{color: '#1a5bb8', fontWeight: 700}}>Đặt lại mật khẩu</h2>
          <form onSubmit={handleSubmit} className="w-100">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <div className="mb-3">
              <label className="form-label">Mật khẩu mới:</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
              <small className="text-muted">Mật khẩu phải có ít nhất 6 ký tự</small>
            </div>
            <div className="mb-3">
              <label className="form-label">Xác nhận mật khẩu mới:</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
              {confirmPassword && password !== confirmPassword && (
                <small className="text-danger">Mật khẩu xác nhận không khớp</small>
              )}
              {confirmPassword && password === confirmPassword && (
                <small className="text-success">✓ Mật khẩu khớp</small>
              )}
            </div>
            <button type="submit" className="btn btn-success w-100" disabled={isLoading || !password || !confirmPassword}>
              {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ResetPasswordPage; 