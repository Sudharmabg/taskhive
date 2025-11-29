import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { 
  CalendarIcon, 
  UserIcon, 
  FlagIcon,

  TagIcon 
} from '@heroicons/react/outline';

/**
 * Task Details Modal component
 * Shows comprehensive task information with attachments and metadata
 */
const TaskDetailsModal = ({ isOpen, onClose, task, onEdit }) => {
  if (!task) return null;

  const getModalTitle = () => {
    const type = task.type || task.label || 'Story';
    return `${type} Details`;
  };

  const getEditButtonText = () => {
    const type = task.type || task.label || 'Story';
    return `Edit ${type}`;
  };

  const getLabelColor = (label) => {
    const colors = {
      'Bug': 'bg-red-100 text-red-800',
      'Epic': 'bg-purple-100 text-purple-800',
      'Task': 'bg-blue-100 text-blue-800'
    };
    return colors[label] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      'Bug': 'bg-red-100 text-red-800',
      'Epic': 'bg-purple-100 text-purple-800', 
      'Task': 'bg-blue-100 text-blue-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'text-red-600',
      'High': 'text-orange-600',
      'Medium': 'text-yellow-600',
      'Low': 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  };



  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">{task.title}</h2>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                <TagIcon className="h-3 w-3 mr-1" />
                {task.label || task.type || 'Task'}
              </span>
              <span className={`inline-flex items-center text-sm font-medium ${getPriorityColor(task.priority)}`}>
                <FlagIcon className="h-4 w-4 mr-1" />
                {task.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-white mb-2">Description</h3>
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <p className="text-gray-300">
              {task.description || 'No description provided for this task.'}
            </p>
          </div>
        </div>

        {/* Task Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Task Information</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center mb-2">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-300">Assigned to:</span>
                </div>
                <div className="flex flex-wrap gap-2 ml-6">
                  {task.assigneeName ? (
                    task.assigneeName.split(', ').map((name, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                        {name.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-medium text-gray-300">Unassigned</span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-300">Deadline:</span>
                <span className="text-sm font-medium text-white ml-2">{task.deadline}</span>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-300">Created:</span>
                <span className="text-sm font-medium text-white ml-2">{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white mb-3">Status & Progress</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-300">Status:</span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  (() => {
                    const isOverdue = task.status !== 'Completed' && task.deadline && new Date(task.deadline) < new Date();
                    const effectiveStatus = isOverdue ? 'Overdue' : task.status;
                    
                    return effectiveStatus === 'Completed' ? 'bg-green-700 text-green-200' :
                           effectiveStatus === 'In Progress' ? 'bg-blue-700 text-blue-200' :
                           effectiveStatus === 'Pending' ? 'bg-yellow-700 text-yellow-200' :
                           'bg-red-700 text-red-200';
                  })()
                }`}>
                  {(() => {
                    const isOverdue = task.status !== 'Completed' && task.deadline && new Date(task.deadline) < new Date();
                    return isOverdue ? 'Overdue' : task.status;
                  })()}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-300">Progress:</span>
                <div className="mt-1 w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ width: `${task.progress || 0}%`, backgroundColor: '#ffc44d' }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400 mt-1">{task.progress || 0}% Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acceptance Criteria */}
        <div>
          <h3 className="text-sm font-medium text-white mb-2">Acceptance Criteria</h3>
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <p className="text-gray-300">
              {task.acceptanceCriteria || 'No acceptance criteria defined for this story.'}
            </p>
          </div>
        </div>



        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              onClose();
              onEdit && onEdit(task.id);
            }}
          >
            {getEditButtonText()}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailsModal;