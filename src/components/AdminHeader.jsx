import React from "react";
import { Link } from "react-router-dom";
import "../css/AdminLayout.css";

function AdminHeader() {
  return (
    <div className="admin-header">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Link to ="/">
              <img src="/src/images/banner.png" alt="Walking Guide Banner" style={{ height: 180, marginRight: 28, borderRadius: 12 }} />
            </Link>
          </div>
          
          <div className="admin-header-actions">
            <div className="dropdown">
              <button
                className="btn btn-link text-white dropdown-toggle"
                type="button"
                id="adminDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle me-2"></i>
                Quản trị viên
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="adminDropdown">
                <li>
                  <Link className="dropdown-item" to="/users">
                    <i className="bi bi-person me-2"></i>
                    Hồ sơ
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/admin/settings">
                    <i className="bi bi-gear me-2"></i>
                    Cài đặt
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item" to="/">
                    <i className="bi bi-house me-2"></i>
                    Về trang chủ
                  </Link>
                </li>
                <li>
                  <button className="dropdown-item text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Đăng xuất
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHeader;
