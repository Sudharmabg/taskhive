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

  // Pending File objects travel with the form data; upload them after the story is saved
  const splitAttachments = ({ newAttachments, ...rest }) => [rest, newAttachments || []];

  const uploadPending = async (storyId, files) => {
    if (!files.length) return;
    try {
      await apiService.uploadAttachments(storyId, files);
    } catch (err) {
      alert(`Saved, but some attachments failed to upload: ${err.message}`);
    }
  };

  const createStory = async (storyData) => {
    try {
      const [data, files] = splitAttachments(storyData);
      const newStory = await apiService.createStory(data);
      await uploadPending(newStory.id, files);
      setStories(prev => [...prev, newStory]);
      return newStory;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStory = async (storyId, storyData) => {
    try {
      const [data, files] = splitAttachments(storyData);
      const updatedStory = await apiService.updateStory(storyId, data);
      await uploadPending(storyId, files);
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