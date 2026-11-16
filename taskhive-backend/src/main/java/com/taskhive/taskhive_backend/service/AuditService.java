package com.taskhive.taskhive_backend.service;

import com.taskhive.taskhive_backend.model.AuditLog;
import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final CurrentUserService currentUserService;

    /** Record an action on a story. Never fails the calling operation. */
    public void record(Story story, AuditLog.Action action, String details) {
        try {
            AuditLog entry = new AuditLog();
            entry.setStoryId(story.getId());
            entry.setStoryKey(story.getStoryId());
            entry.setStoryTitle(truncate(story.getTitle(), 200));
            entry.setStoryType(story.getType());
            entry.setCompanyId(story.getCompany() != null ? story.getCompany().getId() : null);
            entry.setAction(action);
            entry.setDetails(details);
            Optional<User> user = currentUserService.get();
            entry.setUserId(user.map(User::getId).orElse(null));
            entry.setUserName(currentUserService.displayName());
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to write audit log for story {}: {}", story.getId(), e.getMessage());
        }
    }

    /** Adds "Label: old → new" to the list when the value changed. */
    public static void diff(List<String> changes, String label, Object oldValue, Object newValue) {
        String o = display(oldValue);
        String n = display(newValue);
        if (!Objects.equals(o, n)) {
            changes.add(label + ": " + (o.isEmpty() ? "(none)" : o) + " → " + (n.isEmpty() ? "(none)" : n));
        }
    }

    /** For long text: only note that it changed. */
    public static void diffText(List<String> changes, String label, String oldValue, String newValue) {
        if (!Objects.equals(display(oldValue), display(newValue))) {
            changes.add(label + " changed");
        }
    }

    private static String display(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
