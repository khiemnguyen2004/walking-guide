import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/luxury-home.css";

const adminNavLinks = [
  { to: "/admin/users", icon: "bi-person", label: "Người dùng" },
  { to: "/admin/places", icon: "bi-geo-alt", label: "Địa điểm" },
  { to: "/admin/articles", icon: "bi-newspaper", label: "Bài viết" },
  { to: "/admin/tours", icon: "bi-map", label: "Lộ trình" },
];

const AdminNavbar = () => {
  const location = useLocation();
  return (
    <aside className="luxury-sidebar d-none d-lg-block luxury-sidebar-collapsed" style={{top: 0}}>
      <nav>
        <ul className="luxury-sidebar-nav list-unstyled mb-0">
          {adminNavLinks.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`luxury-sidebar-link${location.pathname.startsWith(link.to) ? " active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <i className={`bi ${link.icon} luxury-sidebar-icon`} />
                <span className="luxury-sidebar-label">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminNavbar;
