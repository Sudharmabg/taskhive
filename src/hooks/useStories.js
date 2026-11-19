import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useStories = (type = null) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // silent: refresh without showing the loading state (keeps open modals mounted)
  const fetchStories = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await apiService.getStories();
      const filteredStories = type ? data.filter(story => story.type === type) : data;
      setStories(filteredStories);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Re-read stories after something changed server-side (e.g. progress recalculated)
  const refreshStories = () => fetchStories({ silent: true });

  // Save errors are thrown to the form that made the change; `error` is only for a failed
  // load, since the pages swap the whole list for it
  const createStory = async (storyData) => {
    const newStory = await apiService.createStory(storyData);
    setStories(prev => [...prev, newStory]);
    return newStory;
  };

  const updateStory = async (storyId, storyData) => {
    const updatedStory = await apiService.updateStory(storyId, storyData);
    setStories(prev => prev.map(s => s.id === storyId ? updatedStory : s));
    return updatedStory;
  };

  const deleteStory = async (storyId) => {
    try {
      await apiService.request(`/stories/${storyId}`, { method: 'DELETE' });
      setStories(prev => prev.filter(s => s.id !== storyId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchStories();
  }, [type]);

  return {
    stories,
    loading,
    error,
    fetchStories,
    refreshStories,
    createStory,
    updateStory,
    deleteStory
  };
};