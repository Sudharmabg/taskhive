import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { CalendarIcon, PlusIcon } from '@heroicons/react/outline';

const SprintDetailsModal = ({ isOpen, onClose, sprint }) => {
  const [availableStories] = useState([
    { id: 'EMP-E1001', title: 'Design new landing page', type: 'Epic' },
    { id: 'EMP-T2001', title: 'Update documentation', type: 'Task' },
    { id: 'EMP-B3001', title: 'Fix authentication bug', type: 'Bug' },
    { id: 'EMP-T2002', title: 'Setup CI/CD pipeline', type: 'Task' },
    { id: 'EMP-E1002', title: 'User profile system', type: 'Epic' }
  ]);

  const [sprintStories, setSprintStories] = useState(sprint?.stories || []);

  const addStoryToSprint = (storyId) => {
    if (!sprintStories.includes(storyId)) {
      setSprintStories([...sprintStories, storyId]);
    }
  };

  const removeStoryFromSprint = (storyId) => {
    setSprintStories(sprintStories.filter(id => id !== storyId));
  };

  const getStoryDetails = (storyId) => {
    return availableStories.find(story => story.id === storyId);
  };

  const getTypeColor = (type) => {
    const colors = {
      'Epic': 'bg-purple-100 text-purple-800',
      'Task': 'bg-blue-100 text-blue-800',
      'Bug': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (!sprint) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sprint.name}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-300">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>Start: {sprint.startDate}</span>
          </div>
          <div className="flex items-center text-sm text-gray-300">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>End: {sprint.endDate}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Progress</span>
            <span>{sprint.progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-300"
              style={{ width: `${sprint.progress}%`, backgroundColor: '#ffc44d' }}
            ></div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Sprint Stories</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sprintStories.map(storyId => {
              const story = getStoryDetails(storyId);
              return story ? (
                <div key={storyId} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white">{story.title}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-400">{story.id}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(story.type)}`}>
                        {story.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStoryFromSprint(storyId)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : null;
            })}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Sprint Stories</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableStories
              .filter(story => !sprintStories.includes(story.id))
              .map(story => (
                <div key={story.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <div>
                    <div className="text-sm font-medium text-white">{story.title}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-400">{story.id}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(story.type)}`}>
                        {story.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => addStoryToSprint(story.id)}
                    className="flex items-center text-sm text-yellow-400 hover:text-yellow-300"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SprintDetailsModal;