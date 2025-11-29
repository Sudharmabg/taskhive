package com.taskhive.taskhive_backend.service.impl;

import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.UserRepository;
import com.taskhive.taskhive_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public User validateToken(String token) {
        return userRepository.findByPasswordResetToken(token)
                .filter(user -> user.getPasswordResetExpires().isAfter(LocalDateTime.now()))
                .orElse(null);
    }
    
    @Override
    public User setupPassword(String token, String password) {
        User user = validateToken(token);
        if (user == null) {
            throw new RuntimeException("Invalid or expired token");
        }
        
        user.setPassword(passwordEncoder.encode(password));
        user.setStatus(User.Status.ACTIVE);
        user.setPasswordResetToken(null);
        user.setPasswordResetExpires(null);
        
        return userRepository.save(user);
    }
    
    @Override
    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        
        if (user.getStatus() != User.Status.ACTIVE) {
            throw new RuntimeException("Account not active");
        }
        
        // TODO: Generate JWT token
        return "jwt-token-placeholder";
    }
    
    @Override
    public String generatePasswordResetToken(User user) {
        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        user.setPasswordResetExpires(LocalDateTime.now().plusHours(24));
        userRepository.save(user);
        return token;
    }
    
    @Override
    public boolean isTokenValid(String token) {
        return validateToken(token) != null;
    }
}