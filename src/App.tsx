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

  console.log('🛡️ PROTECTED ROUTE CHECK:', {
    hasUser: !!user,
    userEmail: user?.email,
    hasProfile: !!profile,
    profileRole: profile?.role,
    loading,
    requiredRole
  });

  if (loading) {
    console.log('⏳ PROTECTED ROUTE: Loading auth state...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    console.log('🚫 PROTECTED ROUTE: Access denied - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    console.log('🔀 PROTECTED ROUTE: Role mismatch, redirecting to correct dashboard');
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  console.log('✅ PROTECTED ROUTE: Access granted');
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