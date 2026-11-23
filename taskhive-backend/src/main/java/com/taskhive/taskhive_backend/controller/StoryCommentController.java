package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.StoryComment;
import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.StoryCommentRepository;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import com.taskhive.taskhive_backend.service.CurrentUserService;
import com.taskhive.taskhive_backend.service.StoryAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Comments on Tasks, Epics, and Bugs.
 * Supports threaded replies and user/admin deletion.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class StoryCommentController {

    private static final int MAX_COMMENT_LENGTH = 5000;

    private final StoryCommentRepository commentRepository;
    private final StoryRepository storyRepository;
    private final CurrentUserService currentUserService;
    private final StoryAccessService storyAccessService;

    @GetMapping("/stories/{storyId}/comments")
    public ResponseEntity<?> listComments(@PathVariable Long storyId) {
        User user = currentUserService.get().orElse(null);
        Story story = storyRepository.findById(storyId).orElse(null);
        if (story == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Story not found"));
        }
        if (!storyAccessService.canView(story)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));
        }

        List<StoryComment> allComments = commentRepository.findByStoryIdOrderByCreatedAtAsc(storyId);
        Map<Long, Map<String, Object>> commentMap = new LinkedHashMap<>();
        List<Map<String, Object>> topLevel = new ArrayList<>();

        for (StoryComment c : allComments) {
            Map<String, Object> view = commentView(c, user);
            view.put("replies", new ArrayList<Map<String, Object>>());
            commentMap.put(c.getId(), view);
        }

        for (StoryComment c : allComments) {
            Map<String, Object> current = commentMap.get(c.getId());
            if (c.getParentId() != null && commentMap.containsKey(c.getParentId())) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> replies = (List<Map<String, Object>>) commentMap.get(c.getParentId()).get("replies");
                replies.add(current);
            } else {
                topLevel.add(current);
            }
        }

        return ResponseEntity.ok(topLevel);
    }

    @PostMapping("/stories/{storyId}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long storyId, @RequestBody Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "You must be signed in to comment"));
        }

        Story story = storyRepository.findById(storyId).orElse(null);
        if (story == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Story not found"));
        }
        if (!storyAccessService.canView(story)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));
        }

        String content = body.get("content") != null ? body.get("content").toString().trim() : "";
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Comment cannot be empty"));
        }
        if (content.length() > MAX_COMMENT_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of("message", "Comment must be " + MAX_COMMENT_LENGTH + " characters or fewer"));
        }

        StoryComment comment = new StoryComment();
        comment.setStoryId(storyId);
        comment.setCompanyId(story.getCompany() != null ? story.getCompany().getId() : null);
        comment.setUserId(user.getId());
        comment.setUserName(user.getName());
        comment.setContent(content);

        if (body.get("parentId") != null) {
            try {
                Long parentId = Long.parseLong(body.get("parentId").toString());
                if (commentRepository.existsById(parentId)) {
                    comment.setParentId(parentId);
                }
            } catch (NumberFormatException ignored) {}
        }

        StoryComment saved = commentRepository.save(comment);
        Map<String, Object> view = commentView(saved, user);
        view.put("replies", new ArrayList<>());
        return ResponseEntity.ok(view);
    }

    @DeleteMapping("/stories/{storyId}/comments/{commentId}")
    @Transactional
    public ResponseEntity<?> deleteComment(@PathVariable Long storyId, @PathVariable Long commentId) {
        User user = currentUserService.get().orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "You must be signed in"));
        }

        StoryComment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null || !Objects.equals(comment.getStoryId(), storyId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Comment not found"));
        }

        boolean isAuthor = Objects.equals(comment.getUserId(), user.getId());
        boolean isAdmin = CurrentUserService.isAdmin(user);
        if (!isAuthor && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You can only delete your own comments"));
        }

        commentRepository.deleteByParentId(commentId);
        commentRepository.delete(comment);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private static Map<String, Object> commentView(StoryComment c, User user) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("storyId", c.getStoryId());
        m.put("userId", c.getUserId());
        m.put("userName", c.getUserName() != null ? c.getUserName() : "User");
        m.put("content", c.getContent());
        m.put("parentId", c.getParentId());
        m.put("createdAt", c.getCreatedAt());
        m.put("updatedAt", c.getUpdatedAt());
        m.put("isMine", user != null && Objects.equals(c.getUserId(), user.getId()));
        return m;
    }
}
