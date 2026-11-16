package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.Subtask;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import com.taskhive.taskhive_backend.repository.SubtaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * Subtasks (checklist items) for Tasks and Bugs.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class SubtaskController {

    private final SubtaskRepository subtaskRepository;
    private final StoryRepository storyRepository;

    @GetMapping("/stories/{storyId}/subtasks")
    public ResponseEntity<?> list(@PathVariable Long storyId) {
        return ResponseEntity.ok(subtaskRepository.findByStoryIdOrderByPositionAscIdAsc(storyId));
    }

    @PostMapping("/stories/{storyId}/subtasks")
    public ResponseEntity<?> create(@PathVariable Long storyId, @RequestBody Map<String, Object> body) {
        Optional<Story> story = storyRepository.findById(storyId);
        if (story.isEmpty()) {
            return error("Story not found");
        }
        if ("Epic".equalsIgnoreCase(story.get().getType())) {
            return error("Subtasks can only be added to Tasks and Bugs");
        }
        String title = body.get("title") == null ? "" : body.get("title").toString().trim();
        if (title.isEmpty()) {
            return error("Subtask title is required");
        }
        if (title.length() > 200) {
            return error("Subtask title must be 200 characters or fewer");
        }
        Subtask subtask = new Subtask();
        subtask.setStoryId(storyId);
        subtask.setTitle(title);
        subtask.setCompleted(Boolean.TRUE.equals(body.get("completed")));
        subtask.setPosition((int) subtaskRepository.countByStoryId(storyId));
        return ResponseEntity.ok(subtaskRepository.save(subtask));
    }

    /** Partial update: send "title" and/or "completed". */
    @PutMapping("/subtasks/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<Subtask> existing = subtaskRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Subtask subtask = existing.get();
        if (body.containsKey("title")) {
            String title = body.get("title") == null ? "" : body.get("title").toString().trim();
            if (title.isEmpty() || title.length() > 200) {
                return error("Subtask title must be 1-200 characters");
            }
            subtask.setTitle(title);
        }
        if (body.containsKey("completed")) {
            subtask.setCompleted(Boolean.TRUE.equals(body.get("completed")));
        }
        return ResponseEntity.ok(subtaskRepository.save(subtask));
    }

    @DeleteMapping("/subtasks/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!subtaskRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        subtaskRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Subtask deleted"));
    }

    private static ResponseEntity<?> error(String message) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
    }
}
