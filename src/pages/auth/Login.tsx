import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  type: 'lecturer' | 'admin';
}

export function Login({ type }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Redirect if already authenticated
  useEffect(() => {
    // No automatic redirects - users must explicitly log in
  }, [user, profile, authLoading, navigate]);

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setToastType('success');
    setShowToast(true);
  };

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setToastType('error');
    setShowToast(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Attempting login for:', email);
      const { user, profile } = await signIn(email, password);
      console.log('✅ Login successful:', { email: user.email, role: profile.role });
      
      // Show success toast
      showSuccessToast(`Welcome back! Logged in as ${profile.role}`);

      // Navigate after a short delay to show the toast
      setTimeout(() => {
        if (profile.role === 'admin') {
          console.log('🏢 Navigating to admin dashboard');
          navigate('/admin', { replace: true });
        } else if (profile.role === 'lecturer') {
          console.log('👨‍🏫 Navigating to lecturer dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.error('❓ Unknown user role:', profile.role);
          setError('Invalid user role. Please contact administrator.');
        }
      }, 1000);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      let errorMessage = '';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account before signing in.';
      } else {
        errorMessage = error.message || 'Login failed. Please try again.';
      }
      
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading if auth is still initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Toast notification */}
      {showToast && (
        <div 
          className="fixed top-4 right-4 z-50 animate-slide-in"
          style={{
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div className={`${
            toastType === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          } border rounded-lg shadow-lg p-4 flex items-center space-x-3 min-w-[300px] max-w-md`}>
            {toastType === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={`${
              toastType === 'success' ? 'text-green-800' : 'text-red-800'
            } flex-1 font-medium`}>
              {toastMessage}
            </span>
            <button
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {type === 'admin' ? 'Admin' : 'Lecturer'} Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your {type === 'admin' ? 'administrative' : 'teaching'} dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-500"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-500"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              {type === 'lecturer' ? (
                <Link
                  to="/admin/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Admin Login
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Lecturer Login
                </Link>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
