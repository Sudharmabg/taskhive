package com.taskhive.taskhive_backend.service;

import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;
import java.util.Optional;

/**
 * Identifies the user making the current request.
 *
 * NOTE: the app has no real session/JWT yet (login returns a fixed demo token), so the
 * frontend sends the signed-in user's id in the X-User-Id header. This is enough for
 * attribution (audit trail, time logs) but can be spoofed by a crafted request; replace
 * it with token-based identity when real authentication is added.
 */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    public static final String USER_HEADER = "X-User-Id";

    private final UserRepository userRepository;

    public Optional<User> get() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) {
            return Optional.empty(); // e.g. scheduled jobs
        }
        HttpServletRequest request = attrs.getRequest();
        String header = request.getHeader(USER_HEADER);
        if (header == null || header.isBlank()) {
            return Optional.empty();
        }
        try {
            return userRepository.findById(Long.parseLong(header.trim()));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public User require() {
        return get().orElseThrow(() -> new RuntimeException("You must be signed in to do this"));
    }

    /** Name used for attribution; "System" outside a web request (scheduled jobs). */
    public String displayName() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes)) {
            return "System";
        }
        return get().map(User::getName).orElse("Unknown user");
    }

    public static boolean isAdmin(User user) {
        return user != null && user.getRole() == User.Role.ADMIN;
    }

    /** Story assignees are stored as a comma-separated list of names. */
    public static boolean isAssignee(User user, String assigneeNames) {
        if (user == null || assigneeNames == null || user.getName() == null) {
            return false;
        }
        return Arrays.stream(assigneeNames.split(","))
            .map(String::trim)
            .anyMatch(name -> name.equalsIgnoreCase(user.getName().trim()));
    }
}
