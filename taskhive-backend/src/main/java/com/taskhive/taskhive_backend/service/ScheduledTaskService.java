package com.taskhive.taskhive_backend.service;

import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledTaskService {
    
    private final StoryRepository storyRepository;
    
    @Scheduled(cron = "0 0 1 * * ?") // Run daily at 1 AM
    public void updateOverdueStories() {
        log.info("Starting scheduled task to update overdue stories");
        
        try {
            LocalDate today = LocalDate.now();
            
            // Find stories that are past deadline and not completed
            List<Story> overdueStories = storyRepository.findAll().stream()
                .filter(story -> story.getDeadline() != null)
                .filter(story -> story.getDeadline().isBefore(today))
                .filter(story -> !"Completed".equals(story.getStatus()))
                .filter(story -> !"Overdue".equals(story.getStatus()))
                .toList();
            
            for (Story story : overdueStories) {
                story.setStatus("Overdue");
                storyRepository.save(story);
            }
            
            log.info("Updated {} stories to overdue status", overdueStories.size());
            
        } catch (Exception e) {
            log.error("Error updating overdue stories: {}", e.getMessage());
        }
    }
}