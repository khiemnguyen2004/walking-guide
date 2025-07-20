import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import "../css/luxury-home.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect to home if already logged in
  React.useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
      });
      login(res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column luxury-home-container">
      <Header />
      <main className="container d-flex flex-column align-items-center justify-content-center flex-grow-1 py-5">
        <div className="card shadow border-0 rounded-4 p-4 luxury-card" style={{ maxWidth: 500, width: '100%', background: 'rgba(255,255,255,0.97)' }}>
          <h2 className="mb-4 text-center" style={{color: '#1a5bb8', fontWeight: 700}}>Đăng nhập</h2>
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
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-2 gap-2">
              <button type="submit" className="btn btn-main w-100 w-md-50">Đăng nhập</button>
              <div className="d-flex flex-column align-items-center gap-1">
                <button type="button" className="btn btn-link p-0" style={{fontSize: '0.95rem'}} onClick={() => setShowForgot(true)}>Quên mật khẩu?</button>
              </div>
            </div>
            <p className="mt-3 text-center">
              Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
            </p>
          </form>
        </div>
        <ForgotPasswordModal show={showForgot} onClose={() => setShowForgot(false)} />
      </main>
      <Footer />
    </div>
  );
}

export default LoginPage;
