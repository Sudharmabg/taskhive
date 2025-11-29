package com.taskhive.taskhive_backend.service;

import com.taskhive.taskhive_backend.model.User;

public interface AuthService {
    
    User validateToken(String token);
    
    User setupPassword(String token, String password);
    
    String login(String email, String password);
    
    String generatePasswordResetToken(User user);
    
    boolean isTokenValid(String token);
}