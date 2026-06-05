import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../hooks/useTranslation';

// Icons as SVG inline
const HomeIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const SearchIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" fill={filled ? 'currentColor' : 'none'} />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const CalendarIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const SettingsIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const ShopIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
    <path d="M3 9l1-5h16l1 5" />
    <path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role;

  const customerNav = [
    { to: '/', label: t('tabs.home'), Icon: HomeIcon },
    { to: '/search', label: t('tabs.search'), Icon: SearchIcon },
    { to: '/appointments', label: t('tabs.appointments'), Icon: CalendarIcon },
    { to: '/settings', label: t('tabs.settings'), Icon: SettingsIcon },
  ];

  const managerNav = [
    { to: '/manager/appointments', label: 'Lịch hẹn', Icon: CalendarIcon },
    { to: '/manager/shops', label: t('tabs.myShops'), Icon: ShopIcon },
    { to: '/settings', label: t('tabs.settings'), Icon: SettingsIcon },
  ];

  const staffNav = [
    { to: '/staff/appointments', label: 'Lịch hẹn', Icon: CalendarIcon },
    { to: '/settings', label: t('tabs.settings'), Icon: SettingsIcon },
  ];

  const navItems = role === 'MANAGER' || role === 'ADMIN'
    ? managerNav
    : role === 'STAFF'
      ? staffNav
      : customerNav;

  return (
    <div className="app-layout">
      {/* Sidebar — desktop only */}
      <nav className="sidebar" style={{ display: 'none' }} id="sidebar-desktop">
        <div style={{ marginBottom: 32 }}>
          <div className="brand" style={{ fontSize: 22 }}>B_Hair</div>
        </div>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/' || to === '/manager/appointments' || to === '/staff/appointments'}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          >
            <Icon filled={false} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <div className="main-content">
        {children}
      </div>

      {/* Bottom nav — mobile */}
      <nav className="bottom-nav" style={{ display: location.pathname.includes('/shop/') || location.pathname.includes('/booking/') ? 'none' : 'flex' }}>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/' || to === '/manager/appointments' || to === '/staff/appointments'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Icon filled={isActive} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Apply sidebar on desktop via CSS */}
      <style>{`
        @media (min-width: 1024px) {
          #sidebar-desktop { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
