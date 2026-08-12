// Root App Router with Protected Routes for Staff, Manager, and Admin
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StaffDashboard from './pages/StaffDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReportsPage from './pages/ReportsPage';

// Auth guard wrapper for protected routes
const ProtectedRoute: React.FC<{
  element: React.ReactElement;
  requiredRole?: string;
}> = ({ element, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080c18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return element;
};

// Returns role-appropriate dashboard route
const getDashboardRoute = (role?: string) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'manager') return '/manager/dashboard';
  return '/staff/dashboard';
};

// Route definitions
const AppRoutes: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={getDashboardRoute(user?.role)} replace />
            : <Login />
        }
      />
      <Route
        path="/staff/dashboard"
        element={<ProtectedRoute element={<StaffDashboard />} requiredRole="staff" />}
      />
      <Route
        path="/manager/dashboard"
        element={<ProtectedRoute element={<ManagerDashboard />} requiredRole="manager" />}
      />
      <Route
        path="/admin/dashboard"
        element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />}
      />
      <Route
        path="/manager/reports"
        element={<ProtectedRoute element={<ReportsPage />} requiredRole="manager" />}
      />
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={getDashboardRoute(user?.role)} replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
