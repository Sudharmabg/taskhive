import React from 'react';
import Button from './Button';
import { UserGroupIcon } from '@heroicons/react/outline';

/**
 * TeamCard component for displaying team information
 * Shows team name, members, stats, and actions
 */
const TeamCard = ({ team, onEdit, onDelete }) => {
  const { name, members = [], description } = team;
  
  // Default stats if not provided
  const stats = team.stats || { completed: 0, pending: 0, overdue: 0 };

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
      {/* Team Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#ffc44d20' }}>
            <UserGroupIcon className="h-6 w-6" style={{ color: '#ffc44d' }} />
          </div>
          <h3 className="ml-3 text-lg font-semibold text-white">{name}</h3>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="mb-4">
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      )}

      {/* Members */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-300 mb-2">
          Members ({members.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {members.length > 0 ? (
            members.map((member, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300"
              >
                {member}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">No members assigned</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-300 mb-2">Task Stats</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-700 rounded-lg p-2">
            <p className="text-lg font-bold text-green-400">{stats.completed}</p>
            <p className="text-xs text-green-400">Completed</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-2">
            <p className="text-lg font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-yellow-400">Pending</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-2">
            <p className="text-lg font-bold text-red-400">{stats.overdue}</p>
            <p className="text-xs text-red-400">Overdue</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="flex-1"
        >
          Edit Team
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={onDelete}
          className="flex-1"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default TeamCard;