package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.Idea;
import com.taskhive.taskhive_backend.model.IdeaVote;
import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.IdeaRepository;
import com.taskhive.taskhive_backend.repository.IdeaVoteRepository;
import com.taskhive.taskhive_backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Idea board. Everyone in the company can post ideas and upvote other people's.
 * Authors edit their idea while it is still New; admins set the status and reply.
 */
@RestController
@RequestMapping("/api/ideas")
@RequiredArgsConstructor
@Slf4j
public class IdeaController {

    private static final int MAX_TITLE = 150;
    private static final int MAX_DESCRIPTION = 5000;
    private static final int MAX_NOTE = 500;

    private final IdeaRepository ideaRepository;
    private final IdeaVoteRepository voteRepository;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<?> list() {
        User user = currentUserService.get().orElse(null);
        if (user == null) return error("You must be signed in");
        List<Idea> ideas = ideaRepository.findByCompanyIdOrderByCreatedAtDesc(companyId(user));
        Set<Long> voted = ideas.isEmpty() ? Set.of()
            : new HashSet<>(voteRepository.findVotedIdeaIds(user.getId(), ideas.stream().map(Idea::getId).toList()));
        return ResponseEntity.ok(ideas.stream().map(i -> view(i, user, voted.contains(i.getId()))).toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        if (user == null) return error("You must be signed in to post an idea");
        Idea idea = new Idea();
        String problem = applyContent(idea, body);
        if (problem != null) return error(problem);
        idea.setCompanyId(companyId(user));
        idea.setAuthorId(user.getId());
        idea.setAuthorName(user.getName());
        idea.setStatus(Idea.Status.NEW);
        Idea saved = ideaRepository.save(idea);
        log.info("Idea {} posted by user {}", saved.getId(), user.getId());
        return ResponseEntity.ok(view(saved, user, false));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        Idea idea = find(id, user);
        if (idea == null) return error("Idea not found");
        if (!canEdit(idea, user)) return error("You can edit your idea only while it is New");
        String problem = applyContent(idea, body);
        if (problem != null) return error(problem);
        Idea saved = ideaRepository.save(idea);
        return ResponseEntity.ok(view(saved, user, voteRepository.findByIdeaIdAndUserId(id, user.getId()).isPresent()));
    }

    /** Admin sets the review status and an optional reply. */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> setStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User user = currentUserService.get().orElse(null);
        if (!CurrentUserService.isAdmin(user)) return error("Only admins can change an idea's status");
        Idea idea = find(id, user);
        if (idea == null) return error("Idea not found");
        Idea.Status status;
        try {
            status = Idea.Status.valueOf(String.valueOf(body.get("status")).trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return error("Unknown status");
        }
        String note = trimToNull(body.get("note"));
        if (note != null && note.length() > MAX_NOTE) return error("Reply must be " + MAX_NOTE + " characters or fewer");
        idea.setStatus(status);
        idea.setAdminNote(note);
        idea.setStatusChangedByName(user.getName());
        Idea saved = ideaRepository.save(idea);
        log.info("Idea {} set to {} by user {}", id, status, user.getId());
        return ResponseEntity.ok(view(saved, user, voteRepository.findByIdeaIdAndUserId(id, user.getId()).isPresent()));
    }

    /** Toggles the caller's upvote. Authors can't vote for their own idea. */
    @PostMapping("/{id}/vote")
    public ResponseEntity<?> toggleVote(@PathVariable Long id) {
        User user = currentUserService.get().orElse(null);
        Idea idea = find(id, user);
        if (idea == null) return error("Idea not found");
        if (idea.getAuthorId().equals(user.getId())) return error("You can't vote for your own idea");

        Optional<IdeaVote> existing = voteRepository.findByIdeaIdAndUserId(id, user.getId());
        boolean voted;
        if (existing.isPresent()) {
            voteRepository.delete(existing.get());
            voted = false;
        } else {
            try {
                voteRepository.save(new IdeaVote(id, user.getId()));
            } catch (DataIntegrityViolationException e) {
                // A parallel click already recorded the vote
            }
            voted = true;
        }
        // Recount instead of incrementing so the total can't drift
        idea.setVoteCount((int) voteRepository.countByIdeaId(id));
        Idea saved = ideaRepository.save(idea);
        return ResponseEntity.ok(view(saved, user, voted));
    }

    /** Author or admin deletes the idea and its votes. */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        User user = currentUserService.get().orElse(null);
        Idea idea = find(id, user);
        if (idea == null) return error("Idea not found");
        if (!CurrentUserService.isAdmin(user) && !idea.getAuthorId().equals(user.getId())) {
            return error("You can only delete your own ideas");
        }
        voteRepository.deleteByIdeaId(id);
        ideaRepository.delete(idea);
        log.info("Idea {} deleted by user {}", id, user.getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    /** Validates and copies title, description and category; returns an error message or null. */
    private static String applyContent(Idea idea, Map<String, Object> body) {
        String title = trimToNull(body.get("title"));
        if (title == null) return "Give your idea a title";
        if (title.length() > MAX_TITLE) return "Title must be " + MAX_TITLE + " characters or fewer";
        String description = trimToNull(body.get("description"));
        if (description != null && description.length() > MAX_DESCRIPTION) {
            return "Description must be " + MAX_DESCRIPTION + " characters or fewer";
        }
        Idea.Category category = Idea.Category.OTHER;
        Object raw = body.get("category");
        if (raw != null && !raw.toString().isBlank()) {
            try {
                category = Idea.Category.valueOf(raw.toString().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                return "Unknown category";
            }
        }
        idea.setTitle(title);
        idea.setDescription(description);
        idea.setCategory(category);
        return null;
    }

    private Idea find(Long id, User user) {
        if (user == null) return null;
        return ideaRepository.findById(id)
            .filter(i -> Objects.equals(i.getCompanyId(), companyId(user)))
            .orElse(null);
    }

    private static boolean canEdit(Idea idea, User user) {
        if (CurrentUserService.isAdmin(user)) return true;
        return idea.getAuthorId().equals(user.getId()) && idea.getStatus() == Idea.Status.NEW;
    }

    private static Map<String, Object> view(Idea idea, User user, boolean votedByMe) {
        boolean mine = idea.getAuthorId().equals(user.getId());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", idea.getId());
        m.put("title", idea.getTitle());
        m.put("description", idea.getDescription());
        m.put("category", idea.getCategory());
        m.put("status", idea.getStatus());
        m.put("authorId", idea.getAuthorId());
        m.put("authorName", idea.getAuthorName());
        m.put("adminNote", idea.getAdminNote());
        m.put("statusChangedByName", idea.getStatusChangedByName());
        m.put("voteCount", idea.getVoteCount());
        m.put("votedByMe", votedByMe);
        m.put("mine", mine);
        m.put("canEdit", canEdit(idea, user));
        m.put("canDelete", mine || CurrentUserService.isAdmin(user));
        m.put("createdAt", idea.getCreatedAt());
        m.put("updatedAt", idea.getUpdatedAt());
        return m;
    }

    private static Long companyId(User user) {
        return user.getCompany() != null ? user.getCompany().getId() : null;
    }

    private static String trimToNull(Object value) {
        if (value == null) return null;
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static ResponseEntity<?> error(String message) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
    }
}
