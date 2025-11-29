import React from 'react';

/**
 * TaskHive Logo component with TH initials
 * Displays brand logo with customizable size
 */
const Logo = ({ size = 'md', className = '', variant = 'default' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const variants = {
    default: 'bg-gradient-to-br from-blue-500 to-blue-700',
    dark: 'bg-gradient-to-br from-yellow-400 to-yellow-600'
  };

  const customStyle = variant === 'dark' ? { background: 'linear-gradient(135deg, #ffc44d, #ffb020)' } : {};

  return (
    <div 
      className={`${sizes[size]} ${variants[variant]} rounded-lg flex items-center justify-center text-white font-bold shadow-sm ${className}`}
      style={customStyle}
    >
      TH
    </div>
  );
};

export default Logo;