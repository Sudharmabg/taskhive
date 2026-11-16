import React, { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon, XIcon } from '@heroicons/react/outline';
import apiService from '../../services/api';

/**
 * Subtasks (checklist) for Tasks and Bugs.
 *
 * - storyId: when set, saved subtasks are loaded; they can be ticked off and deleted
 * - editable: allows adding/deleting subtasks (ticking is always allowed for saved ones)
 * - pendingSubtasks / onPendingSubtasksChange: when provided, newly added titles are kept
 *   as pending and saved together with the story form. Without them, new subtasks are
 *   saved immediately (requires storyId).
 */
const SubtasksSection = ({
  storyId,
  editable = false,
  pendingSubtasks,
  onPendingSubtasksChange,
}) => {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const usePending = typeof onPendingSubtasksChange === 'function';
  const pending = pendingSubtasks || [];

  useEffect(() => {
    if (!storyId) {
      setSubtasks([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiService
      .getSubtasks(storyId)
      .then(data => { if (!cancelled) setSubtasks(Array.isArray(data) ? data : []); })
      .catch(err => { if (!cancelled) setError(`Failed to load subtasks: ${err.message}`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storyId]);

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    if (title.length > 200) {
      setError('Subtask title must be 200 characters or fewer');
      return;
    }
    setError('');
    if (usePending) {
      onPendingSubtasksChange([...pending, title]);
      setNewTitle('');
      return;
    }
    try {
      setAdding(true);
      const created = await apiService.createSubtask(storyId, title);
      setSubtasks(prev => [...prev, created]);
      setNewTitle('');
    } catch (err) {
      setError(`Could not add subtask: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (subtask) => {
    const completed = !subtask.completed;
    setSubtasks(prev => prev.map(s => (s.id === subtask.id ? { ...s, completed } : s)));
    try {
      await apiService.updateSubtask(subtask.id, { completed });
    } catch (err) {
      setSubtasks(prev => prev.map(s => (s.id === subtask.id ? { ...s, completed: !completed } : s)));
      setError(`Could not update subtask: ${err.message}`);
    }
  };

  const handleDelete = async (subtask) => {
    if (!window.confirm(`Delete subtask "${subtask.title}"?`)) return;
    try {
      await apiService.deleteSubtask(subtask.id);
      setSubtasks(prev => prev.filter(s => s.id !== subtask.id));
    } catch (err) {
      setError(`Could not delete subtask: ${err.message}`);
    }
  };

  const removePending = (index) => {
    onPendingSubtasksChange(pending.filter((_, i) => i !== index));
  };

  const doneCount = subtasks.filter(s => s.completed).length;
  const total = subtasks.length + pending.length;
  const canAdd = editable && (usePending || storyId);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-300">Subtasks</label>
        {subtasks.length > 0 && (
          <span className="text-xs text-gray-400">
            {doneCount}/{subtasks.length} done
          </span>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading subtasks...</p>
      ) : total === 0 ? (
        !canAdd && (
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <p className="text-gray-400 text-sm">No subtasks.</p>
          </div>
        )
      ) : (
        <ul className="divide-y divide-gray-600 border border-gray-600 rounded-lg bg-gray-700 mb-2">
          {subtasks.map(subtask => (
            <li key={`saved-${subtask.id}`} className="flex items-center justify-between px-3 py-2">
              <label className="flex items-center min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!subtask.completed}
                  onChange={() => handleToggle(subtask)}
                  className="rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-2 mr-2 flex-shrink-0"
                  style={{ '--tw-ring-color': '#ffc44d' }}
                />
                <span className={`text-sm truncate ${subtask.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                  {subtask.title}
                </span>
              </label>
              {editable && (
                <button
                  type="button"
                  onClick={() => handleDelete(subtask)}
                  className="ml-2 text-gray-400 hover:text-red-400 flex-shrink-0"
                  aria-label={`Delete subtask ${subtask.title}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
          {pending.map((title, index) => (
            <li key={`pending-${index}`} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center min-w-0">
                <input type="checkbox" disabled className="rounded border-gray-600 bg-gray-700 mr-2 flex-shrink-0 opacity-50" />
                <span className="text-sm text-gray-300 truncate">{title}</span>
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded text-black flex-shrink-0" style={{ backgroundColor: '#ffc44d' }}>
                  New
                </span>
              </div>
              <button
                type="button"
                onClick={() => removePending(index)}
                className="ml-2 text-gray-400 hover:text-red-400 flex-shrink-0"
                aria-label={`Remove subtask ${title}`}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              // Enter adds the subtask instead of submitting the surrounding form
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            maxLength={200}
            placeholder="Add a subtask..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:border-transparent text-sm"
            style={{ '--tw-ring-color': '#ffc44d' }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newTitle.trim() || adding}
            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-50"
            style={{ backgroundColor: '#ffc44d' }}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default SubtasksSection;
