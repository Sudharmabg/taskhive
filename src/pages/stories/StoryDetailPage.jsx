import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/outline';
import Button from '../../components/common/Button';
import AddStoryModal from '../../components/modals/AddStoryModal';
import { TaskDetailsBody } from '../../components/modals/TaskDetailsModal';
import apiService from '../../services/api';

const LIST_ROUTES = { epic: { path: '/app/epics', label: 'Epics' }, task: { path: '/app/tasks', label: 'Tasks' }, bug: { path: '/app/bugs', label: 'Bugs' } };

/**
 * Page for a single Epic, Task or Bug, reachable by link (e.g. from an epic's linked items).
 * The URL holds the readable key (ABC-T0012) or the numeric id.
 */
const StoryDetailPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const key = decodeURIComponent(storyId);
      const data = /^\d+$/.test(key) ? await apiService.getStory(key) : await apiService.getStoryByKey(key);
      setStory(data);
    } catch (err) {
      // The backend answers "not found" for other teams' work too
      setError(err.status === 404 || /not found/i.test(err.message)
        ? "This item doesn't exist, or it belongs to a team you're not part of."
        : err.message);
      setStory(null);
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => { load(true); }, [load]);

  const handleSave = async (data) => {
    setSaveError('');
    try {
      await apiService.updateStory(story.id, { ...data, type: story.type });
      setEditing(false);
      await load();
    } catch (err) {
      throw err; // shown inside the edit form
    }
  };

  const list = LIST_ROUTES[(story?.type || '').toLowerCase()];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          {list && (
            <Link to={list.path} className="text-sm text-gray-400 hover:text-white hover:underline">
              All {list.label}
            </Link>
          )}
        </div>
        {story && (
          <Button variant="primary" onClick={() => setEditing(true)} className="flex items-center">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit {story.type}
          </Button>
        )}
      </div>

      {saveError && <p className="text-sm text-red-400" role="alert">Couldn't save: {saveError}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-lg text-gray-300">Loading...</div>
      ) : error ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-300">{error}</p>
          <Link to="/app/dashboard" className="inline-block mt-4 text-sm hover:underline" style={{ color: '#ffc44d' }}>
            Go to the dashboard
          </Link>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <TaskDetailsBody task={story} onDataChange={() => load()} />
        </div>
      )}

      {editing && story && (
        <AddStoryModal
          isOpen
          onClose={() => setEditing(false)}
          onSubmit={handleSave}
          story={story}
          defaultType={story.type}
        />
      )}
    </div>
  );
};

export default StoryDetailPage;
