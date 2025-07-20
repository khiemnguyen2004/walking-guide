import React, { useState } from "react";
import axios from "axios";

function RegisterForm({ onSuccess, onSwitch }) {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    setResendMessage("");
    setResendError("");
    setRegisteredEmail("");

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.post("http://localhost:3000/api/auth/register", {
        full_name,
        email,
        password,
        confirmPassword,
      });
      if (response.data.success) {
        setSuccess(response.data.message);
        setRegisteredEmail(email);
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đăng ký");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage("");
    setResendError("");
    try {
      const res = await axios.post("http://localhost:3000/api/auth/resend-verification", { email: registeredEmail });
      setResendMessage(res.data.message || "Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.");
    } catch (err) {
      setResendError(err.response?.data?.message || "Lỗi gửi lại email xác thực");
    } finally {
      setIsResending(false);
    }
  };

  const handleNewEmail = () => {
    setSuccess("");
    setError("");
    setResendMessage("");
    setResendError("");
    setRegisteredEmail("");
  };

  return (
    <form onSubmit={handleRegister} className="w-100">
      {error && <div className="alert alert-danger">{error}</div>}
      {success ? (
        <>
          <div className="alert alert-success">{success}</div>
          <button
            type="button"
            className="btn btn-link p-0 mt-2 text-decoration-none"
            onClick={handleResend}
            disabled={isResending || !registeredEmail}
          >
            {isResending ? "Đang gửi lại..." : "Gửi lại email xác thực"}
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
        <>
          <div className="mb-3">
            <label className="form-label">Họ và tên:</label>
            <input
              type="text"
              className="form-control"
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email:</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Mật khẩu:</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
            <small className="text-muted">Mật khẩu phải có ít nhất 6 ký tự</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Xác nhận mật khẩu:</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
            {confirmPassword && password !== confirmPassword && (
              <small className="text-danger">Mật khẩu xác nhận không khớp</small>
            )}
            {confirmPassword && password === confirmPassword && (
              <small className="text-success">✓ Mật khẩu khớp</small>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={isLoading || !full_name || !email || !password || !confirmPassword}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang đăng ký...
              </>
            ) : (
              "Đăng ký"
            )}
          </button>
          <p className="mt-3 text-center">
            Đã có tài khoản? <button type="button" className="btn btn-link p-0" onClick={onSwitch}>Đăng nhập</button>
          </p>
        </>
      )}
    </form>
  );
}

export default RegisterForm;
