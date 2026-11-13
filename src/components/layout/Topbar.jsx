import React, { useState } from 'react';
import { SearchIcon, LogoutIcon } from '@heroicons/react/outline';

/**
 * Topbar component with search and user profile
 * Displays at the top of authenticated pages
 */
const Topbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // TODO: Replace with actual user data
  const user = {
    name: 'John Doe',
    avatar: 'https://via.placeholder.com/32'
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <header className="bg-gray-800 shadow-sm border-b border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* User Info */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-sm font-medium text-gray-300 hover:text-white focus:outline-none"
            >
              {user.name}
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
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
    </header>
  );
};

export default Topbar;