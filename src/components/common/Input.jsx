import React from 'react';

/**
 * Reusable Input component with label and error handling
 * Supports various input types and validation states
 */
const Input = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false,
  error,
  className = '',
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent ${
          error 
            ? 'border-red-400 focus:ring-red-500' 
            : ''
        }`}
        style={{ '--tw-ring-color': error ? '#ef4444' : '#ffc44d' }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Input;