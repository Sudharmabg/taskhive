package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.AuditLog;
import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.Subtask;
import com.taskhive.taskhive_backend.repository.AttachmentRepository;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import com.taskhive.taskhive_backend.repository.SubtaskRepository;
import com.taskhive.taskhive_backend.service.AuditService;
import com.taskhive.taskhive_backend.service.ProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    private final AttachmentRepository attachmentRepository;
    private final ProgressService progressService;
    private final AuditService auditService;

    @GetMapping("/stories/{storyId}/subtasks")
    public ResponseEntity<?> list(@PathVariable Long storyId) {
        List<Subtask> subtasks = subtaskRepository.findByStoryIdOrderByPositionAscIdAsc(storyId);
        subtasks.forEach(s -> s.setAttachmentCount(attachmentRepository.countBySubtaskId(s.getId())));
        return ResponseEntity.ok(subtasks);
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
        Subtask saved = subtaskRepository.save(subtask);
        saved.setAttachmentCount(0L);
        auditService.record(story.get(), AuditLog.Action.UPDATED, "Added subtask \"" + title + "\"");
        progressService.recalculateStory(storyId);
        return ResponseEntity.ok(saved);
    }

    /** Partial update: send "title" and/or "completed". */
    @PutMapping("/subtasks/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<Subtask> existing = subtaskRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Subtask subtask = existing.get();
        String oldTitle = subtask.getTitle();
        Boolean oldCompleted = subtask.getCompleted();
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
        Subtask saved = subtaskRepository.save(subtask);
        saved.setAttachmentCount(attachmentRepository.countBySubtaskId(id));

        storyRepository.findById(saved.getStoryId()).ifPresent(story -> {
            if (!oldTitle.equals(saved.getTitle())) {
                auditService.record(story, AuditLog.Action.UPDATED,
                    "Renamed subtask \"" + oldTitle + "\" → \"" + saved.getTitle() + "\"");
            }
            boolean wasCompleted = Boolean.TRUE.equals(oldCompleted);
            boolean isCompleted = Boolean.TRUE.equals(saved.getCompleted());
            if (wasCompleted != isCompleted) {
                auditService.record(story, AuditLog.Action.UPDATED,
                    (Boolean.TRUE.equals(saved.getCompleted()) ? "Completed" : "Reopened")
                        + " subtask \"" + saved.getTitle() + "\"");
            }
        });
        progressService.recalculateStory(saved.getStoryId());
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/subtasks/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Optional<Subtask> existing = subtaskRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Subtask subtask = existing.get();
        attachmentRepository.deleteBySubtaskId(id);
        subtaskRepository.deleteById(id);
        storyRepository.findById(subtask.getStoryId()).ifPresent(story ->
            auditService.record(story, AuditLog.Action.UPDATED, "Deleted subtask \"" + subtask.getTitle() + "\""));
        progressService.recalculateStory(subtask.getStoryId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Subtask deleted"));
    }

    private static ResponseEntity<?> error(String message) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
    }
}
