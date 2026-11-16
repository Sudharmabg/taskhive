package com.taskhive.taskhive_backend.controller;

import com.taskhive.taskhive_backend.dto.TeamCreateRequest;
import com.taskhive.taskhive_backend.dto.TeamResponse;
import com.taskhive.taskhive_backend.model.LeaveRequest;
import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.Team;
import com.taskhive.taskhive_backend.model.Company;
import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.repository.LeaveRequestRepository;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import com.taskhive.taskhive_backend.repository.TeamRepository;
import com.taskhive.taskhive_backend.repository.UserRepository;
import com.taskhive.taskhive_backend.repository.CompanyRepository;
import com.taskhive.taskhive_backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class TeamController {
    
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final StoryRepository storyRepository;
    private final LeaveRequestRepository leaveRepository;
    
    @GetMapping
    public ResponseEntity<?> getAllTeams(@RequestParam Long companyId) {
        log.info("[ENTRY] GET /api/teams - companyId: {}", companyId);
        try {
            List<Team> teams = teamRepository.findByCompanyId(companyId);
            // Epics are assigned to the whole team, so only Tasks and Bugs count towards stats
            List<Story> workItems = storyRepository.findByCompanyId(companyId).stream()
                .filter(s -> !"Epic".equalsIgnoreCase(s.getType()))
                .toList();
            LocalDate today = LocalDate.now();
            Set<Long> onLeave = new HashSet<>();
            leaveRepository.findByStatusBetween(companyId, LeaveRequest.Status.APPROVED, today, today)
                .forEach(l -> onLeave.add(l.getUserId()));

            List<TeamResponse> teamResponses = teams.stream().map(team -> {
                List<User> members = userRepository.findByTeamId(team.getId());
                List<String> memberNames = members.stream().map(User::getName).toList();
                TeamResponse response = new TeamResponse(team.getId(), team.getName(), team.getDescription(),
                    memberNames, team.getCreatedAt());
                fillStats(response, members, workItems, today);
                response.setOnLeaveToday(members.stream()
                    .filter(m -> onLeave.contains(m.getId())).map(User::getName).toList());
                return response;
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
            
            Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));
            Long companyId = team.getCompany().getId();

            // First, remove all users from this team
            List<com.taskhive.taskhive_backend.model.User> currentMembers = userRepository.findByTeamId(id);
            for (com.taskhive.taskhive_backend.model.User user : currentMembers) {
                user.setTeamId(null);
                userRepository.save(user);
            }
            
            // Then, assign selected users (from the team's own company) to this team
            List<com.taskhive.taskhive_backend.model.User> users = userRepository.findByCompanyId(companyId);
            for (String memberName : memberNames) {
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
    
    /**
     * Counts each Task/Bug once for the team if any member is among its assignees,
     * and once for every assigned member. Overdue follows the UI: unfinished and the
     * deadline day has passed (or the scheduler already marked it Overdue).
     */
    private static void fillStats(TeamResponse response, List<User> members, List<Story> items, LocalDate today) {
        TeamResponse.TaskStats teamStats = new TeamResponse.TaskStats();
        List<TeamResponse.MemberStats> perMember = members.stream()
            .map(m -> new TeamResponse.MemberStats(m.getName())).toList();
        for (Story story : items) {
            String bucket = bucketOf(story, today);
            boolean anyMember = false;
            for (int i = 0; i < members.size(); i++) {
                if (CurrentUserService.isAssignee(members.get(i), story.getAssigneeName())) {
                    add(perMember.get(i).getStats(), bucket);
                    anyMember = true;
                }
            }
            if (anyMember) add(teamStats, bucket);
        }
        response.setStats(teamStats);
        response.setMemberStats(perMember);
    }

    private static String bucketOf(Story story, LocalDate today) {
        String status = story.getStatus() == null ? "Pending" : story.getStatus();
        if ("Completed".equalsIgnoreCase(status)) return "completed";
        if ("Overdue".equalsIgnoreCase(status)
            || (story.getDeadline() != null && story.getDeadline().isBefore(today))) return "overdue";
        if ("In Progress".equalsIgnoreCase(status)) return "inProgress";
        return "pending";
    }

    private static void add(TeamResponse.TaskStats stats, String bucket) {
        stats.setTotal(stats.getTotal() + 1);
        switch (bucket) {
            case "completed" -> stats.setCompleted(stats.getCompleted() + 1);
            case "overdue" -> stats.setOverdue(stats.getOverdue() + 1);
            case "inProgress" -> stats.setInProgress(stats.getInProgress() + 1);
            default -> stats.setPending(stats.getPending() + 1);
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