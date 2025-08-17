import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { LecturerDashboard } from './pages/lecturer/Dashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'lecturer' }) {
  const { user, profile, loading } = useAuth();

  console.log('ProtectedRoute check:', { user: user?.email, profile: profile?.role, loading, requiredRole });

  if (loading) {
    console.log('ProtectedRoute: Still loading...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    console.log('No user or profile, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    console.log('Role mismatch, redirecting:', { userRole: profile.role, requiredRole });
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  console.log('Access granted to protected route');
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login type="lecturer" />} />
      <Route path="/register" element={<Register type="lecturer" />} />
      <Route path="/admin/login" element={<Login type="admin" />} />
      <Route path="/admin/register" element={<Register type="admin" />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="lecturer">
            <Layout>
              <LecturerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;