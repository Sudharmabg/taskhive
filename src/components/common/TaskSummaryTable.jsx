import React, { useState } from 'react';
import TaskDetailsModal from '../modals/TaskDetailsModal';

/**
 * Task Summary Table component
 * Displays a list of tasks with basic information and actions
 */
const TaskSummaryTable = ({ tasks = [], onEdit, onStatusChange, tableType = 'Story' }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Get user role for admin-only features
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  
  // Check if story is overdue
  const isOverdue = (task) => {
    if (task.status === 'Completed') return false;
    const today = new Date();
    const deadline = new Date(task.deadline);
    return deadline < today;
  };
  
  // Get effective status (including overdue logic)
  const getEffectiveStatus = (task) => {
    if (isOverdue(task) && task.status !== 'Completed') {
      return 'Overdue';
    }
    return task.status;
  };

  if (tasks.length === 0) {
    const pluralType = tableType.toLowerCase() === 'story' ? 'stories' : `${tableType.toLowerCase()}s`;
    return (
      <div className="p-6 text-center text-gray-400">
        No {pluralType} found
      </div>
    );
  }

  const getPriorityTextColor = (priority) => {
    return 'text-white';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Completed': 'bg-green-500 text-white',
      'In Progress': 'bg-blue-500 text-white',
      'Pending': 'bg-yellow-500 text-black',
      'Overdue': 'bg-red-500 text-white'
    };
    return colors[status] || 'bg-gray-500 text-white';
  };
  
  const getRowStatusColor = (task) => {
    const effectiveStatus = getEffectiveStatus(task);
    const colors = {
      'Completed': 'border-l-4 border-green-500 bg-green-500/5',
      'In Progress': 'border-l-4 border-blue-500 bg-blue-500/5',
      'Pending': 'border-l-4 border-yellow-500 bg-yellow-500/5',
      'Overdue': 'border-l-4 border-red-500 bg-red-500/10'
    };
    return colors[effectiveStatus] || '';
  };
  
  const getNextStatus = (task) => {
    const effectiveStatus = getEffectiveStatus(task);
    if (effectiveStatus === 'Pending' || effectiveStatus === 'Overdue') {
      return 'In Progress';
    } else if (effectiveStatus === 'In Progress') {
      return 'Completed';
    } else if (effectiveStatus === 'Completed' && isAdmin) {
      return 'In Progress';
    }
    return null;
  };
  
  const getStatusButtonText = (task) => {
    const nextStatus = getNextStatus(task);
    if (!nextStatus) return getEffectiveStatus(task);
    
    const actions = {
      'In Progress': 'Start Task',
      'Completed': 'Mark Complete',
    };
    return actions[nextStatus] || nextStatus;
  };
  


  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              {tableType}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Assigned To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Assigned Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Deadline
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Progress
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {tasks.map((task) => (
            <tr key={task.id} className={`hover:bg-gray-700/50 ${getRowStatusColor(task)}`}>
              <td className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-600/30" onClick={() => handleViewDetails(task)}>
                <div className="text-sm font-semibold text-white hover:text-yellow-400 hover:underline">
                  {task.title}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-200">
                  <div>{task.assigneeName || 'Unassigned'}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                {task.deadline}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full"
                    style={{ 
                      width: `${task.progress}%`, 
                      backgroundColor: task.progress === 100 ? '#22c55e' : task.progress >= 50 ? '#ffc44d' : '#3b82f6'
                    }}
                  ></div>
                </div>
                <div className="text-xs font-semibold text-gray-200 mt-1">{task.progress}%</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-3">
                  <button
                    className="inline-flex items-center px-3 py-2 text-sm font-bold text-black rounded-lg hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    style={{ backgroundColor: '#ffc44d' }}
                    onClick={() => handleViewDetails(task)}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  <button
                    className="inline-flex items-center px-3 py-2 text-sm font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    onClick={() => onEdit && onEdit(task.id)}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  {getNextStatus(task) ? (
                    <button
                      className="inline-flex items-center px-3 py-2 text-sm font-bold text-black rounded-lg hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      style={{ backgroundColor: '#ffc44d' }}
                      onClick={() => onStatusChange && onStatusChange(task.id, getNextStatus(task))}
                    >
                      {getStatusButtonText(task)}
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-3 py-2 text-sm font-bold text-black rounded-lg"
                      style={{ backgroundColor: '#ffc44d' }}
                    >
                      {getEffectiveStatus(task)}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      
      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        task={selectedTask}
        onEdit={onEdit}
      />
    </div>
  );
};

export default TaskSummaryTable;