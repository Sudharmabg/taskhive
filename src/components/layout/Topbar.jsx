import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchIcon, LogoutIcon, KeyIcon, XIcon } from '@heroicons/react/outline';
import ChangePasswordModal from '../modals/ChangePasswordModal';

/**
 * Topbar component with search and user profile
 * Displays at the top of authenticated pages
 */
const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const onSearchPage = location.pathname === '/app/search';
  const urlQuery = onSearchPage ? new URLSearchParams(location.search).get('q') || '' : '';

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef(null);

  // Close the profile menu when navigating to another page
  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  // Keep the box in sync with the search page URL (and clear it when leaving)
  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  // Close the profile menu on outside click or Escape
  useEffect(() => {
    if (!showDropdown) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showDropdown]);

  const runSearch = (value) => {
    const q = value.trim();
    if (!q) {
      if (onSearchPage) navigate('/app/search');
      return;
    }
    navigate(`/app/search?q=${encodeURIComponent(q)}`, { replace: onSearchPage });
  };

  // Typing on the results page updates them live (debounced)
  useEffect(() => {
    if (!onSearchPage || searchQuery === urlQuery) return undefined;
    const t = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Signed-in user, saved to localStorage by apiService.login()
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}') || {};
    } catch {
      return {};
    }
  })();
  const displayName = user.name || user.username || 'User';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <header className="bg-gray-800 shadow-sm border-b border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
          <form
            role="search"
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(searchQuery);
            }}
          >
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search epics, tasks and bugs..."
              aria-label="Search epics, tasks and bugs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (onSearchPage) navigate('/app/search', { replace: true });
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* User Info */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowDropdown(open => !open)}
              aria-haspopup="menu"
              aria-expanded={showDropdown}
              className="text-sm font-medium text-gray-300 hover:text-white focus:outline-none"
            >
              {displayName}
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowChangePassword(true);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Change password
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <LogoutIcon className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </header>
  );
};

export default Topbar;