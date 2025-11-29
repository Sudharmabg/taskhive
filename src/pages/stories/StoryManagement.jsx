import React, { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import TaskSummaryTable from '../../components/common/TaskSummaryTable';
import AddStoryModal from '../../components/modals/AddStoryModal';
import { PlusIcon } from '@heroicons/react/outline';

/**
 * Story Management page component
 * Handles story listing, filtering, and CRUD operations for Epics/Tasks/Bugs
 */
const StoryManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    type: 'All',
    status: 'All',
    priority: 'All',
    search: ''
  });

  // TODO: Replace with actual stories from API
  const [stories, setStories] = useState([
    {
      id: 1,
      title: 'User Authentication System',
      assignedTo: 'John Doe',
      priority: 'High',
      deadline: '2024-01-25',
      status: 'In Progress',
      type: 'Epic',
      description: 'Implement complete user authentication system with login, registration, and password reset.',
      createdDate: '2024-01-08',
      progress: 60,
      storyPoints: 13,
      acceptanceCriteria: 'Users can register, login, logout, and reset passwords securely.'
    },
    {
      id: 2,
      title: 'Login form validation bug',
      assignedTo: 'Jane Smith',
      priority: 'Critical',
      deadline: '2024-01-15',
      status: 'Pending',
      type: 'Bug',
      description: 'Login form accepts invalid email formats and shows incorrect error messages.',
      createdDate: '2024-01-10',
      progress: 0,
      storyPoints: 3,
      acceptanceCriteria: 'Form validates email format and shows appropriate error messages.'
    },
    {
      id: 3,
      title: 'Add user profile page',
      assignedTo: 'Mike Johnson',
      priority: 'Medium',
      deadline: '2024-01-20',
      status: 'Completed',
      type: 'Task',
      description: 'Create user profile page where users can view and edit their information.',
      createdDate: '2024-01-05',
      progress: 100,
      storyPoints: 5,
      acceptanceCriteria: 'Users can view and update their profile information successfully.'
    }
  ]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleAddStory = (storyData) => {
    // TODO: Implement API call to add story
    console.log('Adding story:', storyData);
    setShowAddModal(false);
  };

  const handleEditStory = (storyId) => {
    // TODO: Open edit modal with story data
    console.log('Edit story:', storyId);
  };

  const handleDeleteStory = (storyId) => {
    // TODO: Show confirmation and delete story
    console.log('Delete story:', storyId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Story Management</h1>
          <p className="text-gray-600">Manage epics, tasks, and bugs</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Story
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Types</option>
              <option value="Epic">Epic</option>
              <option value="Task">Task</option>
              <option value="Bug">Bug</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <Input
              label="Search Stories"
              name="search"
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by title or assignee..."
            />
          </div>
        </div>
      </div>

      {/* Stories Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Stories</h2>
        </div>
        <TaskSummaryTable
          tasks={stories}
          onEdit={handleEditStory}
          onDelete={handleDeleteStory}
          tableType="Story"
        />
      </div>

      {/* Add Story Modal */}
      {showAddModal && (
        <AddStoryModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddStory}
        />
      )}
    </div>
  );
};

export default StoryManagement;