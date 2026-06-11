import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function RootRedirect() {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'MANAGER' || user?.role === 'ADMIN') return <Navigate to="/manager/appointments" replace />;
  if (user?.role === 'STAFF') return <Navigate to="/staff/appointments" replace />;
  return <Navigate to="/home" replace />;
}

const PageLoader = () => (
  <div className="spinner-wrap" style={{ minHeight: '50dvh' }}>
    <div className="spinner" />
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Customer routes */}
          <Route
            path="/home"
            element={
              <AppShell>
                <HomePage />
              </AppShell>
            }
          />
          <Route
            path="/search"
            element={
              <AppShell>
                <SearchPage />
              </AppShell>
            }
          />
          <Route
            path="/appointments"
            element={
              <AppShell>
                <AppointmentsPage />
              </AppShell>
            }
          />
          <Route
            path="/appointments/:id"
            element={
              <AppShell>
                <AppointmentDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/settings"
            element={
              <AppShell>
                <SettingsPage />
              </AppShell>
            }
          />
          <Route
            path="/hairstyle"
            element={
              <AppShell>
                <HairstyleAdvisorPage />
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

          {/* Manager routes */}
          <Route
            path="/manager/appointments"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                <AppShell>
                  <ManagerAppointmentsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/shops"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                <AppShell>
                  <MyShopsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Staff routes */}
          <Route
            path="/staff/appointments"
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <AppShell>
                  <StaffAppointmentsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}
