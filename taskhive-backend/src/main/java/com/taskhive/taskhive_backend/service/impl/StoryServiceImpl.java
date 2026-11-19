package com.taskhive.taskhive_backend.service.impl;

import com.taskhive.taskhive_backend.model.AuditLog;
import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.User;
import com.taskhive.taskhive_backend.model.Company;
import com.taskhive.taskhive_backend.repository.AttachmentRepository;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import com.taskhive.taskhive_backend.repository.SubtaskRepository;
import com.taskhive.taskhive_backend.repository.CompanyRepository;
import com.taskhive.taskhive_backend.service.AuditService;
import com.taskhive.taskhive_backend.service.CurrentUserService;
import com.taskhive.taskhive_backend.service.ProgressService;
import com.taskhive.taskhive_backend.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StoryServiceImpl implements StoryService {
    
    private final StoryRepository storyRepository;
    private final CompanyRepository companyRepository;
    private final AttachmentRepository attachmentRepository;
    private final SubtaskRepository subtaskRepository;
    private final ProgressService progressService;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;
    private final com.taskhive.taskhive_backend.repository.TimeLogRepository timeLogRepository;
    private final com.taskhive.taskhive_backend.repository.TeamRepository teamRepository;
    private final com.taskhive.taskhive_backend.service.StoryAccessService storyAccessService;

    @Override
    public List<Story> getAllStoriesByCompany(Long companyId) {
        return storyRepository.findByCompanyId(companyId);
    }
    
    @Override
    public List<Story> getStoriesByType(Long companyId, String type) {
        return storyRepository.findByCompanyIdAndType(companyId, type);
    }
    
    @Override
    public List<Story> getStoriesBySprintId(Long sprintId) {
        return storyRepository.findBySprintId(sprintId);
    }
    
    @Override
    public List<Story> getAvailableStories(Long companyId) {
        return storyRepository.findByCompanyIdAndSprintIdIsNull(companyId);
    }
    
    @Override
    public Story getStoryById(Long id) {
        return storyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Story not found with id: " + id));
    }
    
    @Override
    public Story getStoryByStoryId(String storyId) {
        return storyRepository.findByStoryId(storyId)
            .orElseThrow(() -> new RuntimeException("Story not found with storyId: " + storyId));
    }
    
    @Override
    public Story createStory(Story story) {
        // Set company if not set (default to company 1)
        if (story.getCompany() == null) {
            Company company = companyRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default company not found"));
            story.setCompany(company);
        }
        
        // Generate story ID based on type and company
        String prefix = story.getCompany().getCode() + "-" + 
                       story.getType().substring(0, 1);
        long count = storyRepository.count() + 1;
        story.setStoryId(prefix + String.format("%04d", count));
        
        story.setEpicId(resolveEpicId(story.getType(), story.getEpicId(), null));

        Optional<User> currentUser = currentUserService.get();
        story.setTeamId(resolveTeamId(story, currentUser.orElse(null), null));

        // Never trust client-supplied attribution, progress or estimate
        story.setProgress(0);
        story.setEstimatedHours(null);
        story.setCreatedBy(currentUser.map(User::getId).orElse(null));
        story.setCreatedByName(currentUserService.displayName());
        story.setUpdatedBy(story.getCreatedBy());
        story.setUpdatedByName(story.getCreatedByName());
        
        Story saved = storyRepository.save(story);
        auditService.record(saved, AuditLog.Action.CREATED, "Created " + saved.getType() + " \"" + saved.getTitle() + "\"");
        progressService.recalculateStory(saved.getId());
        return getStoryById(saved.getId());
    }
    
    @Override
    public Story updateStory(Long id, Story story) {
        Story existingStory = getStoryById(id);
        Long previousEpicId = existingStory.getEpicId();
        Long newEpicId = resolveEpicId(existingStory.getType(), story.getEpicId(), previousEpicId);
        Long previousTeamId = existingStory.getTeamId();
        story.setEpicId(newEpicId);
        Long newTeamId = resolveTeamId(story, currentUserService.get().orElse(null), existingStory);

        List<String> changes = new ArrayList<>();
        AuditService.diff(changes, "Title", existingStory.getTitle(), story.getTitle());
        AuditService.diffText(changes, "Description", existingStory.getDescription(), story.getDescription());
        AuditService.diff(changes, "Priority", existingStory.getPriority(), story.getPriority());
        AuditService.diff(changes, "Status", existingStory.getStatus(), story.getStatus());
        AuditService.diff(changes, "Assignees", existingStory.getAssigneeName(), story.getAssigneeName());
        AuditService.diff(changes, "Story points", existingStory.getStoryPoints(), story.getStoryPoints());
        AuditService.diff(changes, "Deadline", existingStory.getDeadline(), story.getDeadline());
        AuditService.diffText(changes, "Acceptance criteria", existingStory.getAcceptanceCriteria(), story.getAcceptanceCriteria());
        AuditService.diff(changes, "Epic", epicLabel(previousEpicId), epicLabel(newEpicId));
        AuditService.diff(changes, "Team", teamLabel(previousTeamId), teamLabel(newTeamId));

        existingStory.setTitle(story.getTitle());
        existingStory.setDescription(story.getDescription());
        existingStory.setPriority(story.getPriority());
        existingStory.setStatus(story.getStatus());
        existingStory.setAssigneeId(story.getAssigneeId());
        existingStory.setAssigneeName(story.getAssigneeName());
        existingStory.setStoryPoints(story.getStoryPoints());
        existingStory.setDeadline(story.getDeadline());
        existingStory.setAcceptanceCriteria(story.getAcceptanceCriteria());
        existingStory.setEpicId(newEpicId);
        existingStory.setTeamId(newTeamId);
        // progress is derived by ProgressService, estimate has its own endpoint
        
        if (!changes.isEmpty()) {
            existingStory.setUpdatedBy(currentUserService.get().map(User::getId).orElse(null));
            existingStory.setUpdatedByName(currentUserService.displayName());
        }
        storyRepository.save(existingStory);
        if (!changes.isEmpty()) {
            auditService.record(existingStory, AuditLog.Action.UPDATED, String.join("\n", changes));
        }
        progressService.recalculateStory(id);
        if (previousEpicId != null && !previousEpicId.equals(existingStory.getEpicId())) {
            progressService.recalculateStory(previousEpicId);
        }
        return getStoryById(id);
    }
    
    @Override
    @Transactional
    public void deleteStory(Long id) {
        Story story = getStoryById(id);
        Long epicId = story.getEpicId();
        Long sprintId = story.getSprintId();
        auditService.record(story, AuditLog.Action.DELETED, "Deleted " + story.getType() + " \"" + story.getTitle() + "\"");
        attachmentRepository.deleteByStoryId(id);
        subtaskRepository.deleteByStoryId(id);
        timeLogRepository.deleteByStoryId(id);
        // Unlink tasks/bugs that belonged to this epic
        List<Story> children = storyRepository.findByEpicId(id);
        children.forEach(child -> child.setEpicId(null));
        storyRepository.saveAll(children);
        storyRepository.deleteById(id);
        storyRepository.flush();
        progressService.recalculateStory(epicId);
        progressService.recalculateSprint(sprintId);
    }
    
    @Override
    public List<Story> getStoriesByEpicId(Long epicId) {
        return storyRepository.findByEpicId(epicId);
    }
    
    private String epicLabel(Long epicId) {
        if (epicId == null) return null;
        return storyRepository.findById(epicId)
            .map(e -> (e.getStoryId() != null ? e.getStoryId() + " " : "") + e.getTitle())
            .orElse("#" + epicId);
    }
    
    /**
     * Only Tasks and Bugs can belong to an epic, and the target must be an Epic.
     */
    private Long resolveEpicId(String type, Long epicId, Long currentEpicId) {
        if (epicId == null || type == null || type.equalsIgnoreCase("Epic")) {
            return null;
        }
        Story epic = storyRepository.findById(epicId)
            // Keeping the current epic is fine; linking to a new one needs access to it
            .filter(e -> epicId.equals(currentEpicId) || storyAccessService.canView(e))
            .orElseThrow(() -> new RuntimeException("Epic not found with id: " + epicId));
        if (!"Epic".equalsIgnoreCase(epic.getType())) {
            throw new RuntimeException("Story " + epicId + " is not an Epic");
        }
        return epicId;
    }

    /**
     * Which team owns the item. Admins choose the team (a Task or Bug left without one takes
     * its epic's team). Other users can't move items between teams: new items go to their own
     * team, existing items keep theirs.
     */
    private Long resolveTeamId(Story requested, User user, Story existing) {
        if (user != null && !CurrentUserService.isAdmin(user)) {
            if (existing != null) return existing.getTeamId();
            return user.getTeamId() != null ? user.getTeamId() : epicTeamId(requested.getEpicId());
        }
        Long teamId = requested.getTeamId();
        if (teamId != null) {
            Long companyId = requested.getCompany() != null ? requested.getCompany().getId()
                : existing != null && existing.getCompany() != null ? existing.getCompany().getId() : null;
            boolean valid = teamRepository.findById(teamId)
                .map(t -> companyId == null || t.getCompany() == null || companyId.equals(t.getCompany().getId()))
                .orElse(false);
            if (!valid) throw new RuntimeException("Team not found with id: " + teamId);
            return teamId;
        }
        return epicTeamId(requested.getEpicId());
    }

    private Long epicTeamId(Long epicId) {
        if (epicId == null) return null;
        return storyRepository.findById(epicId).map(Story::getTeamId).orElse(null);
    }

    private String teamLabel(Long teamId) {
        if (teamId == null) return null;
        return teamRepository.findById(teamId).map(t -> t.getName()).orElse("#" + teamId);
    }
    
    @Override
    public Story addStoryToSprint(Long storyId, Long sprintId) {
        Story story = getStoryById(storyId);
        Long previousSprintId = story.getSprintId();
        story.setSprintId(sprintId);
        Story saved = storyRepository.save(story);
        progressService.recalculateSprint(sprintId);
        if (previousSprintId != null && !previousSprintId.equals(sprintId)) {
            progressService.recalculateSprint(previousSprintId);
        }
        return saved;
    }
    
    @Override
    public Story removeStoryFromSprint(Long storyId) {
        Story story = getStoryById(storyId);
        Long previousSprintId = story.getSprintId();
        story.setSprintId(null);
        Story saved = storyRepository.save(story);
        progressService.recalculateSprint(previousSprintId);
        return saved;
    }
}