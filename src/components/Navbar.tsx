import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AudioWaveform, Home, Compass, Sparkles, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const linkClasses = (path: string) => `
    flex items-center space-x-1 px-3 py-2 rounded-md transition-colors
    ${isActive(path) 
      ? 'text-kit-green bg-kit-green-50 font-medium' 
      : 'text-gray-700 hover:text-kit-green hover:bg-gray-50'
    }
  `;

  const handleSignOut = () => {
    signOut();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-kit-green-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <AudioWaveform className="w-6 h-6 text-kit-green" />
            <span className="text-xl font-bold bg-gradient-to-r from-kit-green to-kit-green-600 bg-clip-text text-transparent">
              WinPod
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/" className={linkClasses('/')}>
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link to="/explore" className={linkClasses('/explore')}>
              <Compass className="w-5 h-5" />
              <span>Explore</span>
            </Link>
            {user ? (
              <>
                <Link to="/generate" className={linkClasses('/generate')}>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate</span>
                </Link>
                <Link to="/profile" className={linkClasses('/profile')}>
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-kit-green hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="btn-primary"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-kit-green hover:bg-gray-50"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="text-lg font-semibold text-kit-green">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md text-gray-700 hover:text-kit-green hover:bg-gray-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col p-4 space-y-2">
              <Link
                to="/"
                className={linkClasses('/')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link
                to="/explore"
                className={linkClasses('/explore')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Compass className="w-5 h-5" />
                <span>Explore</span>
              </Link>
              {user ? (
                <>
                  <Link
                    to="/generate"
                    className={linkClasses('/generate')}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Generate</span>
                  </Link>
                  <Link
                    to="/profile"
                    className={linkClasses('/profile')}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-kit-green hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/auth');
                  }}
                  className="btn-primary"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;