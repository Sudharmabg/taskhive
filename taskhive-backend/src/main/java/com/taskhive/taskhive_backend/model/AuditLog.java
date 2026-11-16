package com.taskhive.taskhive_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Who created, edited or deleted an Epic, Task or Bug, and what changed.
 * Story key and title are copied so entries stay readable after a story is deleted.
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_logs_story_id", columnList = "story_id"),
    @Index(name = "idx_audit_logs_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
public class AuditLog {

    public enum Action { CREATED, UPDATED, DELETED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "story_id")
    private Long storyId;

    @Column(name = "story_key", length = 20)
    private String storyKey;

    @Column(name = "story_title", length = 200)
    private String storyTitle;

    @Column(name = "story_type", length = 20)
    private String storyType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Action action;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name", length = 100)
    private String userName;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
