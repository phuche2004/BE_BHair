import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from '../../hooks/useTranslation';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, language, setLanguage } = useThemeStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const ROLE_LABEL: Record<string, string> = {
    CUSTOMER: t('auth.customer'),
    MANAGER: t('auth.manager'),
    ADMIN: 'Admin',
    STAFF: 'Staff',
  };

  if (!user) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">{t('settings.title')}</div></div>
        <div className="empty-state">
          <div className="empty-icon-bg">⚙️</div>
          <div className="empty-title">Vui lòng đăng nhập</div>
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>Đăng nhập ngay</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="brand">B_Hair</div>
          <div className="brand-divider" />
          <div className="page-title">{t('settings.title')}</div>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 16 }}>
        {/* Profile Card */}
        <div className="profile-row" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', marginBottom: 24 }}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.fullName} className="avatar" />
          ) : (
            <div className="avatar">👤</div>
          )}
          <div style={{ paddingBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
              {ROLE_LABEL[user.role] || user.role}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-headline)' }}>
              {user.fullName}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
              {user.phoneNumber || t('settings.noPhone')}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <span style={{ fontSize: 18 }}>🌙</span> {t('settings.darkMode')}
            </div>
            <label className="toggle">
              <input 
                type="checkbox" 
                checked={theme === 'dark'} 
                onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} 
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="settings-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div className="settings-row-left">
              <span style={{ fontSize: 18 }}>🌐</span> {t('settings.language')}
            </div>
          </div>
          <div className="segment" style={{ marginBottom: 14 }}>
            <div 
              className={`segment-btn ${language === 'vi' ? 'active' : ''}`}
              onClick={() => setLanguage('vi')}
            >
              Tiếng Việt
            </div>
            <div 
              className={`segment-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              English
            </div>
          </div>
        </div>

        {/* Account & Support */}
        <div className="settings-card">
          <div className="settings-row" style={{ cursor: 'pointer' }}>
            <div className="settings-row-left">
              <span style={{ fontSize: 18 }}>👤</span> {t('settings.accountSettings')}
            </div>
            <span style={{ color: 'var(--outline)' }}>›</span>
          </div>
          <div className="settings-row" style={{ cursor: 'pointer' }}>
            <div className="settings-row-left">
              <span style={{ fontSize: 18 }}>💳</span> {t('settings.paymentMethods')}
            </div>
            <span style={{ color: 'var(--outline)' }}>›</span>
          </div>
          <div className="settings-row" style={{ cursor: 'pointer' }}>
            <div className="settings-row-left">
              <span style={{ fontSize: 18 }}>❓</span> {t('settings.helpSupport')}
            </div>
            <span style={{ color: 'var(--outline)' }}>›</span>
          </div>
        </div>

        {/* Logout */}
        <button 
          className="btn btn-outline btn-full" 
          style={{ borderColor: 'var(--error)', color: 'var(--error)', marginTop: 24 }}
          onClick={() => setShowLogoutConfirm(true)}
        >
          {t('settings.logout')}
        </button>
      </div>

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('settings.logoutConfirmTitle')}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
              {t('settings.logoutConfirmMsg')}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>
                {t('settings.cancel')}
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleLogout}>
                {t('settings.logout')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
