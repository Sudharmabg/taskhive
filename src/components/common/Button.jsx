import React from 'react';

/**
 * Reusable Button component with different variants and sizes
 * Supports primary, secondary, and danger variants
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'text-black font-semibold hover:opacity-90 disabled:opacity-50',
    secondary: 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white disabled:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    outline: 'border border-gray-600 bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white'
  };

  const primaryStyle = variant === 'primary' ? { backgroundColor: '#ffc44d' } : {};

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      style={primaryStyle}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;