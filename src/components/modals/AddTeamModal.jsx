import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import apiService from '../../services/api';

/**
 * Add/Edit Team Modal component
 * Handles team creation and editing with member selection
 */
const AddTeamModal = ({ isOpen, onClose, onSubmit, team = null }) => {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    selectedMembers: team?.members || []
  });

  const [errors, setErrors] = useState({});

  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await apiService.getUsers();
      setAvailableUsers(users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMemberToggle = (userName) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(userName)
        ? prev.selectedMembers.filter(member => member !== userName)
        : [...prev.selectedMembers, userName]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }
    
    // Members are optional for now
    // if (formData.selectedMembers.length === 0) {
    //   newErrors.members = 'Please select at least one member';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name: formData.name,
        description: formData.description,
        members: formData.selectedMembers
      });
      setFormData({
        name: '',
        description: '',
        selectedMembers: []
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={team ? 'Edit Team' : 'Add New Team'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Team Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': '#ffc44d' }}
            placeholder="Enter team description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Team Members <span className="text-gray-500">(optional)</span>
          </label>
          <div className="border border-gray-600 bg-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
            {loadingUsers ? (
              <div className="text-center text-gray-400 py-2">Loading users...</div>
            ) : availableUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-2">No users available</div>
            ) : (
              availableUsers.map(user => (
                <label key={user.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={formData.selectedMembers.includes(user.name)}
                    onChange={() => handleMemberToggle(user.name)}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-2"
                    style={{ '--tw-ring-color': '#ffc44d' }}
                  />
                  <span className="text-sm text-gray-300">{user.name}</span>
                </label>
              ))
            )}
          </div>
          {errors.members && (
            <p className="mt-1 text-sm text-red-400">{errors.members}</p>
          )}
        </div>

        {formData.selectedMembers.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Selected Members:</p>
            <div className="flex flex-wrap gap-2">
              {formData.selectedMembers.map((member, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600"
                >
                  {member}
                </span>
              ))}
            </div>
          </div>
        )}

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
            {team ? 'Update Team' : 'Create Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTeamModal;