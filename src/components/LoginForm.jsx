import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";

function LoginForm({ onSuccess, onSwitch, onForgotPassword, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
      });
      // Store the token in localStorage
      localStorage.setItem("token", res.data.token);
      login({ ...res.data.user, token: res.data.token });
      if (onLoginSuccess) onLoginSuccess(res.data.user);
      if (onSuccess) onSuccess(); // Close the modal immediately
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <form onSubmit={handleLogin} className="w-100">
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="mb-3">
        <label className="form-label">Email:</label>
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
        />
      </div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <button type="submit" className="btn btn-main w-50">Đăng nhập</button>
        <button type="button" className="btn btn-link p-0" style={{fontSize: '0.95rem'}} onClick={onForgotPassword}>Quên mật khẩu?</button>
      </div>
      <p className="mt-3 text-center">
        Chưa có tài khoản? <button type="button" className="btn btn-link p-0" onClick={onSwitch}>Đăng ký</button>
      </p>
    </form>
  );
}

export default LoginForm;
