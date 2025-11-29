package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.service.StoryService;
import com.taskhive.taskhive_backend.service.SprintService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {
    
    private final StoryService storyService;
    private final SprintService sprintService;
    
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats(@RequestParam Long companyId) {
        try {
            log.info("Getting dashboard stats for company: {}", companyId);
            
            var stories = storyService.getAllStoriesByCompany(companyId);
            var sprints = sprintService.getAllSprintsByCompany(companyId);
            
            long totalStories = stories.size();
            long completedStories = stories.stream().filter(s -> "Completed".equals(s.getStatus())).count();
            long inProgressStories = stories.stream().filter(s -> "In Progress".equals(s.getStatus())).count();
            long pendingStories = stories.stream().filter(s -> "Pending".equals(s.getStatus())).count();
            
            Map<String, Object> stats = Map.of(
                "totalStories", totalStories,
                "completedStories", completedStories,
                "inProgressStories", inProgressStories,
                "pendingStories", pendingStories,
                "totalSprints", sprints.size(),
                "activeSprints", sprints.stream().filter(s -> "ACTIVE".equals(s.getStatus().name())).count()
            );
            
            log.info("Dashboard stats: {}", stats);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting dashboard stats: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}