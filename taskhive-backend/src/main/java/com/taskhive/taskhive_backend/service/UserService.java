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
    private final com.taskhive.taskhive_backend.repository.StoryRepository storyRepository;
    
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
        
        // Encode the password. Admins may supply one (shared directly with the
        // member); otherwise fall back to a default. The incoming value is always
        // raw at this point, so encode it here to avoid storing plaintext.
        String rawPassword = (user.getPassword() == null || user.getPassword().isEmpty())
                ? "password123"
                : user.getPassword();
        user.setPassword(passwordEncoder.encode(rawPassword));

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
    
    /**
     * Admin edit of a member's profile. Only fields present in the map change.
     * Renaming also updates the member's name in story assignee lists, which are stored as names.
     */
    @org.springframework.transaction.annotation.Transactional
    public User updateUser(Long id, java.util.Map<String, Object> changes) {
        User user = getUserById(id);
        Long companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        String oldName = user.getName();

        if (changes.containsKey("name")) {
            String name = text(changes.get("name"));
            if (name == null) throw new RuntimeException("Name is required");
            if (name.length() > 100) throw new RuntimeException("Name must be 100 characters or fewer");
            if (name.contains(",")) throw new RuntimeException("Name can't contain a comma");
            boolean taken = userRepository.findByCompanyId(companyId).stream()
                .anyMatch(u -> !u.getId().equals(id) && u.getName() != null && u.getName().trim().equalsIgnoreCase(name));
            // Names identify assignees, so a new name must be unique (existing duplicates are left alone)
            if (taken && !name.equalsIgnoreCase(oldName == null ? "" : oldName.trim())) throw new RuntimeException("Another member is already called \"" + name + "\"");
            user.setName(name);
        }
        if (changes.containsKey("email")) {
            String email = text(changes.get("email"));
            if (email == null) throw new RuntimeException("Email is required");
            if (email.length() > 100) throw new RuntimeException("Email must be 100 characters or fewer");
            userRepository.findByEmail(email)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> { throw new RuntimeException("That email is already in use"); });
            user.setEmail(email);
        }
        if (changes.containsKey("designation")) {
            String designation = text(changes.get("designation"));
            if (designation != null && designation.length() > 100) throw new RuntimeException("Designation must be 100 characters or fewer");
            user.setDesignation(designation);
        }
        if (changes.containsKey("jobRole")) {
            user.setJobRole(normalizeJobRole(changes.get("jobRole")));
        }
        if (changes.containsKey("teamId")) {
            Object raw = changes.get("teamId");
            Long teamId = raw == null || raw.toString().isBlank() ? null : Long.valueOf(raw.toString());
            if (teamId != null) {
                Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
                if (team.getCompany() != null && companyId != null && !companyId.equals(team.getCompany().getId())) {
                    throw new RuntimeException("Team not found");
                }
            }
            user.setTeamId(teamId);
        }

        User saved = userRepository.save(user);
        if (oldName != null && !oldName.equals(saved.getName())) {
            renameAssignee(companyId, oldName, saved.getName());
        }
        return saved;
    }

    /** Trims a job role; presets keep their canonical spelling, anything else is a custom role. */
    public static String normalizeJobRole(Object raw) {
        String role = text(raw);
        if (role == null) throw new RuntimeException("Job role is required");
        if (role.length() > 50) throw new RuntimeException("Job role must be 50 characters or fewer");
        return User.STANDARD_JOB_ROLES.stream().filter(r -> r.equalsIgnoreCase(role)).findFirst().orElse(role);
    }

    private void renameAssignee(Long companyId, String oldName, String newName) {
        List<com.taskhive.taskhive_backend.model.Story> stories = storyRepository.findByCompanyId(companyId);
        List<com.taskhive.taskhive_backend.model.Story> changed = new java.util.ArrayList<>();
        for (com.taskhive.taskhive_backend.model.Story story : stories) {
            if (story.getAssigneeName() == null) continue;
            List<String> names = java.util.Arrays.stream(story.getAssigneeName().split(","))
                .map(String::trim).filter(n -> !n.isEmpty()).toList();
            if (names.stream().noneMatch(n -> n.equalsIgnoreCase(oldName.trim()))) continue;
            story.setAssigneeName(String.join(", ", names.stream()
                .map(n -> n.equalsIgnoreCase(oldName.trim()) ? newName : n).toList()));
            changed.add(story);
        }
        storyRepository.saveAll(changed);
    }

    private static String text(Object value) {
        if (value == null) return null;
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }
    
    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }
}