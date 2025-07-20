import React from "react";
import { Link } from "react-router-dom";

const Navbar = ({ activePage, isAuthenticated }) => (
  <aside className="luxury-sidebar d-none d-lg-block luxury-sidebar-collapsed">
    <nav>
      <ul className="luxury-sidebar-nav list-unstyled mb-0">
        <li>
          <Link
            to="/explore"
            className={`luxury-sidebar-link${
              activePage === "explore" ? " active" : ""
            }`}
            style={{ textDecoration: "none" }}
          >
            <i className="bi bi-map luxury-sidebar-icon" />
            <span className="luxury-sidebar-label">Khám phá</span>
          </Link>
        </li>
        <li>
          <Link
            to="/manual-planner"
            className={`luxury-sidebar-link${
              activePage === "/manual-planner" ? " active" : ""
            }`}
            style={{ textDecoration: "none" }}
          >
            <i className="bi bi-calendar2-check luxury-sidebar-icon" />
            <span className="luxury-sidebar-label">Lên kế hoạch</span>
          </Link>
        </li>
        <li>
          <Link
            to="/my-tours"
            className={`luxury-sidebar-link${
              activePage === "mytours" ? " active" : ""
            }`}
            style={{ textDecoration: "none" }}
          >
            <i className="bi bi-person-walking luxury-sidebar-icon" />
            <span className="luxury-sidebar-label">Tour của tôi</span>
          </Link>
        </li>
        {isAuthenticated && (
          <li>
            <Link
              to="/users"
              className={`luxury-sidebar-link${
                activePage === "profile" ? " active" : ""
              }`}
              style={{ textDecoration: "none" }}
            >
              <i className="bi bi-person-circle luxury-sidebar-icon" />
              <span className="luxury-sidebar-label">Hồ sơ</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  </aside>
);

export default Navbar;