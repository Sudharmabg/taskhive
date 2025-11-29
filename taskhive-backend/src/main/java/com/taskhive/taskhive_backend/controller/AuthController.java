package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.service.AuthService;
import com.taskhive.taskhive_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthService authService;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    
    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        log.info("[ENTRY] GET /api/auth/validate-token - Token: {}...", token.substring(0, Math.min(token.length(), 10)));
        try {
            // Simple demo validation
            if ("demo-token-123".equals(token)) {
                // Get real user data
                Optional<User> userOpt = userRepository.findByEmail("root");
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    Long companyId = user.getCompany() != null ? user.getCompany().getId() : 1L;
                    log.info("Validate-token - User company: {}, CompanyId: {}", user.getCompany(), companyId);
                    ResponseEntity<?> response = ResponseEntity.ok(Map.of(
                        "valid", true,
                        "user", Map.of(
                            "id", user.getId(),
                            "username", user.getEmail(),
                            "name", user.getName(),
                            "role", user.getRole().toString().toLowerCase(),
                            "companyId", companyId
                        )
                    ));
                    log.info("[EXIT] GET /api/auth/validate-token - Valid: 200");
                    return response;
                } else {
                    ResponseEntity<?> response = ResponseEntity.ok(Map.of("valid", false));
                    log.info("[EXIT] GET /api/auth/validate-token - User not found: 200");
                    return response;
                }
            } else {
                ResponseEntity<?> response = ResponseEntity.ok(Map.of("valid", false));
                log.info("[EXIT] GET /api/auth/validate-token - Invalid: 200");
                return response;
            }
        } catch (Exception e) {
            log.error("[EXIT] GET /api/auth/validate-token - Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/setup-password")
    public ResponseEntity<?> setupPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String password = request.get("password");
            
            User user = authService.setupPassword(token, password);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Password set successfully",
                "data", Map.of("userId", user.getId())
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        log.info("[ENTRY] POST /api/auth/login - Request: {}", request.keySet());
        try {
            String username = request.get("username");
            String password = request.get("password");
            
            log.info("Processing login for username: {}", username);
            
            // Find user by email (username)
            Optional<User> userOpt = userRepository.findByEmail(username);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // Verify password
                log.info("Stored password hash: {}", user.getPassword());
                log.info("Input password: {}", password);
                boolean passwordMatch = passwordEncoder.matches(password, user.getPassword());
                log.info("Password match result: {}", passwordMatch);
                
                if (passwordMatch) {
                    log.info("Login successful for user: {}", username);
                    Long companyId = user.getCompany() != null ? user.getCompany().getId() : 1L;
                    log.info("User company: {}, CompanyId: {}", user.getCompany(), companyId);
                    ResponseEntity<?> response = ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Login successful",
                        "token", "demo-token-123",
                        "user", Map.of(
                            "id", user.getId(),
                            "username", user.getEmail(),
                            "name", user.getName(),
                            "role", user.getRole().toString().toLowerCase(),
                            "companyId", companyId
                        )
                    ));
                    log.info("[EXIT] POST /api/auth/login - Success: 200");
                    return response;
                } else {
                    log.warn("Invalid password for username: {}", username);
                }
            } else {
                log.warn("User not found: {}", username);
            }
            
            ResponseEntity<?> response = ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid credentials"
            ));
            log.info("[EXIT] POST /api/auth/login - Failed: 400");
            return response;
        } catch (Exception e) {
            log.error("[EXIT] POST /api/auth/login - Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}