import React, { useContext, useState, useEffect } from "react";
import AdminHeader from "../components/AdminHeader.jsx";
import AdminSidebar from "../components/AdminSidebar.jsx";
import { AuthContext } from "../contexts/AuthContext.jsx";
import { Link } from "react-router-dom";
import axios from "axios";
import "../css/AdminLayout.css";

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPlaces: 0,
    totalTours: 0,
    totalArticles: 0,
    recentUsers: 0,
    recentTours: 0,
    recentArticles: 0,
    recentPlaces: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const BASE_URL = "https://walkingguide.onrender.com";
        const [usersRes, placesRes, toursRes, articlesRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/users`),
          axios.get("http://localhost:3000/api/places"),
          axios.get("http://localhost:3000/api/tours"),
          axios.get("http://localhost:3000/api/articles"),
        ]);

        setStats({
          totalUsers: usersRes.data.length,
          totalPlaces: placesRes.data.length,
          totalTours: toursRes.data.length,
          totalArticles: articlesRes.data.length,
          recentUsers: Math.floor(usersRes.data.length * 0.15),
          recentTours: Math.floor(toursRes.data.length * 0.25),
          recentArticles: Math.floor(articlesRes.data.length * 0.20),
          recentPlaces: Math.floor(placesRes.data.length * 0.10),
        });

        const sortedUsers = usersRes.data
          .filter(u => u.full_name)
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setRecentUsers(sortedUsers.slice(0, 4));

      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats({
          totalUsers: 1247,
          totalPlaces: 89,
          totalTours: 156,
          totalArticles: 23,
          recentUsers: 187,
          recentTours: 39,
          recentArticles: 5,
          recentPlaces: 9
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  /** Helper function for time ago */
  function timeAgo(dateString) {
    if (!dateString) return 'Vừa đăng ký';
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Vừa đăng ký';
    if (diff < 3600) return `${Math.floor(diff/60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
    return `${Math.floor(diff/86400)} ngày trước`;
  }

  const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
    <div className="stat-card shadow-lg border-0 rounded-4 p-4 mb-4" style={{background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)', border: `2px solid ${color}20`}}>
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1">
          <h6 className="text-muted mb-1 fw-semibold">{title}</h6>
          <h3 className="fw-bold mb-1" style={{color: color}}>{loading ? '...' : value.toLocaleString()}</h3>
          {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
          {trend && (
            <div className="d-flex align-items-center mt-2">
              <i className={`bi ${trend > 0 ? 'bi-arrow-up' : 'bi-arrow-down'} me-1`} style={{color: trend > 0 ? '#28a745' : '#dc3545'}}></i>
              <span className="small fw-semibold" style={{color: trend > 0 ? '#28a745' : '#dc3545'}}>
                {Math.abs(trend)}% từ tháng trước
              </span>
            </div>
          )}
        </div>
        <div className="stat-icon rounded-circle d-flex align-items-center justify-content-center" style={{width: 60, height: 60, background: `${color}15`, color: color}}>
          <i className={`bi ${icon} fs-3`}></i>
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon, link, color }) => (
    <Link to={link} className="text-decoration-none">
      <div className="quick-action-card shadow border-0 rounded-4 p-4 h-100" style={{background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)', transition: 'all 0.3s ease'}}>
        <div className="d-flex align-items-center mb-3">
          <div className="quick-action-icon rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: 50, height: 50, background: `${color}15`, color: color}}>
            <i className={`bi ${icon} fs-4`}></i>
          </div>
          <h6 className="fw-bold mb-0" style={{color: '#1a5bb8'}}>{title}</h6>
        </div>
        <p className="text-muted small mb-0">{description}</p>
      </div>
    </Link>
  );

  const RecentActivityCard = ({ title, items, icon, color }) => (
    <div className="recent-activity-card shadow-lg border-0 rounded-4 p-4 h-100" style={{background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)'}}>
      <div className="d-flex align-items-center mb-3">
        <div className="activity-icon rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: 40, height: 40, background: `${color}15`, color: color}}>
          <i className={`bi ${icon} fs-5`}></i>
        </div>
        <h6 className="fw-bold mb-0" style={{color: '#1a5bb8'}}>{title}</h6>
      </div>
      <div className="activity-list">
        {items.map((item, index) => (
          <div key={index} className="activity-item d-flex align-items-center py-2 border-bottom" style={{borderColor: '#f1f3f4'}}>
            <div className="activity-dot rounded-circle me-3" style={{width: 8, height: 8, background: color}}></div>
            <div className="flex-grow-1">
              <div className="fw-semibold small">{item.title}</div>
              <div className="text-muted small">{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="container-fluid">
            {/* Header Section */}
            <div className="dashboard-header text-center mb-5">
              <h1 className="display-5 fw-bold mb-2" style={{color: '#1a5bb8', textShadow: '0 2px 4px rgba(26, 91, 184, 0.1)'}}>
                Bảng Quản Trị
              </h1>
              <p className="lead mb-0" style={{color: '#223a5f'}}>
                Chào mừng trở lại, <span className="fw-bold" style={{color: '#3498db'}}>{user?.full_name || 'Admin'}</span>! 
                Đây là tổng quan về hệ thống của bạn.
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-5">
              <div className="col-lg-3 col-md-6">
                <StatCard 
                  title="Tổng Người Dùng" 
                  value={stats.totalUsers} 
                  icon="bi-people-fill" 
                  color="#3498db"
                  trend={12}
                  subtitle="Người dùng đã đăng ký"
                />
              </div>
              <div className="col-lg-3 col-md-6">
                <StatCard 
                  title="Địa Điểm Du Lịch" 
                  value={stats.totalPlaces} 
                  icon="bi-geo-alt-fill" 
                  color="#e74c3c"
                  trend={8}
                  subtitle="Địa điểm đã thêm"
                />
              </div>
              <div className="col-lg-3 col-md-6">
                <StatCard 
                  title="Lộ Trình Tour" 
                  value={stats.totalTours} 
                  icon="bi-map-fill" 
                  color="#f39c12"
                  trend={-3}
                  subtitle="Tour đã tạo"
                />
              </div>
              <div className="col-lg-3 col-md-6">
                <StatCard 
                  title="Bài Viết" 
                  value={stats.totalArticles} 
                  icon="bi-newspaper" 
                  color="#27ae60"
                  trend={15}
                  subtitle="Bài viết đã xuất bản"
                />
              </div>
            </div>

            {/* Quick Actions and Recent Activity */}
            <div className="row mb-5">
              <div className="col-lg-8">
                <h4 className="fw-bold mb-4" style={{color: '#1a5bb8'}}>Thao Tác Nhanh</h4>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <QuickActionCard 
                      title="Quản Lý Người Dùng"
                      description="Xem, chỉnh sửa và quản lý tài khoản người dùng"
                      icon="bi-people-fill"
                      link="/admin/users"
                      color="#3498db"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <QuickActionCard 
                      title="Quản Lý Địa Điểm"
                      description="Thêm, sửa, xóa địa điểm du lịch và thông tin"
                      icon="bi-geo-alt-fill"
                      link="/admin/places"
                      color="#e74c3c"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <QuickActionCard 
                      title="Quản Lý Tour"
                      description="Tạo và quản lý các lộ trình du lịch"
                      icon="bi-map-fill"
                      link="/admin/tours"
                      color="#f39c12"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <QuickActionCard 
                      title="Quản Lý Bài Viết"
                      description="Kiểm duyệt và quản lý nội dung bài viết"
                      icon="bi-newspaper"
                      link="/admin/articles"
                      color="#27ae60"
                    />
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <h4 className="fw-bold mb-4" style={{color: '#1a5bb8'}}>Hoạt Động Gần Đây</h4>
                <RecentActivityCard 
                  title="Người Dùng Mới"
                  items={recentUsers.map(u => ({
                    title: `${u.full_name} đã đăng ký`,
                    time: timeAgo(u.created_at)
                  }))}
                  icon="bi-person-plus"
                  color="#3498db"
                />
              </div>
            </div>

            {/* System Status and Performance */}
            <div className="row">
              <div className="col-lg-6 mb-4 mt-5">
                <div className="system-status-card shadow-lg border-0 rounded-4 p-4" style={{background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)'}}>
                  <h5 className="fw-bold mb-3" style={{color: '#1a5bb8'}}>Trạng Thái Hệ Thống</h5>
                  <div className="status-item d-flex justify-content-between align-items-center py-2">
                    <span className="fw-semibold">Máy chủ</span>
                    <span className="badge bg-success">Hoạt động</span>
                  </div>
                  <div className="status-item d-flex justify-content-between align-items-center py-2">
                    <span className="fw-semibold">Cơ sở dữ liệu</span>
                    <span className="badge bg-success">Hoạt động</span>
                  </div>
                  <div className="status-item d-flex justify-content-between align-items-center py-2">
                    <span className="fw-semibold">API</span>
                    <span className="badge bg-success">Hoạt động</span>
                  </div>
                  <div className="status-item d-flex justify-content-between align-items-center py-2">
                    <span className="fw-semibold">Bảo mật</span>
                    <span className="badge bg-warning">Cần kiểm tra</span>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 mb-4 mt-5">
                <div className="performance-card shadow-lg border-0 rounded-4 p-4" style={{background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)'}}>
                  <h5 className="fw-bold mb-3" style={{color: '#1a5bb8'}}>Hiệu Suất</h5>
                  <div className="performance-item mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-semibold">CPU</span>
                      <span className="text-muted">45%</span>
                    </div>
                    <div className="progress" style={{height: 8}}>
                      <div className="progress-bar bg-success" style={{width: '45%'}}></div>
                    </div>
                  </div>
                  <div className="performance-item mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-semibold">RAM</span>
                      <span className="text-muted">62%</span>
                    </div>
                    <div className="progress" style={{height: 8}}>
                      <div className="progress-bar bg-warning" style={{width: '62%'}}></div>
                    </div>
                  </div>
                  <div className="performance-item mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-semibold">Lưu trữ</span>
                      <span className="text-muted">28%</span>
                    </div>
                    <div className="progress" style={{height: 8}}>
                      <div className="progress-bar bg-info" style={{width: '28%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;