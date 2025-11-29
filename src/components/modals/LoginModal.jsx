import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Logo from '../common/Logo';
import apiService from '../../services/api';

/**
 * Login Modal component
 * Handles user authentication in modal format
 */
const LoginModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Username/Email is required';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    if (validateForm()) {
      try {
        const response = await apiService.login({
          username: formData.email,
          password: formData.password
        });
        
        if (response.success) {
          localStorage.setItem('isAuthenticated', 'true');
          window.location.href = '/app/dashboard';
        } else {
          setErrors({ email: response.message || 'Login failed' });
        }
      } catch (err) {
        setErrors({ email: err.message || 'An error occurred' });
      }
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Logo size="md" variant="dark" />
          <h1 className="text-xl font-bold text-white">TaskHive</h1>
        </div>
        <h2 className="text-lg font-semibold text-white">Welcome back</h2>
        <p className="text-gray-300 text-sm">Enter your credentials to access your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username/Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          placeholder="Enter username or email"
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          placeholder="Enter your password"
          required
        />

        <button 
          type="submit" 
          disabled={loading}
          className="w-full text-black font-semibold py-2 px-4 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#ffc44d' }}
        >
          {loading ? 'Please wait...' : 'Sign In'}
        </button>
      </form>
    </Modal>
  );
};

export default LoginModal;