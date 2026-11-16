import React, { useEffect, useState } from 'react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import apiService from '../../services/api';
import { ACTION_STYLES, formatDateTime } from '../../components/common/StoryHistory';

const PAGE_SIZE = 25;

const TYPE_STYLES = {
  Epic: 'bg-purple-100 text-purple-800',
  Task: 'bg-blue-100 text-blue-800',
  Bug: 'bg-red-100 text-red-800',
};

const selectClass = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent';
const ring = { '--tw-ring-color': '#ffc44d' };

/**
 * Audit Log page (admins): who created, edited or deleted Epics, Tasks and Bugs.
 */
const AuditLog = () => {
  const [filters, setFilters] = useState({ type: '', action: '', user: '', search: '' });
  const [debounced, setDebounced] = useState(filters);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wait for typing to pause before querying
  useEffect(() => {
    const t = setTimeout(() => setDebounced(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    setPage(0);
  }, [debounced]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiService.getAuditLogs({ ...debounced, page, size: PAGE_SIZE })
      .then(data => { if (!cancelled) setResult(data); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, page]);

  const setFilter = (name, value) => setFilters(prev => ({ ...prev, [name]: value }));
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-gray-300">Who created, edited and deleted epics, tasks and bugs</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
            <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} className={selectClass} style={ring}>
              <option value="">All types</option>
              <option value="Epic">Epic</option>
              <option value="Task">Task</option>
              <option value="Bug">Bug</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Action</label>
            <select value={filters.action} onChange={(e) => setFilter('action', e.target.value)} className={selectClass} style={ring}>
              <option value="">All actions</option>
              <option value="CREATED">Created</option>
              <option value="UPDATED">Updated</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>
          <Input
            label="User"
            name="user"
            value={filters.user}
            onChange={(e) => setFilter('user', e.target.value)}
            placeholder="Filter by user name..."
          />
          <Input
            label="Search"
            name="search"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="ID, title or change..."
          />
        </div>
      </div>

      {/* Entries */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Activity</h2>
          <span className="text-sm text-gray-400">{result.totalElements} entr{result.totalElements === 1 ? 'y' : 'ies'}</span>
        </div>

        {error ? (
          <div className="p-6 text-center text-red-400">Error: {error}</div>
        ) : loading && result.content.length === 0 ? (
          <div className="p-6 text-center text-gray-300">Loading audit log...</div>
        ) : result.content.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            {hasFilters ? 'No entries match these filters.' : 'No activity recorded yet. Changes to epics, tasks and bugs will appear here.'}
          </div>
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  {['When', 'User', 'Action', 'Item', 'Changes'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {result.content.map(entry => (
                  <tr key={entry.id} className="align-top">
                    <td className="px-6 py-3 text-sm text-gray-300 whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-6 py-3 text-sm text-white whitespace-nowrap">{entry.userName || 'Unknown user'}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_STYLES[entry.action] || 'bg-gray-600 text-gray-200'}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {entry.storyType && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[entry.storyType] || 'bg-gray-100 text-gray-800'}`}>
                            {entry.storyType}
                          </span>
                        )}
                        <span className="text-gray-400 whitespace-nowrap">{entry.storyKey}</span>
                      </div>
                      <div className="text-white mt-1 max-w-xs truncate" title={entry.storyTitle}>{entry.storyTitle}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-300 whitespace-pre-line break-words max-w-md">{entry.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
            <span className="text-sm text-gray-400">Page {page + 1} of {result.totalPages}</span>
            <div className="space-x-2">
              <Button variant="secondary" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="secondary" disabled={page + 1 >= result.totalPages || loading} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
