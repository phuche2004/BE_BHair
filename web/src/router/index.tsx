import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AppShell } from '../components/layout/AppShell';

// Lazy load pages
const LoginPage = React.lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage'));
const HomePage = React.lazy(() => import('../pages/customer/HomePage'));
const SearchPage = React.lazy(() => import('../pages/customer/SearchPage'));
const AppointmentsPage = React.lazy(() => import('../pages/customer/AppointmentsPage'));
const AppointmentDetailPage = React.lazy(() => import('../pages/customer/AppointmentDetailPage'));
const SettingsPage = React.lazy(() => import('../pages/customer/SettingsPage'));
const HairstyleAdvisorPage = React.lazy(() => import('../pages/customer/HairstyleAdvisorPage'));
const ShopDetailPage = React.lazy(() => import('../pages/shop/ShopDetailPage'));
const BookingPage = React.lazy(() => import('../pages/shop/BookingPage'));
const ManagerAppointmentsPage = React.lazy(() => import('../pages/manager/ManagerAppointmentsPage'));
const MyShopsPage = React.lazy(() => import('../pages/manager/MyShopsPage'));
const StaffAppointmentsPage = React.lazy(() => import('../pages/staff/StaffAppointmentsPage'));

// Landing page now handles the root logic
const LandingPage = React.lazy(() => import('../pages/public/LandingPage'));
const ShowcasePage = React.lazy(() => import('../pages/public/ShowcasePage'));

const PageLoader = () => (
  <div className="spinner-wrap" style={{ minHeight: '50dvh' }}>
    <div className="spinner" />
  </div>
);

// Keep-Alive wrapper for bottom-nav tabs
function TabWrapper({ active, children }: { active: boolean, children: React.ReactNode }) {
  return (
    <div style={{
      position: active ? 'relative' : 'absolute',
      top: 0, left: 0, right: 0, bottom: active ? 'auto' : 0,
      height: active ? '100%' : 'auto',
      opacity: active ? 1 : 0,
      visibility: active ? 'visible' : 'hidden',
      transition: 'opacity 0.3s ease, visibility 0.3s ease',
      zIndex: active ? 1 : 0,
      pointerEvents: active ? 'auto' : 'none'
    }}>
      {children}
    </div>
  );
}

function KeepAliveTabs() {
  const { user } = useAuthStore();
  const location = useLocation();
  const path = location.pathname;
  const role = user?.role;

  // Authorization redirects for protected paths
  if (!user) {
    const isPublicRoute = ['/', '/login', '/register', '/showcase'].includes(path) || path.startsWith('/shop/');
    if (isPublicRoute) return null;
    return <Navigate to="/" replace />;
  }
  
  if (role === 'CUSTOMER' && (path.includes('/manager/') || path.includes('/staff/'))) {
    return <Navigate to="/home" replace />;
  }
  if ((role === 'MANAGER' || role === 'ADMIN') && (path.includes('/staff/') || ['/home', '/search', '/hairstyle', '/appointments'].includes(path))) {
    return <Navigate to="/manager/appointments" replace />;
  }
  if (role === 'STAFF' && (path.includes('/manager/') || ['/home', '/search', '/hairstyle', '/appointments'].includes(path))) {
    return <Navigate to="/staff/appointments" replace />;
  }

  return (
    <AppShell>
      {/* Customer Tabs */}
      {(!role || role === 'CUSTOMER') && (
        <div style={{ position: 'relative', height: '100%' }}>
          <TabWrapper active={path === '/home'}><HomePage /></TabWrapper>
          <TabWrapper active={path === '/search'}><SearchPage /></TabWrapper>
          <TabWrapper active={path === '/hairstyle'}><HairstyleAdvisorPage /></TabWrapper>
          <TabWrapper active={path === '/appointments'}><AppointmentsPage /></TabWrapper>
          <TabWrapper active={path === '/settings'}><SettingsPage /></TabWrapper>
        </div>
      )}

      {/* Manager Tabs */}
      {(role === 'MANAGER' || role === 'ADMIN') && (
        <div style={{ position: 'relative', height: '100%' }}>
          <TabWrapper active={path === '/manager/appointments'}><ManagerAppointmentsPage /></TabWrapper>
          <TabWrapper active={path === '/manager/shops'}><MyShopsPage /></TabWrapper>
          <TabWrapper active={path === '/settings'}><SettingsPage /></TabWrapper>
        </div>
      )}

      {/* Staff Tabs */}
      {role === 'STAFF' && (
        <div style={{ position: 'relative', height: '100%' }}>
          <TabWrapper active={path === '/staff/appointments'}><StaffAppointmentsPage /></TabWrapper>
          <TabWrapper active={path === '/settings'}><SettingsPage /></TabWrapper>
        </div>
      )}
    </AppShell>
  );
}

const TAB_PATHS = [
  '/home', '/search', '/hairstyle', '/appointments', '/settings',
  '/manager/appointments', '/manager/shops', '/staff/appointments'
];

function MainApp() {
  const location = useLocation();
  const path = location.pathname;
  const isTabRoute = TAB_PATHS.includes(path);

  return (
    <>
      <div style={{ display: isTabRoute ? 'block' : 'none', height: '100%' }}>
        <KeepAliveTabs />
      </div>

      {!isTabRoute && (
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/showcase" element={<ShowcasePage />} />

          {/* NON-TAB ROUTES */}
          <Route
            path="/appointments/:id"
            element={
              <AppShell>
                <AppointmentDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/shop/:id"
            element={
              <AppShell>
                <ShopDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/booking/:shopId"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <AppShell>
                  <BookingPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<PageLoader />}>
        <MainApp />
      </React.Suspense>
    </BrowserRouter>
  );
}
