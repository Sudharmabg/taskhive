import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/common/StatsCard';
import Button from '../../components/common/Button';
import TaskSummaryTable from '../../components/common/TaskSummaryTable';
import AddStoryModal from '../../components/modals/AddStoryModal';
import { useStories } from '../../hooks/useStories';
import apiService from '../../services/api';
import { 
  ClipboardListIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  PlusIcon,
  UserGroupIcon
} from '@heroicons/react/outline';

/**
 * Dashboard page component
 * Displays overview statistics, quick actions, and task summary
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { stories, loading, createStory, fetchStories } = useStories();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  
  const stats = [
    { 
      title: 'Total Stories', 
      value: stories.length.toString(), 
      icon: ClipboardListIcon, 
      color: 'blue' 
    },
    { 
      title: 'Completed', 
      value: stories.filter(s => s.status === 'Completed').length.toString(), 
      icon: CheckCircleIcon, 
      color: 'green' 
    },
    { 
      title: 'In Progress', 
      value: stories.filter(s => s.status === 'In Progress').length.toString(), 
      icon: ClockIcon, 
      color: 'yellow' 
    },
    { 
      title: 'Pending', 
      value: stories.filter(s => s.status === 'Pending').length.toString(), 
      icon: ExclamationCircleIcon, 
      color: 'red' 
    }
  ];

  const handleAddStory = () => {
    console.log('handleAddStory called, current editingStory:', editingStory);
    setEditingStory(null); // Ensure we're creating, not editing
    console.log('editingStory set to null, opening modal');
    setShowAddModal(true);
  };

  const handleViewTeams = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      navigate('/app/teams');
    }
  };

  const handleStorySubmit = async (storyData) => {
    console.log('Dashboard handleStorySubmit called!');
    try {
      console.log('Dashboard - Original story data:', storyData);
      // Data is already transformed by the modal
      const transformedData = storyData;
      console.log('Dashboard - Transformed story data:', transformedData);
      const result = await createStory(transformedData);
      console.log('Dashboard - Story created successfully:', result);
      setShowAddModal(false);
    } catch (err) {
      console.error('Dashboard - Failed to create story:', err);
    }
  };

  const handleEditStory = (storyId) => {
    const story = stories.find(s => s.id === storyId);
    if (story) {
      setEditingStory(story);
      setShowAddModal(true);
    }
  };

  const handleUpdateStory = async (storyData) => {
    console.log('handleUpdateStory called with data:', storyData);
    try {
      const result = await apiService.updateStory(editingStory.id, storyData);
      console.log('Story updated successfully:', result);
      // Refresh stories list
      await fetchStories();
      setShowAddModal(false);
      setEditingStory(null);
    } catch (err) {
      console.error('Failed to update story:', err);
    }
  };

  const handleDeleteStory = (storyId) => {
    // Navigate to appropriate management page for deletion
    navigate('/app/stories');
  };

  const handleStatusChange = async (storyId, newStatus) => {
    try {
      const story = stories.find(s => s.id === storyId);
      if (story) {
        const updatedStory = {
          ...story,
          status: newStatus,
          progress: newStatus === 'Completed' ? 100 : newStatus === 'In Progress' ? 50 : 0
        };
        await apiService.updateStory(storyId, updatedStory);
        await fetchStories(); // Refresh the stories list
      }
    } catch (err) {
      console.error('Failed to update story status:', err);
      alert('Failed to update story status. Please try again.');
    }
  };

  const handleStatsCardClick = (statType) => {
    // TODO: Filter tasks based on stat type
    console.log('Filter stories by:', statType);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-300">Welcome back! Here's what's happening with your stories.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            onClick={() => handleStatsCardClick(stat.title.toLowerCase())}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleAddStory}
            className="flex items-center px-4 py-2 text-black font-semibold rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#ffc44d' }}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Story
          </button>
          {(() => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.role === 'admin' ? (
              <button
                onClick={handleViewTeams}
                className="flex items-center px-4 py-2 text-black font-semibold rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: '#ffc44d' }}
              >
                <UserGroupIcon className="h-4 w-4 mr-2" />
                View Teams
              </button>
            ) : null;
          })()}
        </div>
      </div>

      {/* Task Summary */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Recent Stories</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-300">Loading stories...</div>
        ) : (
          <TaskSummaryTable
            tasks={stories.slice(0, 5)}
            onEdit={handleEditStory}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* Add Story Modal */}
      {showAddModal && (
        <AddStoryModal
          isOpen={showAddModal}
          onClose={() => {
            console.log('Modal closing, resetting editingStory');
            setShowAddModal(false);
            setEditingStory(null);
          }}
          onSubmit={(data) => {
            console.log('Modal onSubmit called with editingStory:', editingStory);
            if (editingStory) {
              console.log('Calling handleUpdateStory');
              handleUpdateStory(data);
            } else {
              console.log('Calling handleStorySubmit');
              handleStorySubmit(data);
            }
          }}
          story={editingStory}
        />
      )}
    </div>
  );
};

export default Dashboard;