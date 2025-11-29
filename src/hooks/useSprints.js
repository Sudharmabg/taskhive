import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useSprints = () => {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSprints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getSprints();
      setSprints(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSprint = async (sprintData) => {
    try {
      const newSprint = await apiService.createSprint(sprintData);
      setSprints(prev => [...prev, newSprint]);
      return newSprint;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateSprint = async (sprintId, sprintData) => {
    try {
      const updatedSprint = await apiService.updateSprint(sprintId, sprintData);
      setSprints(prev => prev.map(s => s.id === sprintId ? updatedSprint : s));
      return updatedSprint;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const closeSprint = async (sprintId) => {
    try {
      await apiService.closeSprint(sprintId);
      setSprints(prev => prev.map(s => 
        s.id === sprintId ? { ...s, status: 'Completed' } : s
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchSprints();
  }, []);

  return {
    sprints,
    loading,
    error,
    fetchSprints,
    createSprint,
    updateSprint,
    closeSprint
  };
};

export const useSprint = (sprintId) => {
  const [sprint, setSprint] = useState(null);
  const [stories, setStories] = useState([]);
  const [availableStories, setAvailableStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSprint = async () => {
    if (!sprintId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getSprint(sprintId);
      setSprint(response.sprint);
      setStories(response.stories || []);
      
      const allStories = await apiService.getStories();
      setAvailableStories(allStories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSprint = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getCurrentSprint();
      setSprint(response.sprint);
      setStories(response.stories || []);
      
      const allStories = await apiService.getStories();
      setAvailableStories(allStories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addStoryToSprint = async (storyId) => {
    if (!sprint) return;
    
    try {
      await apiService.addStoryToSprint(sprint.id, storyId);
      const story = await apiService.getStory(storyId);
      setStories(prev => [...prev, story]);
      setSprint(prev => ({
        ...prev,
        stories: [...(prev.stories || []), storyId]
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removeStoryFromSprint = async (storyId) => {
    if (!sprint) return;
    
    try {
      await apiService.removeStoryFromSprint(sprint.id, storyId);
      setStories(prev => prev.filter(s => s.id !== storyId));
      setSprint(prev => ({
        ...prev,
        stories: prev.stories?.filter(id => id !== storyId) || []
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStory = async (storyId, storyData) => {
    try {
      const updatedStory = await apiService.updateStory(storyId, storyData);
      setStories(prev => prev.map(s => s.id === storyId ? updatedStory : s));
      setAvailableStories(prev => prev.map(s => s.id === storyId ? updatedStory : s));
      return updatedStory;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (sprintId === 'current') {
      fetchCurrentSprint();
    } else {
      fetchSprint();
    }
  }, [sprintId]);

  return {
    sprint,
    stories,
    availableStories,
    loading,
    error,
    fetchSprint,
    fetchCurrentSprint,
    addStoryToSprint,
    removeStoryFromSprint,
    updateStory
  };
};