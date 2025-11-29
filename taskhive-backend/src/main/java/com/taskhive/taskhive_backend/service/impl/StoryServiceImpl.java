package com.taskhive.taskhive_backend.service.impl;

import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.Company;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import com.taskhive.taskhive_backend.repository.CompanyRepository;
import com.taskhive.taskhive_backend.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoryServiceImpl implements StoryService {
    
    private final StoryRepository storyRepository;
    private final CompanyRepository companyRepository;
    
    @Override
    public List<Story> getAllStoriesByCompany(Long companyId) {
        return storyRepository.findByCompanyId(companyId);
    }
    
    @Override
    public List<Story> getStoriesByType(Long companyId, String type) {
        return storyRepository.findByCompanyIdAndType(companyId, type);
    }
    
    @Override
    public List<Story> getStoriesBySprintId(Long sprintId) {
        return storyRepository.findBySprintId(sprintId);
    }
    
    @Override
    public List<Story> getAvailableStories(Long companyId) {
        return storyRepository.findByCompanyIdAndSprintIdIsNull(companyId);
    }
    
    @Override
    public Story getStoryById(Long id) {
        return storyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Story not found with id: " + id));
    }
    
    @Override
    public Story getStoryByStoryId(String storyId) {
        return storyRepository.findByStoryId(storyId)
            .orElseThrow(() -> new RuntimeException("Story not found with storyId: " + storyId));
    }
    
    @Override
    public Story createStory(Story story) {
        // Set company if not set (default to company 1)
        if (story.getCompany() == null) {
            Company company = companyRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default company not found"));
            story.setCompany(company);
        }
        
        // Generate story ID based on type and company
        String prefix = story.getCompany().getCode() + "-" + 
                       story.getType().substring(0, 1);
        long count = storyRepository.count() + 1;
        story.setStoryId(prefix + String.format("%04d", count));
        
        // Set created by (default to admin user ID 1 for now)
        if (story.getCreatedBy() == null) {
            story.setCreatedBy(1L);
        }
        
        return storyRepository.save(story);
    }
    
    @Override
    public Story updateStory(Long id, Story story) {
        Story existingStory = getStoryById(id);
        
        existingStory.setTitle(story.getTitle());
        existingStory.setDescription(story.getDescription());
        existingStory.setPriority(story.getPriority());
        existingStory.setStatus(story.getStatus());
        existingStory.setAssigneeId(story.getAssigneeId());
        existingStory.setAssigneeName(story.getAssigneeName());
        existingStory.setStoryPoints(story.getStoryPoints());
        existingStory.setProgress(story.getProgress());
        existingStory.setDeadline(story.getDeadline());
        existingStory.setAcceptanceCriteria(story.getAcceptanceCriteria());
        
        return storyRepository.save(existingStory);
    }
    
    @Override
    public void deleteStory(Long id) {
        storyRepository.deleteById(id);
    }
    
    @Override
    public Story addStoryToSprint(Long storyId, Long sprintId) {
        Story story = getStoryById(storyId);
        story.setSprintId(sprintId);
        return storyRepository.save(story);
    }
    
    @Override
    public Story removeStoryFromSprint(Long storyId) {
        Story story = getStoryById(storyId);
        story.setSprintId(null);
        return storyRepository.save(story);
    }
}