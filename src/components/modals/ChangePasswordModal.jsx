import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import apiService from '../../services/api';

const MIN_LENGTH = 8;
const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

/**
 * Lets the signed-in user change their own password.
 * The current password is always required.
 */
const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const close = () => {
    setForm(EMPTY);
    setErrors({});
    setSuccess(false);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name] || errors.form) {
      setErrors(prev => ({ ...prev, [name]: '', form: '' }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password';
    if (form.newPassword.length < MIN_LENGTH) next.newPassword = `Use at least ${MIN_LENGTH} characters`;
    else if (form.newPassword === form.currentPassword) next.newPassword = 'Choose a password different from the current one';
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = "Passwords don't match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await apiService.changePassword(form.currentPassword, form.newPassword);
      setForm(EMPTY);
      setSuccess(true);
    } catch (err) {
      const message = err.message || 'Could not change password';
      if (/current password/i.test(message)) {
        setErrors({ currentPassword: message });
      } else {
        setErrors({ form: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Change Password" size="sm">
      {success ? (
        <div className="space-y-4">
          <p className="text-sm text-green-300">Your password has been updated. Use it the next time you sign in.</p>
          <div className="flex justify-end">
            <Button variant="primary" onClick={close}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={handleChange}
            error={errors.currentPassword}
            required
          />
          <Input
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
            placeholder={`At least ${MIN_LENGTH} characters`}
            required
          />
          <Input
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />
          {errors.form && <p className="text-sm text-red-400">{errors.form}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ChangePasswordModal;
