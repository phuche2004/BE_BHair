import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import './LandingPage.css';

export default function LandingPage() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect them to their dashboard
    if (token) {
      if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
        navigate('/manager/appointments', { replace: true });
      } else if (user?.role === 'STAFF') {
        navigate('/staff/appointments', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [token, user, navigate]);

  // Prevent rendering the landing page flash if redirecting
  if (token) return null;

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container">
          <h1 className="landing-title">B_Hair</h1>
          <p className="landing-subtitle">
            Hệ Thống Đặt Lịch Cắt Tóc (Barber Booking System) thông minh, tiện lợi và hiện đại.
          </p>
          <button className="landing-btn" onClick={() => navigate('/login')}>
            Bắt đầu trải nghiệm ngay
          </button>
        </div>
      </header>

      <div className="landing-container">
        <div className="landing-features">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">📅</div>
            <h3>Đặt lịch thông minh</h3>
            <p>Chọn dịch vụ, chọn thợ cắt tóc yêu thích và thời gian phù hợp chỉ với vài thao tác. Tự động kiểm tra trùng lịch.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">🤖</div>
            <h3>AI Tư vấn kiểu tóc</h3>
            <p>Tích hợp AI để phân tích khuôn mặt và gợi ý kiểu tóc, màu nhuộm phù hợp nhất với bạn.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">💈</div>
            <h3>Quản lý đa cửa hàng</h3>
            <p>Dành cho Manager & Admin: Dễ dàng quản lý nhiều chi nhánh, dịch vụ, nhân viên và theo dõi doanh thu.</p>
          </div>
        </div>

        <div className="landing-system-info">
          <h2>Công Nghệ & Kiến Trúc</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            B_Hair được xây dựng trên nền tảng công nghệ hiện đại, đảm bảo hiệu suất cao và trải nghiệm người dùng mượt mà.
          </p>
          <div className="landing-tech-stack">
            <span className="landing-tech-badge">Node.js & Express 5</span>
            <span className="landing-tech-badge">MongoDB</span>
            <span className="landing-tech-badge">React 19 & Vite</span>
            <span className="landing-tech-badge">TypeScript</span>
            <span className="landing-tech-badge">Socket.io Realtime</span>
            <span className="landing-tech-badge">Zustand</span>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        &copy; {new Date().getFullYear()} B_Hair Project. Designed with passion.
      </footer>
    </div>
  );
}
