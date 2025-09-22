import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      // Wait for the signOut to complete before navigating
      await signOut();
      // Navigate to home page after successful sign out
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      // Still navigate on error to prevent being stuck
      navigate('/', { replace: true });
    }
    // Close mobile menu after sign out
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">EduAI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link
                  to={profile?.role === 'admin' ? '/admin' : '/dashboard'}
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {profile?.full_name}
                  </span>
                  <div className="relative group">
                    <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
                      <User className="h-5 w-5" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/admin/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Admin Login
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-blue-600 transition-colors p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {user ? (
                <>
                  {/* User greeting */}
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">
                      Welcome, {profile?.full_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {profile?.role}
                    </p>
                  </div>
                  
                  {/* Dashboard Link */}
                  <Link
                    to={profile?.role === 'admin' ? '/admin' : '/dashboard'}
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors rounded-md"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors rounded-md"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  {/* Sign In Link */}
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors rounded-md"
                    onClick={closeMobileMenu}
                  >
                    Sign In
                  </Link>
                  
                  {/* Admin Login Link */}
                  <Link
                    to="/admin/login"
                    className="block px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-md mx-3"
                    onClick={closeMobileMenu}
                  >
                    Admin Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}