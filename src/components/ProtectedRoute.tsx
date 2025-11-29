import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRoleType } from '../lib/database.types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRoleType;
  requiredRoles?: UserRoleType[];
}

export function ProtectedRoute({ children, requiredRole, requiredRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check single role
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Check multiple roles
  if (requiredRoles && profile?.role && !requiredRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
