package com.taskhive.taskhive_backend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TeamResponse {
    private Long id;
    private String name;
    private String description;
    private List<String> members;
    private LocalDateTime createdAt;
    /** Task and bug counts for items assigned to any member. */
    private TaskStats stats;
    /** Same counts per member, in member order. */
    private List<MemberStats> memberStats;
    /** Members on approved leave today. */
    private List<String> onLeaveToday;

    public TeamResponse(Long id, String name, String description, List<String> members, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.members = members;
        this.createdAt = createdAt;
    }

    @Data
    public static class TaskStats {
        private int total;
        private int completed;
        private int inProgress;
        private int pending;
        private int overdue;

        /** Whole percent of items completed (0 when there are none). */
        public int getCompletionRate() {
            return total == 0 ? 0 : Math.round(completed * 100f / total);
        }
    }

    @Data
    public static class MemberStats {
        private final String name;
        private final TaskStats stats = new TaskStats();
    }
}
