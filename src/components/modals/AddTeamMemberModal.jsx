import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';

/**
 * Add Team Member Modal component
 * Handles adding new team members with employee details
 */
const AddTeamMemberModal = ({ isOpen, onClose, onSubmit, teams = [] }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    designation: '',
    jobRole: '',
    team: ''
  });

  const [errors, setErrors] = useState({});

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
    
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }
    
    if (!formData.jobRole) {
      newErrors.jobRole = 'Please select a job role';
    }
    


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        designation: '',
        jobRole: '',
        team: ''
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Employee ID"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleInputChange}
            error={errors.employeeId}
            placeholder="e.g., EMP001"
            required
          />

          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            placeholder="e.g., John Doe"
            required
          />
        </div>

        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          placeholder="e.g., john.doe@company.com"
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Designation"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            error={errors.designation}
            placeholder="e.g., Software Engineer"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Job Role <span className="text-red-400">*</span>
            </label>
            <select
              name="jobRole"
              value={formData.jobRole}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent ${
                errors.jobRole ? 'border-red-400' : ''
              }`}
              style={{ '--tw-ring-color': errors.jobRole ? '#ef4444' : '#ffc44d' }}
              required
            >
              <option value="">Select job role</option>
              <option value="UI">UI</option>
              <option value="BE">BE</option>
              <option value="QA">QA</option>
              <option value="DevOps">DevOps</option>
            </select>
            {errors.jobRole && (
              <p className="mt-1 text-sm text-red-400">{errors.jobRole}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Team <span className="text-gray-500">(optional)</span>
            </label>
            <select
              name="team"
              value={formData.team}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent ${
                errors.team ? 'border-red-400' : ''
              }`}
              style={{ '--tw-ring-color': errors.team ? '#ef4444' : '#ffc44d' }}
            >
              <option value="">No team (assign later)</option>
              {teams.map((team, index) => (
                <option key={index} value={team.name}>{team.name}</option>
              ))}
            </select>
            {errors.team && (
              <p className="mt-1 text-sm text-red-400">{errors.team}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTeamMemberModal;