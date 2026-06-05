import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { Role } from '../../types';

interface Props {
  children: React.ReactNode;
  allowedRoles?: Role[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }: Props) {
  const { token, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '100dvh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to role-appropriate home
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
      return <Navigate to="/manager/appointments" replace />;
    }
    if (user.role === 'STAFF') {
      return <Navigate to="/staff/appointments" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
