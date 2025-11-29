package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.dto.TeamCreateRequest;
import com.taskhive.taskhive_backend.dto.TeamResponse;
import com.taskhive.taskhive_backend.model.Team;
import com.taskhive.taskhive_backend.model.Company;
import com.taskhive.taskhive_backend.repository.TeamRepository;
import com.taskhive.taskhive_backend.repository.UserRepository;
import com.taskhive.taskhive_backend.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class TeamController {
    
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    
    @GetMapping
    public ResponseEntity<?> getAllTeams(@RequestParam Long companyId) {
        log.info("[ENTRY] GET /api/teams - companyId: {}", companyId);
        try {
            List<Team> teams = teamRepository.findByCompanyId(companyId);
            
            List<TeamResponse> teamResponses = teams.stream().map(team -> {
                List<String> memberNames = userRepository.findByTeamId(team.getId())
                    .stream().map(user -> user.getName()).toList();
                log.info("Team {} has {} members: {}", team.getName(), memberNames.size(), memberNames);
                return new TeamResponse(team.getId(), team.getName(), team.getDescription(), 
                    memberNames, team.getCreatedAt());
            }).toList();
            
            log.info("[EXIT] GET /api/teams - Success: 200, Found {} teams", teamResponses.size());
            return ResponseEntity.ok(teamResponses);
        } catch (Exception e) {
            log.error("[EXIT] GET /api/teams - Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createTeam(@RequestBody TeamCreateRequest request, @RequestParam Long companyId) {
        log.info("[ENTRY] POST /api/teams - Name: {}, Members: {}, CompanyId: {}", request.getName(), request.getMembers().size(), companyId);
        try {
            Team team = new Team();
            team.setName(request.getName());
            team.setDescription(request.getDescription());
            
            // Get company by ID
            Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));
            team.setCompany(company);
            
            Team createdTeam = teamRepository.save(team);
            log.info("[EXIT] POST /api/teams - Success: 200, Created ID: {}", createdTeam.getId());
            return ResponseEntity.ok(createdTeam);
        } catch (Exception e) {
            log.error("[EXIT] POST /api/teams - Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTeam(@PathVariable Long id, @RequestBody TeamCreateRequest request) {
        log.info("[ENTRY] PUT /api/teams/{} - Name: {}", id, request.getName());
        try {
            Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));
            
            team.setName(request.getName());
            team.setDescription(request.getDescription());
            
            Team updatedTeam = teamRepository.save(team);
            log.info("[EXIT] PUT /api/teams/{} - Success: 200", id);
            return ResponseEntity.ok(updatedTeam);
        } catch (Exception e) {
            log.error("[EXIT] PUT /api/teams/{} - Error: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PutMapping("/{id}/members")
    public ResponseEntity<?> updateTeamMembers(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        log.info("[ENTRY] PUT /api/teams/{}/members", id);
        try {
            @SuppressWarnings("unchecked")
            List<String> memberNames = (List<String>) request.get("members");
            
            // First, remove all users from this team
            List<com.taskhive.taskhive_backend.model.User> currentMembers = userRepository.findByTeamId(id);
            for (com.taskhive.taskhive_backend.model.User user : currentMembers) {
                user.setTeamId(null);
                userRepository.save(user);
            }
            
            // Then, assign selected users to this team
            for (String memberName : memberNames) {
                List<com.taskhive.taskhive_backend.model.User> users = userRepository.findByCompanyId(1L);
                com.taskhive.taskhive_backend.model.User user = users.stream()
                    .filter(u -> u.getName().equals(memberName))
                    .findFirst()
                    .orElse(null);
                if (user != null) {
                    user.setTeamId(id);
                    userRepository.save(user);
                }
            }
            
            log.info("[EXIT] PUT /api/teams/{}/members - Success: 200, Updated {} members", id, memberNames.size());
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Team members updated successfully"
            ));
        } catch (Exception e) {
            log.error("[EXIT] PUT /api/teams/{}/members - Error: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long id) {
        log.info("[ENTRY] DELETE /api/teams/{}", id);
        try {
            // First, remove team assignment from all users in this team
            List<com.taskhive.taskhive_backend.model.User> teamMembers = userRepository.findByTeamId(id);
            for (com.taskhive.taskhive_backend.model.User user : teamMembers) {
                user.setTeamId(null);
                userRepository.save(user);
            }
            
            // Then delete the team
            teamRepository.deleteById(id);
            
            log.info("[EXIT] DELETE /api/teams/{} - Success: 200", id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Team deleted successfully"
            ));
        } catch (Exception e) {
            log.error("[EXIT] DELETE /api/teams/{} - Error: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}