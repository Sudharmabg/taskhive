import React, { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import TaskSummaryTable from '../../components/common/TaskSummaryTable';
import AddStoryModal from '../../components/modals/AddStoryModal';
import { generateStoryId } from '../../utils/storyUtils';
import { PlusIcon } from '@heroicons/react/outline';
import { useStories } from '../../hooks/useStories';

/**
 * Epic Management page component
 * Handles epic story listing, filtering, and CRUD operations for Epics only
 */
const EpicManagement = () => {
  const { stories: epics, loading, error, createStory, updateStory, deleteStory } = useStories('Epic');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEpic, setEditingEpic] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    priority: 'All',
    search: ''
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleAddEpic = async (storyData) => {
    try {
      const newStory = {
        ...storyData,
        type: 'Epic',
        status: storyData.status || 'Pending',
        progress: 0
      };
      await createStory(newStory);
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to create epic:', err);
    }
  };

  const handleEditEpic = (epicId) => {
    const epic = epics.find(e => e.id === epicId);
    setEditingEpic(epic);
    setShowAddModal(true);
  };

  const handleUpdateEpic = async (storyData) => {
    try {
      await updateStory(editingEpic.id, { ...storyData, type: 'EPIC' });
      setShowAddModal(false);
      setEditingEpic(null);
    } catch (err) {
      console.error('Failed to update epic:', err);
    }
  };

  const handleDeleteEpic = async (epicId) => {
    if (window.confirm('Are you sure you want to delete this epic?')) {
      try {
        await deleteStory(epicId);
      } catch (err) {
        console.error('Failed to delete epic:', err);
      }
    }
  };

  const handleStatusChange = async (epicId, newStatus) => {
    try {
      const epic = epics.find(e => e.id === epicId);
      if (epic) {
        const updatedEpic = {
          ...epic,
          status: newStatus,
          progress: newStatus === 'Completed' ? 100 : newStatus === 'In Progress' ? 50 : 0
        };
        await updateStory(epicId, updatedEpic);
      }
    } catch (err) {
      console.error('Failed to update epic status:', err);
      alert('Failed to update epic status. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Epic Management</h1>
          <p className="text-gray-300">Manage and organize your epic stories</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Epic Story
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
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
              label="Search Epics"
              name="search"
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by title or assignee..."
            />
          </div>
        </div>
      </div>

      {/* Epics Table */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Epic Stories</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-300">Loading epics...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-400">Error: {error}</div>
        ) : (
          <TaskSummaryTable
            tasks={epics}
            onEdit={handleEditEpic}
            onStatusChange={handleStatusChange}
            tableType="Epic"
          />
        )}
      </div>

      {/* Add/Edit Epic Story Modal */}
      {showAddModal && (
        <AddStoryModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingEpic(null);
          }}
          onSubmit={editingEpic ? handleUpdateEpic : handleAddEpic}
          story={editingEpic}
          defaultType="Epic"
        />
      )}
    </div>
  );
};

export default EpicManagement;