import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/AdminLayout.css";

function AdminSidebar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-sidebar">
      <nav className="sidebar-nav">
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              to="/admin"
              className={`nav-link ${isActive("/admin") ? "active" : ""}`}
            >
              <i className="bi bi-house-door me-2"></i>
              Trang chủ
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/admin/tours"
              className={`nav-link ${isActive("/admin/tours") ? "active" : ""}`}
            >
              <i className="bi bi-map me-2"></i>
              Quản lý Tour
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/admin/places"
              className={`nav-link ${isActive("/admin/places") ? "active" : ""}`}
            >
              <i className="bi bi-geo-alt me-2"></i>
              Quản lý Địa điểm
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/admin/hotels"
              className={`nav-link ${isActive("/admin/hotels") ? "active" : ""}`}
            >
              <i className="bi bi-building me-2"></i>
              Quản lý Khách sạn
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/admin/restaurants"
              className={`nav-link ${isActive("/admin/restaurants") ? "active" : ""}`}
            >
              <i className="bi bi-cup-hot me-2"></i>
              Quản lý Nhà hàng
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/admin/bookings"
              className={`nav-link ${isActive("/admin/bookings") ? "active" : ""}`}
            >
              <i className="bi bi-calendar-check me-2"></i>
              Quản lý Booking
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/admin/users"
              className={`nav-link ${isActive("/admin/users") ? "active" : ""}`}
            >
              <i className="bi bi-people me-2"></i>
              Quản lý Người dùng
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/admin/articles"
              className={`nav-link ${isActive("/admin/articles") ? "active" : ""}`}
            >
              <i className="bi bi-file-text me-2"></i>
              Quản lý Bài viết
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/admin/settings"
              className={`nav-link ${isActive("/admin/settings") ? "active" : ""}`}
            >
              <i className="bi bi-gear me-2"></i>
              Cài đặt
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default AdminSidebar;
