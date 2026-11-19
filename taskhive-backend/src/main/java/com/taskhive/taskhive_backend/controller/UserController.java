package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.model.Team;
import com.taskhive.taskhive_backend.repository.TeamRepository;
import com.taskhive.taskhive_backend.service.CurrentUserService;
import com.taskhive.taskhive_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    
    private final UserService userService;
    private final CurrentUserService currentUserService;
    private final TeamRepository teamRepository;
    
    @GetMapping
    public ResponseEntity<?> getAllUsers(@RequestParam Long companyId) {
        log.info("[ENTRY] GET /api/users - companyId: {}", companyId);
        try {
            List<User> users = userService.getAllUsersByCompany(companyId);
            log.info("[EXIT] GET /api/users - Success: 200, Found {} users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("[EXIT] GET /api/users - Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> userData, @RequestParam Long companyId) {
        log.info("[ENTRY] POST /api/users - companyId: {}, user: {}", companyId, userData.get("name"));
        if (!isAdmin()) return forbidden("Only admins can add members");
        try {
            // Create User object from map data
            User user = new User();
            user.setEmployeeId((String) userData.get("employeeId"));
            user.setName((String) userData.get("name"));
            user.setEmail((String) userData.get("email"));
            user.setDesignation((String) userData.get("designation"));
            
            // Set job role
            String jobRoleStr = (String) userData.get("jobRole");
            if (jobRoleStr != null) {
                user.setJobRole(UserService.normalizeJobRole(jobRoleStr));
            }

            // Set admin-provided password (shared directly with the member).
            // Left blank -> UserService applies a default. The raw value is
            // encoded in UserService before persisting.
            String password = (String) userData.get("password");
            if (password != null && !password.isBlank()) {
                user.setPassword(password);
            }

            // Members onboarded by an admin are active immediately
            user.setStatus(User.Status.ACTIVE);

            // Set company ID on user
            user.setCompany(new com.taskhive.taskhive_backend.model.Company());
            user.getCompany().setId(companyId);
            
            // Extract team name
            String teamName = (String) userData.get("team");
            
            User createdUser = userService.createUser(user, teamName);
            log.info("[EXIT] POST /api/users - Success: 200, Created user ID: {}", createdUser.getId());
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User created successfully",
                "data", createdUser
            ));
        } catch (Exception e) {
            log.error("[EXIT] POST /api/users - Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> changes) {
        if (!isAdmin()) return forbidden("Only admins can edit members");
        try {
            User updatedUser = userService.updateUser(id, changes);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User updated successfully",
                "data", updatedUser
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!isAdmin()) return forbidden("Only admins can remove members");
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User deleted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Member list for the Members page. Admins see the whole company; everyone else sees
     * their own team (or just themselves when they have no team).
     */
    @GetMapping("/directory")
    public ResponseEntity<?> directory() {
        User me = currentUserService.get().orElse(null);
        if (me == null) return forbidden("You must be signed in");
        Long companyId = me.getCompany() != null ? me.getCompany().getId() : null;
        boolean admin = CurrentUserService.isAdmin(me);

        List<User> people = userService.getAllUsersByCompany(companyId).stream()
            .filter(u -> admin || u.getId().equals(me.getId())
                || (me.getTeamId() != null && me.getTeamId().equals(u.getTeamId())))
            .sorted(Comparator.comparing(u -> u.getName() == null ? "" : u.getName().toLowerCase()))
            .toList();
        Map<Long, String> teamNames = teamRepository.findByCompanyId(companyId).stream()
            .collect(Collectors.toMap(Team::getId, Team::getName, (a, b) -> a));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (User u : people) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", u.getId());
            row.put("employeeId", u.getEmployeeId());
            row.put("name", u.getName());
            row.put("email", u.getEmail());
            row.put("designation", u.getDesignation());
            row.put("jobRole", u.getJobRole());
            row.put("teamId", u.getTeamId());
            row.put("teamName", u.getTeamId() != null ? teamNames.get(u.getTeamId()) : null);
            row.put("role", u.getRole());
            row.put("status", u.getStatus());
            row.put("isMe", u.getId().equals(me.getId()));
            rows.add(row);
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("members", rows);
        body.put("canEdit", admin);
        body.put("standardJobRoles", User.STANDARD_JOB_ROLES);
        body.put("myTeamId", me.getTeamId());
        return ResponseEntity.ok(body);
    }

    private boolean isAdmin() {
        return CurrentUserService.isAdmin(currentUserService.get().orElse(null));
    }

    private static ResponseEntity<?> forbidden(String message) {
        return ResponseEntity.status(403).body(Map.of("success", false, "message", message));
    }
}