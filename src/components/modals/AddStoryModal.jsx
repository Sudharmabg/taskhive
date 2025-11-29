import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import apiService from '../../services/api';


/**
 * Add/Edit Story Modal component
 * Handles story creation and editing with type selection (Epic/Task/Bug)
 */
const AddStoryModal = ({ isOpen, onClose, onSubmit, story = null, defaultType = null }) => {
  const getModalTitle = () => {
    const type = defaultType || story?.type || 'Story';
    return story ? `Edit ${type}` : `Add New ${type}`;
  };

  const getButtonText = () => {
    const type = defaultType || story?.type || 'Story';
    return story ? `Update ${type}` : `Create ${type}`;
  };
  const [formData, setFormData] = useState({
    title: story?.title || '',
    description: story?.description || '',
    type: story?.type || defaultType || 'Task',
    assignedTo: story?.assigneeName ? story.assigneeName.split(', ').map(name => name.trim()) : [],
    deadline: story?.deadline || '',
    priority: story?.priority || '',
    status: story?.status || 'Pending',
    storyPoints: story?.storyPoints || '',
    acceptanceCriteria: story?.acceptanceCriteria || '',

  });

  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const userData = await apiService.getUsers();
      setUsers(userData);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
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
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };



  const validateForm = () => {
    const newErrors = {};
    
    console.log('Validating form data:', formData);
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.assignedTo.length === 0) {
      newErrors.assignedTo = 'Please assign the story to at least one person';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted, starting validation...');
    
    if (validateForm()) {
      console.log('Validation passed, preparing data...');
      // Send values as-is to match database constraints
      const submitData = {
        ...formData,
        assigneeName: formData.assignedTo.join(', '), // Join multiple users with comma
        assignedTo: undefined, // Remove assignedTo array
        priority: formData.priority || null,
        status: formData.status || null
      };
      console.log('Calling onSubmit with data:', submitData);
      onSubmit(submitData);
      setFormData({
        title: '',
        description: '',
        type: defaultType || 'Task',
        assignedTo: [],
        deadline: '',
        priority: 'Medium',
        status: 'Pending',
        storyPoints: '',
        acceptanceCriteria: ''
      });
    } else {
      console.log('Validation failed, form not submitted');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Story Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            error={errors.title}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Story Type <span className="text-red-400">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
              disabled={defaultType !== null}
            >
              <option value="Epic">Epic</option>
              <option value="Task">Task</option>
              <option value="Bug">Bug</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': '#ffc44d' }}
            placeholder="Story description..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Assign To <span className="text-red-400">*</span>
            </label>
            <div className="border border-gray-600 bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
              {loadingUsers ? (
                <div className="text-center text-gray-400 py-2">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center text-gray-400 py-2">No users available</div>
              ) : (
                users.map(user => (
                <label key={user.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={formData.assignedTo.includes(user.name)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        assignedTo: isChecked 
                          ? [...prev.assignedTo, user.name]
                          : prev.assignedTo.filter(name => name !== user.name)
                      }));
                    }}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-2"
                    style={{ '--tw-ring-color': '#ffc44d' }}
                  />
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm text-gray-300">{user.name}</span>
                    <span className="text-xs px-2 py-1 rounded text-black font-medium" style={{ backgroundColor: '#ffc44d' }}>
                      {user.jobRole}
                    </span>
                  </div>
                </label>
                ))
              )}
            </div>
            {errors.assignedTo && (
              <p className="mt-1 text-sm text-red-400">{errors.assignedTo}</p>
            )}
            {formData.assignedTo.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-300 mb-1">Assigned to:</p>
                <div className="flex flex-wrap gap-1">
                  {formData.assignedTo.map((name, index) => {
                    const user = users.find(u => u.name === name);
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600"
                      >
                        <span>{name}</span>
                        {user && (
                          <span className="px-1 py-0.5 rounded text-black" style={{ backgroundColor: '#ffc44d' }}>
                            {user.jobRole}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Input
            label="Story Points"
            name="storyPoints"
            type="number"
            value={formData.storyPoints}
            onChange={handleInputChange}
            placeholder="e.g., 5"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Deadline"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleInputChange}
            error={errors.deadline}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
            >
              <option value="">Select Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
            >
              <option value="">Select Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Acceptance Criteria
          </label>
          <textarea
            name="acceptanceCriteria"
            value={formData.acceptanceCriteria}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': '#ffc44d' }}
            placeholder="Define what needs to be done for this story to be considered complete..."
          />
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
            {getButtonText()}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddStoryModal;