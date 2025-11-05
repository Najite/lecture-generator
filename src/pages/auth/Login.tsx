import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, AlertCircle, CheckCircle, X, XCircle } from 'lucide-react';
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
  const [isExiting, setIsExiting] = useState(false);
  
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        handleCloseToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Redirect if already authenticated
  useEffect(() => {
    // No automatic redirects - users must explicitly log in
  }, [user, profile, authLoading, navigate]);

  const handleCloseToast = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowToast(false);
      setIsExiting(false);
    }, 300);
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setToastType('success');
    setShowToast(true);
    setIsExiting(false);
  };

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setToastType('error');
    setShowToast(true);
    setIsExiting(false);
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
      const roleName = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
      showSuccessToast('Login successful');

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
      }, 1500);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      let errorMessage = '';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid credentials. Please try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before signing in.';
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
      {/* Enhanced Toast notification */}
      {showToast && (
        <div 
          className={`fixed top-6 right-6 z-50 ${isExiting ? 'toast-exit' : 'toast-enter'}`}
        >
          <div className={`
            ${toastType === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-green-100' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 shadow-red-100'
            } 
            border-2 rounded-xl shadow-xl p-4 flex items-start space-x-3 min-w-[320px] max-w-md
            backdrop-blur-sm transition-all duration-300
          `}>
            <div className={`
              ${toastType === 'success' ? 'bg-green-100' : 'bg-red-100'}
              rounded-full p-1.5 flex-shrink-0
            `}>
              {toastType === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" strokeWidth={2.5} />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" strokeWidth={2.5} />
              )}
            </div>
            
            <div className="flex-1 pt-0.5">
              <p className={`
                ${toastType === 'success' ? 'text-green-900' : 'text-red-900'}
                font-semibold text-sm leading-tight
              `}>
                {toastType === 'success' ? 'Success!' : 'Error'}
              </p>
              <p className={`
                ${toastType === 'success' ? 'text-green-800' : 'text-red-800'}
                text-sm mt-0.5
              `}>
                {toastMessage}
              </p>
            </div>
            
            <button
              onClick={handleCloseToast}
              className={`
                ${toastType === 'success' 
                  ? 'text-green-400 hover:text-green-600 hover:bg-green-100' 
                  : 'text-red-400 hover:text-red-600 hover:bg-red-100'
                }
                rounded-lg p-1 transition-all duration-200 flex-shrink-0
              `}
              aria-label="Close notification"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className={`
            ${toastType === 'success' ? 'bg-green-200' : 'bg-red-200'}
            h-1 rounded-b-xl overflow-hidden
          `}>
            <div 
              className={`
                ${toastType === 'success' ? 'bg-green-500' : 'bg-red-500'}
                h-full progress-bar
              `}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(120%);
            opacity: 0;
          }
        }
        
        @keyframes progressBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .toast-enter {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .toast-exit {
          animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 1, 1);
        }
        
        .progress-bar {
          animation: progressBar 4s linear;
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
