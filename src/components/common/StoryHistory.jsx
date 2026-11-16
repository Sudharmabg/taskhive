import React, { useEffect, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/outline';
import apiService from '../../services/api';

export const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
};

export const ACTION_STYLES = {
  CREATED: 'bg-green-700 text-green-200',
  UPDATED: 'bg-blue-700 text-blue-200',
  DELETED: 'bg-red-700 text-red-200',
};

/**
 * Audit history of one Epic/Task/Bug: who created it and every edit since.
 * Collapsed by default; loads when first opened.
 */
const StoryHistory = ({ storyId, refreshKey }) => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError('');
    apiService.getStoryHistory(storyId)
      .then(data => { if (!cancelled) setEntries(Array.isArray(data) ? data : []); })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [open, storyId, refreshKey]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center text-sm font-medium text-white mb-2"
        aria-expanded={open}
      >
        {open ? <ChevronDownIcon className="h-4 w-4 mr-1" /> : <ChevronRightIcon className="h-4 w-4 mr-1" />}
        History
      </button>

      {open && (
        error ? (
          <p className="text-sm text-red-400">Failed to load history: {error}</p>
        ) : entries == null ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : entries.length === 0 ? (
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <p className="text-gray-400 text-sm">No history recorded yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-600 border border-gray-600 rounded-lg bg-gray-700 max-h-64 overflow-y-auto">
            {entries.map(entry => (
              <li key={entry.id} className="px-3 py-2">
                <div className="flex items-center flex-wrap gap-x-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded font-medium ${ACTION_STYLES[entry.action] || 'bg-gray-600 text-gray-200'}`}>
                    {entry.action}
                  </span>
                  <span className="text-white font-medium">{entry.userName || 'Unknown user'}</span>
                  <span className="text-gray-400">{formatDateTime(entry.createdAt)}</span>
                </div>
                {entry.details && (
                  <div className="mt-1 text-sm text-gray-300 whitespace-pre-line break-words">{entry.details}</div>
                )}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

export default StoryHistory;
