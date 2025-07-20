import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import axios from "axios";

function ForgotPasswordModal({ show, onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setResendMessage("");
    setResendError("");
    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/api/auth/forgot-password", { email });
      setMessage(res.data.message || "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi gửi email đặt lại mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage("");
    setResendError("");
    try {
      const res = await axios.post("http://localhost:3000/api/auth/forgot-password", { email });
      setResendMessage(res.data.message || "Email đặt lại mật khẩu đã được gửi lại.");
    } catch (err) {
      setResendError(err.response?.data?.message || "Lỗi gửi lại email đặt lại mật khẩu");
    } finally {
      setIsResending(false);
    }
  };

  const handleNewEmail = () => {
    setMessage("");
    setError("");
    setResendMessage("");
    setResendError("");
    setEmail("");
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Quên mật khẩu</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message ? (
          <>
            <div className="alert alert-success">{message}</div>
            <button
              type="button"
              className="btn btn-link p-0 mt-2 text-decoration-none"
              onClick={handleResend}
              disabled={isResending || !email}
            >
              {isResending ? "Đang gửi lại..." : "Gửi lại email đặt lại mật khẩu"}
            </button>
            {resendMessage && <div className="alert alert-success mt-2">{resendMessage}</div>}
            {resendError && <div className="alert alert-danger mt-2">{resendError}</div>}
            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-underline"
                onClick={handleNewEmail}
              >
                Nhập email khác
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
              <label className="form-label">Nhập email của bạn:</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={isLoading || !email}>
              {isLoading ? "Đang gửi..." : "Gửi email đặt lại mật khẩu"}
            </button>
          </form>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default ForgotPasswordModal; 