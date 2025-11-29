import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Logo from '../../components/common/Logo';

const PasswordSetupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/auth/validate-token?token=${token}`);
      const data = await response.json();
      
      if (data.valid) {
        setTokenValid(true);
        setUserInfo(data.user);
      }
      setLoading(false);
    } catch (error) {
      console.error('Token validation failed:', error);
      setLoading(false);
    }
  };

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
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const response = await fetch('http://localhost:8080/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: formData.password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Password set successfully! Redirecting to login...');
        navigate('/login');
      } else {
        setErrors({ password: data.message });
      }
    } catch (error) {
      console.error('Password setup failed:', error);
      setErrors({ password: 'Failed to set password. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#ffc44d' }}></div>
          <p className="text-gray-300">Validating setup link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center max-w-md">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Invalid Setup Link</h2>
          <p className="text-gray-300 mb-6">This password setup link is invalid or has expired.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Logo size="md" variant="dark" />
            <h1 className="text-xl font-bold text-white">TaskHive</h1>
          </div>
          <h2 className="text-lg font-semibold text-white">Set Your Password</h2>
          <p className="text-gray-300 text-sm mt-2">Welcome to {userInfo?.company}</p>
        </div>

        <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <p className="text-sm text-gray-300">
            <span className="font-medium">Email:</span> {userInfo?.email}
          </p>
          <p className="text-sm text-gray-300 mt-1">
            <span className="font-medium">Name:</span> {userInfo?.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            placeholder="Enter your new password"
            required
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            placeholder="Confirm your new password"
            required
          />

          <button 
            type="submit" 
            className="w-full text-black font-semibold py-2 px-4 rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#ffc44d' }}
          >
            Set Password & Continue
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Having trouble? Contact your administrator for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordSetupPage;