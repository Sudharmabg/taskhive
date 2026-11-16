import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TaskSummaryTable from '../../components/common/TaskSummaryTable';
import AddStoryModal from '../../components/modals/AddStoryModal';
import { useStories } from '../../hooks/useStories';
import { filterStories } from '../../utils/storyUtils';

const TYPES = ['All', 'Epic', 'Task', 'Bug'];

/**
 * Results for the topbar search across Epics, Tasks and Bugs.
 * Matches ID, title, assignees, description and acceptance criteria.
 */
const SearchResults = () => {
  const location = useLocation();
  const query = (new URLSearchParams(location.search).get('q') || '').trim();
  const { stories, loading, error, updateStory, refreshStories } = useStories();
  const [type, setType] = useState('All');
  const [editingStory, setEditingStory] = useState(null);

  const matches = useMemo(() => (query ? filterStories(stories, { search: query }) : []), [stories, query]);
  const counts = useMemo(() => {
    const c = { All: matches.length, Epic: 0, Task: 0, Bug: 0 };
    matches.forEach(s => { if (c[s.type] != null) c[s.type] += 1; });
    return c;
  }, [matches]);
  const visible = type === 'All' ? matches : matches.filter(s => s.type === type);

  const handleStatusChange = async (storyId, newStatus) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) return;
    try {
      await updateStory(storyId, { ...story, status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleUpdate = async (storyData) => {
    try {
      await updateStory(editingStory.id, { ...storyData, type: editingStory.type });
      setEditingStory(null);
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Search</h1>
        <p className="text-gray-300">
          {query ? <>Results for “{query}”</> : 'Type in the search bar above and press Enter.'}
        </p>
      </div>

      {query && (
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex flex-wrap gap-2" role="tablist" aria-label="Filter results by type">
            {TYPES.map(t => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={type === t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  type === t ? 'text-black' : 'text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white'
                }`}
                style={type === t ? { backgroundColor: '#ffc44d' } : {}}
              >
                {t === 'All' ? 'All' : `${t}s`} <span className="opacity-70">({counts[t]})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-300">Searching...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">Error: {error}</div>
          ) : (
            <TaskSummaryTable
              tasks={visible}
              tableType="Story"
              emptyMessage={`Nothing matches “${query}”${type === 'All' ? '' : ` in ${type}s`}`}
              onEdit={(id) => setEditingStory(stories.find(s => s.id === id) || null)}
              onStatusChange={handleStatusChange}
              onDataChange={refreshStories}
            />
          )}
        </div>
      )}

      {editingStory && (
        <AddStoryModal
          isOpen={!!editingStory}
          onClose={() => setEditingStory(null)}
          onSubmit={handleUpdate}
          story={editingStory}
          defaultType={editingStory.type}
        />
      )}
    </div>
  );
};

export default SearchResults;
