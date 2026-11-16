package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.UserRepository;
import com.taskhive.taskhive_backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Actions a signed-in user performs on their own account. */
@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private static final int MIN_PASSWORD_LENGTH = 8;

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        User user = currentUserService.get().orElse(null);
        if (user == null) {
            return error("You must be signed in to change your password");
        }
        String current = body.getOrDefault("currentPassword", "");
        String next = body.getOrDefault("newPassword", "");

        // The current password is always required, so knowing a user id is not enough
        if (user.getPassword() == null || !passwordEncoder.matches(current, user.getPassword())) {
            log.warn("Change password failed for user {}: wrong current password", user.getId());
            return error("Current password is incorrect");
        }
        if (next.length() < MIN_PASSWORD_LENGTH) {
            return error("New password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        if (passwordEncoder.matches(next, user.getPassword())) {
            return error("New password must be different from the current password");
        }

        user.setPassword(passwordEncoder.encode(next));
        userRepository.save(user);
        log.info("Password changed for user {}", user.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Password updated"));
    }

    private static ResponseEntity<?> error(String message) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
    }
}
