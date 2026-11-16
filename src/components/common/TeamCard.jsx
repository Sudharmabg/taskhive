import React, { useState } from 'react';
import Button from './Button';
import { UserGroupIcon } from '@heroicons/react/outline';

const STAT_TILES = [
  { key: 'completed', label: 'Completed', short: 'Done', color: 'text-green-400', bar: 'bg-green-500' },
  { key: 'inProgress', label: 'In Progress', short: 'Active', color: 'text-blue-400', bar: 'bg-blue-500' },
  { key: 'pending', label: 'Pending', short: 'Pend.', color: 'text-yellow-400', bar: 'bg-yellow-500' },
  { key: 'overdue', label: 'Overdue', short: 'Late', color: 'text-red-400', bar: 'bg-red-500' },
];

const EMPTY_STATS = { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, completionRate: 0 };

/**
 * TeamCard component for displaying team information
 * Shows team name, members, stats (Tasks and Bugs assigned to members), and actions
 */
const TeamCard = ({ team, onEdit, onDelete }) => {
  const { name, members = [], description, memberStats = [], onLeaveToday = [] } = team;
  const stats = { ...EMPTY_STATS, ...(team.stats || {}) };
  const [showMembers, setShowMembers] = useState(false);

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

      {/* On leave today */}
      {onLeaveToday.length > 0 && (
        <p className="mb-4 text-xs" style={{ color: '#ffc44d' }}>
          On leave today: {onLeaveToday.join(', ')}
        </p>
      )}

      {/* Stats */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-300">Task Stats</p>
          <p className="text-xs text-gray-400">
            {stats.total} task{stats.total === 1 ? '' : 's'} & bugs · {stats.completionRate}% done
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {STAT_TILES.map(tile => (
            <div key={tile.key} className="bg-gray-700 rounded-lg p-2">
              <p className={`text-lg font-bold ${tile.color}`}>{stats[tile.key]}</p>
              <p className={`text-xs ${tile.color}`}>{tile.label}</p>
            </div>
          ))}
        </div>
        {stats.total > 0 && (
          <div className="flex h-1.5 mt-2 rounded-full overflow-hidden bg-gray-700" aria-hidden="true">
            {STAT_TILES.map(tile => (
              <div key={tile.key} className={tile.bar} style={{ width: `${(stats[tile.key] / stats.total) * 100}%` }} />
            ))}
          </div>
        )}

        {memberStats.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowMembers(s => !s)}
              className="text-xs hover:underline"
              style={{ color: '#ffc44d' }}
              aria-expanded={showMembers}
            >
              {showMembers ? 'Hide' : 'Show'} per-member breakdown
            </button>
            {showMembers && (
              <table className="w-full mt-2 text-xs">
                <thead>
                  <tr className="text-gray-400">
                    <th className="text-left font-medium py-1">Member</th>
                    {STAT_TILES.map(tile => (
                      <th key={tile.key} className={`text-right font-medium py-1 ${tile.color}`} title={tile.label}>{tile.short}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {memberStats.map(m => (
                    <tr key={m.name} className="border-t border-gray-700">
                      <td className="py-1 text-gray-200 truncate max-w-[8rem]" title={m.name}>{m.name}</td>
                      {STAT_TILES.map(tile => (
                        <td key={tile.key} className="py-1 text-right text-gray-200">{m.stats[tile.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
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