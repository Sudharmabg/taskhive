package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.service.StoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stories")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class StoryController {
    
    private final StoryService storyService;
    
    @GetMapping
    public ResponseEntity<?> getAllStories(@RequestParam Long companyId, 
                                         @RequestParam(required = false) String type) {
        log.info("[ENTRY] GET /api/stories - companyId: {}, type: {}", companyId, type);
        try {
            List<Story> stories;
            if (type != null) {
                stories = storyService.getStoriesByType(companyId, type);
            } else {
                stories = storyService.getAllStoriesByCompany(companyId);
            }
            log.info("[EXIT] GET /api/stories - Success: 200, Found {} stories", stories.size());
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("[EXIT] GET /api/stories - Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getStoryById(@PathVariable Long id) {
        try {
            Story story = storyService.getStoryById(id);
            return ResponseEntity.ok(story);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/story/{storyId}")
    public ResponseEntity<?> getStoryByStoryId(@PathVariable String storyId) {
        try {
            Story story = storyService.getStoryByStoryId(storyId);
            return ResponseEntity.ok(story);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createStory(@RequestBody Story story) {
        log.info("[ENTRY] POST /api/stories - Title: {}, Type: {}", story.getTitle(), story.getType());
        try {
            Story createdStory = storyService.createStory(story);
            log.info("[EXIT] POST /api/stories - Success: 200, Created ID: {}", createdStory.getStoryId());
            return ResponseEntity.ok(createdStory);
        } catch (Exception e) {
            log.error("[EXIT] POST /api/stories - Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStory(@PathVariable Long id, @RequestBody Story story) {
        try {
            Story updatedStory = storyService.updateStory(id, story);
            return ResponseEntity.ok(updatedStory);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStory(@PathVariable Long id) {
        try {
            storyService.deleteStory(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Story deleted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}