import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Logo from '../common/Logo';
import { 
  HomeIcon, 
  ClipboardListIcon, 
  BookOpenIcon,
  CollectionIcon,
  ExclamationIcon,
  UserGroupIcon, 
  CalendarIcon,
  ChartBarIcon,
  LogoutIcon 
} from '@heroicons/react/outline';

/**
 * Sidebar navigation component
 * Provides navigation links and user actions
 */
const Sidebar = () => {
  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'user';
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Tasks', href: '/tasks', icon: ClipboardListIcon },
    { name: 'Epics', href: '/epics', icon: CollectionIcon },
    { name: 'Bugs', href: '/bugs', icon: ExclamationIcon },
    { name: 'Current Sprint', href: '/current-sprint', icon: CalendarIcon }, // All users can view current sprint
    ...(userRole === 'admin' ? [
      { name: 'Teams', href: '/teams', icon: UserGroupIcon },
      { name: 'Sprints', href: '/sprints', icon: CalendarIcon }, // Admin can manage all sprints
      { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    ] : [])
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    window.location.href = '/';
  };



  return (
    <div className="bg-gray-800 w-64 shadow-lg border-r border-gray-700">
      <Link to="/" className="flex items-center justify-center h-16 border-b border-gray-700 space-x-3 hover:bg-gray-700 transition-colors">
        <Logo size="md" variant="dark" />
        <h1 className="text-xl font-bold text-white">TaskHive</h1>
      </Link>
      
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={`/app${item.href}`}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'text-black'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: '#ffc44d' } : {}}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;