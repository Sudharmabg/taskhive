import React, { useState } from 'react';
import TaskDetailsModal from '../modals/TaskDetailsModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import { getEffectiveStatus } from '../../utils/storyUtils';

const STATUS_BADGE = {
  'Completed': 'bg-green-500 text-white',
  'In Progress': 'bg-blue-500 text-white',
  'Pending': 'bg-yellow-500 text-black',
  'Overdue': 'bg-red-500 text-white',
};

const ROW_ACCENT = {
  'Completed': 'border-l-4 border-green-500 bg-green-500/5',
  'In Progress': 'border-l-4 border-blue-500 bg-blue-500/5',
  'Pending': 'border-l-4 border-yellow-500 bg-yellow-500/5',
  'Overdue': 'border-l-4 border-red-500 bg-red-500/10',
};

const thClass = 'px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider';

/**
 * Task Summary Table component
 * Displays a list of tasks with basic information and actions
 */
const TaskSummaryTable = ({ tasks = [], onEdit, onDelete, onStatusChange, onDataChange, tableType = 'Story', emptyMessage }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    task: null,
    action: null
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    task: null
  });

  // Get user role for admin-only features
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  if (tasks.length === 0) {
    const pluralType = tableType.toLowerCase() === 'story' ? 'stories' : `${tableType.toLowerCase()}s`;
    return (
      <div className="p-6 text-center text-gray-400">
        {emptyMessage || `No ${pluralType} found`}
      </div>
    );
  }

  const typeLabel = (task) => task.type || (tableType !== 'Story' ? tableType : 'Item');

  /**
   * The next step is based on the saved status, not the Overdue display state:
   * an overdue item that was already started still offers "Mark Complete".
   * Only admins can reopen a completed item.
   */
  const getAction = (task) => {
    const status = task.status || 'Pending';
    if (status === 'In Progress') {
      return { next: 'Completed', label: 'Mark Complete', confirm: `Mark "${task.title}" as completed?` };
    }
    if (status === 'Completed') {
      return isAdmin
        ? { next: 'In Progress', label: 'Reopen', confirm: `Reopen "${task.title}" and move it back to In Progress?` }
        : null;
    }
    // Pending, or Overdue saved by the scheduler before work started
    return { next: 'In Progress', label: `Start ${typeLabel(task)}` };
  };

  const handleActionClick = (task, action) => {
    if (!onStatusChange || busyId) return;
    if (action.confirm) {
      setConfirmModal({
        isOpen: true,
        task,
        action
      });
    } else {
      executeAction(task, action);
    }
  };

  const executeAction = async (task, action) => {
    setBusyId(task.id);
    try {
      await onStatusChange(task.id, action.next);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteClick = (task) => {
    if (!onDelete || busyId) return;
    setDeleteModal({
      isOpen: true,
      task
    });
  };

  const executeDelete = async (task) => {
    setBusyId(task.id);
    try {
      await onDelete(task.id);
    } finally {
      setBusyId(null);
    }
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
            <th className={thClass}>{tableType}</th>
            <th className={thClass}>Assigned To</th>
            <th className={thClass}>Assigned Date</th>
            <th className={thClass}>Deadline</th>
            <th className={thClass}>Progress</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {tasks.map((task) => {
            const status = getEffectiveStatus(task);
            const action = getAction(task);
            const busy = busyId === task.id;
            const isComplete = action && action.next === 'Completed';
            return (
            <tr key={task.id} className={`hover:bg-gray-700/50 ${ROW_ACCENT[status] || ''}`}>
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
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${status === 'Overdue' ? 'text-red-400' : 'text-gray-200'}`}>
                {task.deadline || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${task.progress || 0}%`,
                      backgroundColor: task.progress === 100 ? '#22c55e' : task.progress >= 50 ? '#ffc44d' : '#3b82f6'
                    }}
                  ></div>
                </div>
                <div className="text-xs font-semibold text-gray-200 mt-1">{task.progress || 0}%</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[status] || 'bg-gray-500 text-white'}`}>
                  {status}
                </span>
                {status === 'Overdue' && task.status === 'In Progress' && (
                  <div className="text-xs text-gray-400 mt-1">Started</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
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
                  {onEdit && (
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 text-sm font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                      onClick={() => onEdit(task.id)}
                      disabled={busy}
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      onClick={() => handleDeleteClick(task)}
                      disabled={busy}
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  )}
                  {action && onStatusChange && (
                    <button
                      type="button"
                      className={`inline-flex items-center px-3 py-2 text-sm font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait ${
                        isComplete
                          ? 'text-white bg-green-600 hover:bg-green-500 focus:ring-green-500'
                          : action.label === 'Reopen'
                            ? 'text-gray-200 border border-gray-500 hover:bg-gray-700 focus:ring-gray-500'
                            : 'text-white bg-blue-600 hover:bg-blue-500 focus:ring-blue-500'
                      }`}
                      onClick={() => handleActionClick(task, action)}
                      disabled={busyId != null}
                      aria-busy={busy}
                    >
                      {busy ? 'Saving...' : action.label}
                    </button>
                  )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Task Details Modal - uses the latest copy from `tasks` so progress updates while open */}
      <TaskDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        task={(selectedTask && tasks.find(t => t.id === selectedTask.id)) || selectedTask}
        onEdit={onEdit}
        onDataChange={onDataChange}
      />

      {/* Confirmation Modal for status changes (e.g. Mark Complete) */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, task: null, action: null })}
        onConfirm={() => {
          if (confirmModal.task && confirmModal.action) {
            executeAction(confirmModal.task, confirmModal.action);
          }
        }}
        title={confirmModal.action?.label || "Confirm Action"}
        message={confirmModal.action?.confirm || ""}
        confirmText="OK"
        cancelText="Cancel"
        variant={confirmModal.action?.next === 'Completed' ? 'success' : 'warning'}
      />

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, task: null })}
        onConfirm={() => {
          if (deleteModal.task) {
            executeDelete(deleteModal.task);
          }
        }}
        title={`Delete ${deleteModal.task ? typeLabel(deleteModal.task) : 'Item'}`}
        message={deleteModal.task ? `Are you sure you want to delete "${deleteModal.task.title}"? This will permanently delete it from the system.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default TaskSummaryTable;
