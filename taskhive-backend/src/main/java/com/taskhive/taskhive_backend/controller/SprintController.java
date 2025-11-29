package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.Sprint;
import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.service.SprintService;
import com.taskhive.taskhive_backend.service.StoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class SprintController {
    
    private final SprintService sprintService;
    private final StoryService storyService;
    
    @GetMapping
    public ResponseEntity<?> getAllSprints(@RequestParam Long companyId) {
        log.info("[ENTRY] GET /api/sprints - companyId: {}", companyId);
        try {
            List<Sprint> sprints = sprintService.getAllSprintsByCompany(companyId);
            log.info("[EXIT] GET /api/sprints - Success: 200, Found {} sprints", sprints.size());
            return ResponseEntity.ok(sprints);
        } catch (Exception e) {
            log.error("[EXIT] GET /api/sprints - Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getSprintById(@PathVariable Long id) {
        try {
            Sprint sprint = sprintService.getSprintById(id);
            List<Story> stories = storyService.getStoriesBySprintId(id);
            
            Map<String, Object> response = Map.of(
                "sprint", sprint,
                "stories", stories
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/current")
    public ResponseEntity<?> getCurrentSprint(@RequestParam Long companyId) {
        log.info("[ENTRY] GET /api/sprints/current - companyId: {}", companyId);
        try {
            Sprint sprint = sprintService.getCurrentSprint(companyId);
            List<Story> stories = storyService.getStoriesBySprintId(sprint.getId());
            
            Map<String, Object> response = Map.of(
                "sprint", sprint,
                "stories", stories
            );
            
            log.info("[EXIT] GET /api/sprints/current - Success: 200, Sprint: {} with {} stories", sprint.getName(), stories.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.info("[EXIT] GET /api/sprints/current - No active sprint: 200");
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "No active sprint found. Create a new sprint to get started.");
            response.put("sprint", null);
            response.put("stories", List.of());
            return ResponseEntity.ok(response);
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createSprint(@RequestBody Sprint sprint) {
        log.info("[ENTRY] POST /api/sprints - Name: {}", sprint.getName());
        try {
            Sprint createdSprint = sprintService.createSprint(sprint);
            log.info("[EXIT] POST /api/sprints - Success: 200, Created ID: {}", createdSprint.getSprintId());
            return ResponseEntity.ok(createdSprint);
        } catch (Exception e) {
            log.error("[EXIT] POST /api/sprints - Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSprint(@PathVariable Long id, @RequestBody Sprint sprint) {
        try {
            Sprint updatedSprint = sprintService.updateSprint(id, sprint);
            return ResponseEntity.ok(updatedSprint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/{id}/close")
    public ResponseEntity<?> closeSprint(@PathVariable Long id) {
        try {
            Sprint closedSprint = sprintService.closeSprint(id);
            return ResponseEntity.ok(closedSprint);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/{sprintId}/stories")
    public ResponseEntity<?> addStoryToSprint(@PathVariable Long sprintId, 
                                            @RequestBody Map<String, Long> request) {
        try {
            Long storyId = request.get("storyId");
            Story story = storyService.addStoryToSprint(storyId, sprintId);
            return ResponseEntity.ok(story);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/{sprintId}/stories/{storyId}")
    public ResponseEntity<?> removeStoryFromSprint(@PathVariable Long sprintId, 
                                                 @PathVariable Long storyId) {
        try {
            Story story = storyService.removeStoryFromSprint(storyId);
            return ResponseEntity.ok(story);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}