import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useStories = (type = null) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getStories();
      const filteredStories = type ? data.filter(story => story.type === type) : data;
      setStories(filteredStories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createStory = async (storyData) => {
    try {
      const newStory = await apiService.createStory(storyData);
      setStories(prev => [...prev, newStory]);
      return newStory;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStory = async (storyId, storyData) => {
    try {
      const updatedStory = await apiService.updateStory(storyId, storyData);
      setStories(prev => prev.map(s => s.id === storyId ? updatedStory : s));
      return updatedStory;
    } catch (err) {
      setError(err.message);
      throw err;
    }
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
    createStory,
    updateStory,
    deleteStory
  };
};