package com.taskhive.taskhive_backend.service;

import com.taskhive.taskhive_backend.model.Story;

import java.util.List;

public interface StoryService {
    List<Story> getAllStoriesByCompany(Long companyId);
    List<Story> getStoriesByType(Long companyId, String type);
    List<Story> getStoriesBySprintId(Long sprintId);
    List<Story> getAvailableStories(Long companyId);
    Story getStoryById(Long id);
    Story getStoryByStoryId(String storyId);
    Story createStory(Story story);
    Story updateStory(Long id, Story story);
    void deleteStory(Long id);
    Story addStoryToSprint(Long storyId, Long sprintId);
    Story removeStoryFromSprint(Long storyId);
}