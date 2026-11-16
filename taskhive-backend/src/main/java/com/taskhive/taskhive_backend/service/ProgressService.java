package com.taskhive.taskhive_backend.service;

import com.taskhive.taskhive_backend.model.Sprint;
import com.taskhive.taskhive_backend.model.Story;
import com.taskhive.taskhive_backend.model.Subtask;
import com.taskhive.taskhive_backend.repository.SprintRepository;
import com.taskhive.taskhive_backend.repository.StoryRepository;
import com.taskhive.taskhive_backend.repository.SubtaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * Single source of truth for progress values. Progress is always derived on the server;
 * values sent by clients are ignored.
 *
 * Task / Bug
 *   - Completed status                      -> 100%
 *   - has subtasks                          -> % of subtasks completed
 *   - no subtasks                           -> from status (Pending 0, In Progress 50)
 * Epic
 *   - Completed status                      -> 100%
 *   - has linked Tasks/Bugs                 -> average progress of those items
 *   - nothing linked                        -> from status
 * Sprint
 *   - Completed sprint                      -> 100%
 *   - otherwise                             -> average progress of its stories, weighted by
 *                                              story points when every story has points
 *
 * "Overdue" says nothing about how far along an item is, so it keeps its last value
 * when progress would otherwise come from status.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressService {

    private final StoryRepository storyRepository;
    private final SubtaskRepository subtaskRepository;
    private final SprintRepository sprintRepository;

    /**
     * Recalculate a story, then everything that rolls up from it: its epic, and the
     * sprints of both.
     */
    @Transactional
    public void recalculateStory(Long storyId) {
        if (storyId == null) return;
        storyRepository.findById(storyId).ifPresent(story -> {
            updateStory(story);
            recalculateSprint(story.getSprintId());

            if (story.getEpicId() != null) {
                storyRepository.findById(story.getEpicId()).ifPresent(epic -> {
                    updateStory(epic);
                    recalculateSprint(epic.getSprintId());
                });
            }
        });
    }

    @Transactional
    public void recalculateSprint(Long sprintId) {
        if (sprintId == null) return;
        sprintRepository.findById(sprintId).ifPresent(sprint -> {
            int progress = computeSprintProgress(sprint);
            if (!Objects.equals(sprint.getProgress(), progress)) {
                sprint.setProgress(progress);
                sprintRepository.save(sprint);
            }
        });
    }

    /** Bring every stored value in line with the rules above (runs on startup). */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void recalculateAll() {
        try {
            List<Story> stories = storyRepository.findAll();
            // Tasks and Bugs first, so epics average up-to-date values
            stories.stream().filter(s -> !isEpic(s)).forEach(this::updateStory);
            stories.stream().filter(this::isEpic).forEach(this::updateStory);
            sprintRepository.findAll().forEach(sprint -> recalculateSprint(sprint.getId()));
            log.info("Recalculated progress for {} stories", stories.size());
        } catch (Exception e) {
            log.error("Failed to recalculate progress on startup: {}", e.getMessage());
        }
    }

    /** Status-based progress, or null when the status gives no information (Overdue). */
    public static Integer progressFromStatus(String status) {
        String s = normalize(status);
        switch (s) {
            case "completed":
            case "done":
                return 100;
            case "in progress":
                return 50;
            case "overdue":
                return null;
            default:
                return 0;
        }
    }

    private void updateStory(Story story) {
        int progress = computeStoryProgress(story);
        if (!Objects.equals(story.getProgress(), progress)) {
            story.setProgress(progress);
            storyRepository.save(story);
        }
    }

    private int computeStoryProgress(Story story) {
        Integer fromStatus = progressFromStatus(story.getStatus());
        if (fromStatus != null && fromStatus == 100) {
            return 100;
        }

        if (isEpic(story)) {
            List<Story> children = storyRepository.findByEpicId(story.getId());
            if (!children.isEmpty()) {
                double avg = children.stream()
                    .mapToInt(c -> c.getProgress() == null ? 0 : c.getProgress())
                    .average()
                    .orElse(0);
                return clamp((int) Math.round(avg));
            }
        } else {
            List<Subtask> subtasks = subtaskRepository.findByStoryIdOrderByPositionAscIdAsc(story.getId());
            if (!subtasks.isEmpty()) {
                long done = subtasks.stream().filter(st -> Boolean.TRUE.equals(st.getCompleted())).count();
                return clamp((int) Math.round(done * 100.0 / subtasks.size()));
            }
        }

        if (fromStatus != null) {
            return fromStatus;
        }
        // Overdue: keep the last known value
        return clamp(story.getProgress() == null ? 0 : story.getProgress());
    }

    private int computeSprintProgress(Sprint sprint) {
        if (sprint.getStatus() == Sprint.Status.COMPLETED) {
            return 100;
        }
        List<Story> stories = storyRepository.findBySprintId(sprint.getId());
        if (stories.isEmpty()) {
            return 0;
        }

        boolean allPointed = stories.stream()
            .allMatch(s -> s.getStoryPoints() != null && s.getStoryPoints() > 0);

        double weighted = 0;
        double totalWeight = 0;
        for (Story s : stories) {
            double weight = allPointed ? s.getStoryPoints() : 1;
            weighted += weight * (s.getProgress() == null ? 0 : s.getProgress());
            totalWeight += weight;
        }
        return clamp((int) Math.round(weighted / totalWeight));
    }

    private boolean isEpic(Story story) {
        return "epic".equals(normalize(story.getType()));
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase().replace('_', ' ');
    }

    private static int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }
}
