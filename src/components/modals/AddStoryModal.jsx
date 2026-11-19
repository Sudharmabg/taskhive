import React, { useState, useEffect, useMemo } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import apiService from '../../services/api';
import AttachmentsSection from '../common/AttachmentsSection';
import SubtasksSection from '../common/SubtasksSection';


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
    epicId: story?.epicId ?? '',
    teamId: story?.teamId ?? '',
  });

  // Only admins choose the owning team; everyone else's items go to their own team
  const isAdmin = apiService.getCurrentUser().role === 'admin';
  const [teams, setTeams] = useState([]);

  const [pendingFiles, setPendingFiles] = useState([]);
  const [pendingSubtasks, setPendingSubtasks] = useState([]);
  const [epics, setEpics] = useState([]);
  // Epics are assigned to the whole team, so they have no individual assignees
  const isEpic = (defaultType || formData.type || '').toLowerCase() === 'epic';
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Every word must appear in the name, job role, designation or email
  const matchingUsers = useMemo(() => {
    const words = memberSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return users;
    return users.filter(u => {
      const text = `${u.name || ''} ${u.jobRole || ''} ${u.designation || ''} ${u.email || ''}`.toLowerCase();
      return words.every(w => text.includes(w));
    });
  }, [users, memberSearch]);

  const toggleAssignee = (name) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(name)
        ? prev.assignedTo.filter(n => n !== name)
        : [...prev.assignedTo, name]
    }));
    if (errors.assignedTo) setErrors(prev => ({ ...prev, assignedTo: '' }));
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Tasks and Bugs can be linked to an epic
  useEffect(() => {
    if (!isOpen || isEpic) return;
    apiService.getStories()
      .then(data => setEpics((data || []).filter(s => (s.type || '').toLowerCase() === 'epic')))
      .catch(err => {
        console.error('Failed to fetch epics:', err);
        setEpics([]);
      });
  }, [isOpen, isEpic]);

  useEffect(() => {
    if (!isOpen || !isAdmin) return;
    apiService.getTeams()
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to fetch teams:', err);
        setTeams([]);
      });
  }, [isOpen, isAdmin]);

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
    
    if (!isEpic && formData.assignedTo.length === 0) {
      newErrors.assignedTo = 'Please assign the story to at least one person';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    console.log('Form submitted, starting validation...');

    if (validateForm()) {
      console.log('Validation passed, preparing data...');
      // Send values as-is to match database constraints
      const submitData = {
        ...formData,
        assigneeName: isEpic ? 'Whole Team' : formData.assignedTo.join(', '), // Join multiple users with comma
        assignedTo: undefined, // Remove assignedTo array
        priority: formData.priority || null,
        status: formData.status || null,
        epicId: isEpic || formData.epicId === '' ? null : Number(formData.epicId),
        teamId: formData.teamId === '' ? null : Number(formData.teamId),
        newAttachments: pendingFiles, // uploaded after the story is saved
        newSubtasks: isEpic ? [] : pendingSubtasks // created after the story is saved
      };
      console.log('Calling onSubmit with data:', submitData);
      // Keep what was typed if the save fails, and say why
      setSaving(true);
      setSaveError('');
      try {
        await onSubmit(submitData);
      } catch (err) {
        setSaveError(err?.message || 'Could not save. Please try again.');
        return;
      } finally {
        setSaving(false);
      }
      setFormData({
        title: '',
        description: '',
        type: defaultType || 'Task',
        assignedTo: [],
        deadline: '',
        priority: 'Medium',
        status: 'Pending',
        storyPoints: '',
        acceptanceCriteria: '',
        epicId: '',
        teamId: ''
      });
      setPendingFiles([]);
      setPendingSubtasks([]);
      setMemberSearch('');
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
            maxLength={200}
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
          {!isEpic && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Assign To <span className="text-red-400">*</span>
            </label>
            <input
              type="search"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              onKeyDown={(e) => {
                // Enter picks the only match instead of submitting the form
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (matchingUsers.length === 1) {
                    toggleAssignee(matchingUsers[0].name);
                    setMemberSearch('');
                  }
                }
              }}
              placeholder="Search by name, role or email..."
              aria-label="Search members to assign"
              className="w-full mb-2 px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:border-transparent text-sm"
              style={{ '--tw-ring-color': '#ffc44d' }}
            />
            <div className="border border-gray-600 bg-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
              {loadingUsers ? (
                <div className="text-center text-gray-400 py-2">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center text-gray-400 py-2">No users available</div>
              ) : matchingUsers.length === 0 ? (
                <div className="text-center text-gray-400 py-2">No one matches "{memberSearch.trim()}"</div>
              ) : (
                matchingUsers.map(user => (
                <label key={user.id} className="flex items-center space-x-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assignedTo.includes(user.name)}
                    onChange={() => toggleAssignee(user.name)}
                    className="rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-2"
                    style={{ '--tw-ring-color': '#ffc44d' }}
                  />
                  <div className="flex items-center justify-between flex-1 min-w-0 gap-2">
                    <span className="text-sm text-gray-300 truncate">{user.name}</span>
                    {user.jobRole && (
                      <span className="text-xs px-2 py-1 rounded text-black font-medium shrink-0" style={{ backgroundColor: '#ffc44d' }}>
                        {user.jobRole}
                      </span>
                    )}
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
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-300">Assigned to ({formData.assignedTo.length}):</p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, assignedTo: [] }))}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.assignedTo.map((name) => {
                    const user = users.find(u => u.name === name);
                    return (
                      <span
                        key={name}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600"
                      >
                        <span>{name}</span>
                        {user?.jobRole && (
                          <span className="px-1 py-0.5 rounded text-black" style={{ backgroundColor: '#ffc44d' }}>
                            {user.jobRole}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleAssignee(name)}
                          className="ml-1 text-gray-400 hover:text-white"
                          aria-label={`Remove ${name}`}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}

          <Input
            label="Story Points"
            name="storyPoints"
            type="number"
            min="0"
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

        {isAdmin && (
          <div>
            <label htmlFor="story-team" className="block text-sm font-medium text-gray-300 mb-1">
              Team
            </label>
            <select
              id="story-team"
              name="teamId"
              value={formData.teamId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
            >
              <option value="">{isEpic ? 'No team' : 'No team (uses the epic\'s team if linked)'}</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Only members of this team (and admins) can see it.</p>
          </div>
        )}

        {!isEpic && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Epic
            </label>
            <select
              name="epicId"
              value={formData.epicId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
            >
              <option value="">No epic</option>
              {epics.map(epic => (
                <option key={epic.id} value={epic.id}>
                  {epic.storyId ? `${epic.storyId} – ` : ''}{epic.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isEpic && (
          <SubtasksSection
            storyId={story?.id}
            editable
            pendingSubtasks={pendingSubtasks}
            onPendingSubtasksChange={setPendingSubtasks}
          />
        )}

        <AttachmentsSection
          storyId={story?.id}
          editable
          pendingFiles={pendingFiles}
          onPendingFilesChange={setPendingFiles}
        />

        {saveError && (
          <p className="text-sm text-red-400" role="alert">{saveError}</p>
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
            disabled={saving}
          >
            {saving ? 'Saving...' : getButtonText()}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddStoryModal;