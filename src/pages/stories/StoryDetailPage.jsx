import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { parseStoryId } from '../../utils/storyUtils';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/outline';

/**
 * Individual Story Detail Page
 * Displays full story information with direct URL access
 */
const StoryDetailPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const mockStory = {
      id: storyId,
      title: `Sample Story ${storyId}`,
      description: 'This is a detailed description of the story with all relevant information.',
      assignedTo: 'John Doe',
      priority: 'High',
      deadline: '2024-01-15',
      status: 'In Progress',
      type: parseStoryId(storyId)?.type || 'Task',
      createdDate: '2024-01-08',
      progress: 65,
      storyPoints: 5,
      acceptanceCriteria: 'Story should be completed according to specifications.'
    };
    
    setStory(mockStory);
    setLoading(false);
  }, [storyId]);

  const handleEdit = () => {
    const storyInfo = parseStoryId(storyId);
    if (storyInfo) {
      const typeRoutes = {
        Epic: 'epics',
        Task: 'tasks',
        Bug: 'bugs'
      };
      navigate(`/app/${typeRoutes[storyInfo.type]}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-300">Loading story...</div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-300">Story not found</div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'text-red-300 bg-red-900',
      'High': 'text-orange-300 bg-orange-900',
      'Medium': 'text-yellow-300 bg-yellow-900',
      'Low': 'text-green-300 bg-green-900'
    };
    return colors[priority] || 'text-gray-300 bg-gray-700';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Completed': 'text-green-300 bg-green-900',
      'In Progress': 'text-blue-300 bg-blue-900',
      'Pending': 'text-yellow-300 bg-yellow-900',
      'Overdue': 'text-red-300 bg-red-900'
    };
    return colors[status] || 'text-gray-300 bg-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{story.title}</h1>
            <p className="text-gray-400">{story.type} ID: {story.id}</p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleEdit}
          className="flex items-center"
        >
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit {story.type}
        </Button>
      </div>

      {/* Story Details Section */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Story Details</h2>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(story.priority)}`}>
            {story.priority} Priority
          </span>
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <label className="text-sm font-medium text-gray-400">Type</label>
            <div className="mt-1">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-900 text-blue-300">
                {story.type}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Status</label>
            <div className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(story.status)}`}>
                {story.status}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Priority</label>
            <div className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(story.priority)}`}>
                {story.priority}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Progress</label>
            <div className="mt-1">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full" 
                  style={{ width: `${story.progress}%`, backgroundColor: '#ffc44d' }}
                ></div>
              </div>
              <span className="text-xs text-gray-400 mt-1">{story.progress}% Complete</span>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="text-sm font-medium text-gray-400">Assigned To</label>
            <p className="mt-1 text-sm text-white">{story.assignedTo}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Deadline</label>
            <p className="mt-1 text-sm text-white">{story.deadline}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Created Date</label>
            <p className="mt-1 text-sm text-white">{story.createdDate}</p>
          </div>

          {story.storyPoints && (
            <div>
              <label className="text-sm font-medium text-gray-400">Story Points</label>
              <p className="mt-1 text-sm text-white">{story.storyPoints}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-white mb-3">Description</h3>
          <p className="text-gray-300">{story.description}</p>
        </div>

        {/* Acceptance Criteria */}
        {story.acceptanceCriteria && (
          <div>
            <h3 className="text-md font-semibold text-white mb-3">Acceptance Criteria</h3>
            <p className="text-gray-300">{story.acceptanceCriteria}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryDetailPage;