import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/outline';
import Button from '../../components/common/Button';
import TaskDetailsModal from '../../components/modals/TaskDetailsModal';
import AddStoryModal from '../../components/modals/AddStoryModal';
import { useSprint } from '../../hooks/useSprints';
import apiService from '../../services/api';

const SprintDetailPage = () => {
  const { sprintId } = useParams();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const isCurrentSprintRoute = location === '/app/current-sprint';

  // Use the custom hook for API integration
  const targetSprintId = isCurrentSprintRoute ? 'current' : sprintId;
  const {
    sprint,
    stories: sprintStories,
    availableStories,
    loading,
    error,
    addStoryToSprint,
    removeStoryFromSprint,
    updateStory
  } = useSprint(targetSprintId);
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedStory, setSelectedStory] = useState(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);

  // Get unique assignees and types for filter options
  const uniqueAssignees = [...new Set(availableStories.map(story => story.assignee))];
  const uniqueTypes = [...new Set(availableStories.map(story => story.type))];

  const handleAddStoryToSprint = async (storyId) => {
    try {
      await addStoryToSprint(storyId);
    } catch (err) {
      console.error('Failed to add story to sprint:', err);
    }
  };

  const handleRemoveStoryFromSprint = async (storyId) => {
    try {
      await removeStoryFromSprint(storyId);
    } catch (err) {
      console.error('Failed to remove story from sprint:', err);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'Epic': 'bg-purple-900 text-purple-300',
      'Task': 'bg-blue-900 text-blue-300',
      'Bug': 'bg-red-900 text-red-300'
    };
    return colors[type] || 'bg-gray-700 text-gray-300';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-900 text-green-300',
      'Planning': 'bg-blue-900 text-blue-300',
      'Completed': 'bg-gray-700 text-gray-300'
    };
    return colors[status] || 'bg-gray-700 text-gray-300';
  };

  const handleStoryClick = (story) => {
    setSelectedStory({
      ...story,
      description: `Detailed description for ${story.title}`,
      acceptanceCriteria: 'Story acceptance criteria here',
      deadline: '2024-02-15',
      status: story.progress === 100 ? 'Completed' : story.progress > 0 ? 'In Progress' : 'Pending',
      priority: 'High',
      storyPoints: 5,
      attachments: []
    });
    setShowStoryModal(true);
  };

  const handleStartSprint = async () => {
    console.log('Starting sprint:', sprint.id);
    try {
      const updatedSprint = await apiService.updateSprint(sprint.id, { ...sprint, status: 'ACTIVE' });
      console.log('Sprint started successfully:', updatedSprint);
      navigate('/app/current-sprint');
    } catch (err) {
      console.error('Failed to start sprint:', err);
    }
  };

  const handleCloseSprint = async () => {
    if (window.confirm('Are you sure you want to close this sprint? This action cannot be undone.')) {
      try {
        await apiService.closeSprint(sprint.id);
        navigate('/app/sprints');
      } catch (err) {
        console.error('Failed to close sprint:', err);
      }
    }
  };

  const handleViewCurrentSprint = () => {
    navigate('/app/current-sprint');
  };

  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-white">Loading sprint...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
        <p className="text-gray-300 mb-4">{error}</p>
        <Button onClick={() => navigate('/app/sprints')}>
          Back to Sprints
        </Button>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Sprint Not Found</h2>
        <Button onClick={() => navigate('/app/sprints')}>
          Back to Sprints
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/sprints')}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{sprint.name}</h1>
            <p className="text-gray-400 mt-1">{sprint.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={handleViewCurrentSprint}
              className="text-sm"
            >
              View Current Sprint
            </Button>
          )}
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(sprint.status)}`}>
            {sprint.status}
          </span>
          {(sprint.status === 'Planning' || sprint.status === 'PLANNING') && isAdmin && (
            <Button
              variant="primary"
              onClick={handleStartSprint}
              className="text-sm"
            >
              Start Sprint
            </Button>
          )}
          {sprint.status === 'Active' && isAdmin && (
            <Button
              variant="danger"
              onClick={handleCloseSprint}
              className="text-sm"
            >
              Close Sprint
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center text-gray-300 mb-2">
            <CalendarIcon className="h-5 w-5 mr-2" />
            <span className="font-medium">Duration</span>
          </div>
          <div className="text-white">
            <div className="text-sm">{sprint.startDate} - {sprint.endDate}</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-300 mb-2 font-medium">Stories</div>
          <div className="text-2xl font-bold text-white">{sprintStories.length}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-300 mb-2 font-medium">Progress</div>
          <div className="text-2xl font-bold text-white mb-2">{sprint.progress}%</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${sprint.progress}%`, backgroundColor: '#ffc44d' }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Sprint Backlog</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sprintStories.map(story => (
              <div key={story.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div 
                      className="font-medium text-white hover:text-yellow-400 cursor-pointer transition-colors"
                      onClick={() => handleStoryClick(story)}
                    >
                      {story.title}
                    </div>
                    <div className="text-sm text-gray-400">{story.assigneeName || 'Unassigned'}</div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveStoryFromSprint(story.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(story.type)}`}>
                    {story.type}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-600 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full"
                        style={{ width: `${story.progress}%`, backgroundColor: '#ffc44d' }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400">{story.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Available Stories</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="bg-gray-700 text-gray-300 text-sm rounded px-3 py-2 border border-gray-600"
              >
                <option value="">All Assignees</option>
                {uniqueAssignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-700 text-gray-300 text-sm rounded px-3 py-2 border border-gray-600"
              >
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {availableStories
              .filter(story => !sprintStories.some(s => s.id === story.id))
              .filter(story => !filterAssignee || story.assignee === filterAssignee)
              .filter(story => !filterType || story.type === filterType)
              .map(story => (
                <div key={story.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div 
                        className="font-medium text-white hover:text-yellow-400 cursor-pointer transition-colors"
                        onClick={() => handleStoryClick(story)}
                      >
                        {story.title}
                      </div>
                      <div className="text-sm text-gray-400">{story.assigneeName || 'Unassigned'}</div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleAddStoryToSprint(story.id)}
                        className="flex items-center text-sm text-yellow-400 hover:text-yellow-300"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(story.type)}`}>
                      {story.type}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full"
                          style={{ width: `${story.progress}%`, backgroundColor: '#ffc44d' }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{story.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Story Details Modal */}
      {showStoryModal && selectedStory && (
        <TaskDetailsModal
          isOpen={showStoryModal}
          task={selectedStory}
          onClose={() => {
            setShowStoryModal(false);
            setSelectedStory(null);
          }}
          onEdit={(storyId) => {
            if (isAdmin) {
              setEditingStory(selectedStory);
              setShowStoryModal(false);
              setShowEditModal(true);
            } else {
              // For regular users, navigate to appropriate management page
              const routeMap = {
                'Epic': '/app/epics',
                'Task': '/app/tasks',
                'Bug': '/app/bugs'
              };
              const targetRoute = routeMap[selectedStory.type] || '/app/tasks';
              navigate(targetRoute);
            }
          }}
        />
      )}

      {/* Edit Story Modal */}
      {showEditModal && editingStory && (
        <AddStoryModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingStory(null);
          }}
          onSubmit={async (updatedStory) => {
            try {
              await updateStory(editingStory.id, updatedStory);
              setShowEditModal(false);
              setEditingStory(null);
            } catch (err) {
              console.error('Failed to update story:', err);
            }
          }}
          story={editingStory}
          defaultType={editingStory.type}
        />
      )}
    </div>
  );
};

export default SprintDetailPage;