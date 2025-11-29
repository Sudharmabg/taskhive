package com.taskhive.taskhive_backend.service;

import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.model.Company;
import com.taskhive.taskhive_backend.model.Team;
import com.taskhive.taskhive_backend.repository.UserRepository;
import com.taskhive.taskhive_backend.repository.CompanyRepository;
import com.taskhive.taskhive_backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final TeamRepository teamRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    
    public List<User> getAllUsersByCompany(Long companyId) {
        return userRepository.findByCompanyId(companyId);
    }
    
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
    
    public User createUser(User user, String teamName) {
        // Get company - use the company from the user object if set, otherwise default to company ID 1
        Company company;
        if (user.getCompany() != null && user.getCompany().getId() != null) {
            company = companyRepository.findById(user.getCompany().getId())
                .orElseThrow(() -> new RuntimeException("Company not found"));
        } else {
            company = companyRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default company not found"));
        }
        user.setCompany(company);
        
        // Find team by name and set teamId
        if (teamName != null && !teamName.isEmpty()) {
            List<Team> teams = teamRepository.findByCompanyId(company.getId());
            Team team = teams.stream()
                .filter(t -> t.getName().equals(teamName))
                .findFirst()
                .orElse(null);
            if (team != null) {
                user.setTeamId(team.getId());
            }
        }
        
        // Set default password if not provided
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode("password123"));
        }
        
        // Set default status
        if (user.getStatus() == null) {
            user.setStatus(User.Status.ACTIVE);
        }
        
        // Set default role
        if (user.getRole() == null) {
            user.setRole(User.Role.USER);
        }
        
        return userRepository.save(user);
    }
    
    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);
        
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setDesignation(userDetails.getDesignation());
        user.setJobRole(userDetails.getJobRole());
        user.setTeamId(userDetails.getTeamId());
        
        return userRepository.save(user);
    }
    
    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }
}