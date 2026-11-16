package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.AuditLog;
import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.TimeLog;
import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import com.taskhive.taskhive_backend.repository.TimeLogRepository;
import com.taskhive.taskhive_backend.service.AuditService;
import com.taskhive.taskhive_backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Estimated hours and daily time logs for Tasks and Bugs.
 * Only the item's assignees (or an admin) can set the estimate or log time.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TimeTrackingController {

    private static final BigDecimal MAX_HOURS_PER_DAY = new BigDecimal("24");
    private static final BigDecimal MAX_ESTIMATE = new BigDecimal("9999");

    private final StoryRepository storyRepository;
    private final TimeLogRepository timeLogRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    /** Estimate, totals, the entries, and whether the caller may edit. */
    @GetMapping("/stories/{storyId}/time")
    public ResponseEntity<?> summary(@PathVariable Long storyId) {
        Optional<Story> story = storyRepository.findById(storyId);
        if (story.isEmpty()) {
            return error("Story not found");
        }
        List<TimeLog> logs = timeLogRepository.findByStoryIdOrderByWorkDateDescIdDesc(storyId);
        BigDecimal logged = logs.stream().map(TimeLog::getHours).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal estimate = story.get().getEstimatedHours();
        User user = currentUserService.get().orElse(null);

        Map<String, Object> result = new HashMap<>();
        result.put("estimatedHours", estimate);
        result.put("loggedHours", logged);
        result.put("remainingHours", estimate == null ? null : estimate.subtract(logged).max(BigDecimal.ZERO));
        result.put("logs", logs);
        result.put("canEdit", canEdit(user, story.get()));
        result.put("isAdmin", CurrentUserService.isAdmin(user));
        result.put("currentUserId", user != null ? user.getId() : null);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/stories/{storyId}/estimate")
    public ResponseEntity<?> setEstimate(@PathVariable Long storyId, @RequestBody Map<String, Object> body) {
        Optional<Story> found = storyRepository.findById(storyId);
        if (found.isEmpty()) {
            return error("Story not found");
        }
        Story story = found.get();
        if (isEpic(story)) {
            return error("Estimates are set on Tasks and Bugs, not Epics");
        }
        User user = currentUserService.get().orElse(null);
        if (!canEdit(user, story)) {
            return forbidden("Only the assigned users can set the estimate");
        }

        BigDecimal hours;
        Object raw = body.get("estimatedHours");
        if (raw == null || raw.toString().isBlank()) {
            hours = null; // clear the estimate
        } else {
            try {
                hours = new BigDecimal(raw.toString().trim()).setScale(2, RoundingMode.HALF_UP);
            } catch (NumberFormatException e) {
                return error("Estimated hours must be a number");
            }
            if (hours.signum() <= 0 || hours.compareTo(MAX_ESTIMATE) > 0) {
                return error("Estimated hours must be between 0 and " + MAX_ESTIMATE);
            }
        }

        BigDecimal previous = story.getEstimatedHours();
        story.setEstimatedHours(hours);
        story.setUpdatedBy(user.getId());
        story.setUpdatedByName(user.getName());
        storyRepository.save(story);
        auditService.record(story, AuditLog.Action.UPDATED,
            "Estimated hours: " + fmt(previous) + " → " + fmt(hours));
        return summary(storyId);
    }

    @PostMapping("/stories/{storyId}/timelogs")
    public ResponseEntity<?> logTime(@PathVariable Long storyId, @RequestBody Map<String, Object> body) {
        Optional<Story> found = storyRepository.findById(storyId);
        if (found.isEmpty()) {
            return error("Story not found");
        }
        Story story = found.get();
        if (isEpic(story)) {
            return error("Time is logged on Tasks and Bugs, not Epics");
        }
        User user = currentUserService.get().orElse(null);
        if (!canEdit(user, story)) {
            return forbidden("Only the assigned users can log time");
        }

        LocalDate date;
        try {
            Object rawDate = body.get("workDate");
            date = rawDate == null || rawDate.toString().isBlank() ? LocalDate.now() : LocalDate.parse(rawDate.toString());
        } catch (DateTimeParseException e) {
            return error("Work date must be in YYYY-MM-DD format");
        }
        if (date.isAfter(LocalDate.now())) {
            return error("You can't log time for a future date");
        }

        BigDecimal hours;
        try {
            hours = new BigDecimal(String.valueOf(body.get("hours")).trim()).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return error("Hours must be a number");
        }
        if (hours.signum() <= 0) {
            return error("Hours must be greater than 0");
        }
        BigDecimal alreadyLogged = timeLogRepository.sumHoursForUserOnDate(user.getId(), date);
        if (alreadyLogged.add(hours).compareTo(MAX_HOURS_PER_DAY) > 0) {
            return error("You have already logged " + fmt(alreadyLogged) + " h on " + date
                + "; a day can't exceed 24 h");
        }

        String note = body.get("note") == null ? null : body.get("note").toString().trim();
        if (note != null && note.length() > 500) {
            return error("Note must be 500 characters or fewer");
        }

        TimeLog entry = new TimeLog();
        entry.setStoryId(storyId);
        entry.setUserId(user.getId());
        entry.setUserName(user.getName());
        entry.setWorkDate(date);
        entry.setHours(hours);
        entry.setNote(note == null || note.isEmpty() ? null : note);
        timeLogRepository.save(entry);
        auditService.record(story, AuditLog.Action.UPDATED, "Logged " + fmt(hours) + " h for " + date);
        return summary(storyId);
    }

    @DeleteMapping("/timelogs/{id}")
    public ResponseEntity<?> deleteLog(@PathVariable Long id) {
        Optional<TimeLog> found = timeLogRepository.findById(id);
        if (found.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        TimeLog entry = found.get();
        User user = currentUserService.get().orElse(null);
        boolean own = user != null && user.getId().equals(entry.getUserId());
        if (!own && !CurrentUserService.isAdmin(user)) {
            return forbidden("You can only delete your own time entries");
        }
        timeLogRepository.deleteById(id);
        storyRepository.findById(entry.getStoryId()).ifPresent(story ->
            auditService.record(story, AuditLog.Action.UPDATED,
                "Removed time entry of " + fmt(entry.getHours()) + " h for " + entry.getWorkDate()
                    + (own ? "" : " (logged by " + entry.getUserName() + ")")));
        return summary(entry.getStoryId());
    }

    private static boolean canEdit(User user, Story story) {
        return user != null && (CurrentUserService.isAdmin(user)
            || CurrentUserService.isAssignee(user, story.getAssigneeName()));
    }

    private static boolean isEpic(Story story) {
        return "epic".equalsIgnoreCase(story.getType());
    }

    private static String fmt(BigDecimal value) {
        return value == null ? "(none)" : value.stripTrailingZeros().toPlainString();
    }

    private static ResponseEntity<?> error(String message) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
    }

    private static ResponseEntity<?> forbidden(String message) {
        return ResponseEntity.status(403).body(Map.of("success", false, "message", message));
    }
}
