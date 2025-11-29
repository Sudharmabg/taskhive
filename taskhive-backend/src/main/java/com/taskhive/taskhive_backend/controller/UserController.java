package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    
    private final UserService userService;
    
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
                user.setJobRole(User.JobRole.valueOf(jobRoleStr));
            }
            
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
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            User updatedUser = userService.updateUser(id, user);
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
}