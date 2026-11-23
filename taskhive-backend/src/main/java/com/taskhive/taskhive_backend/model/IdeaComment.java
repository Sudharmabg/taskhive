package com.taskhive.taskhive_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * A comment on an Idea.
 * Supports threaded replies.
 */
@Entity
@Table(name = "idea_comments", indexes = {
    @Index(name = "idx_idea_comments_idea", columnList = "idea_id"),
    @Index(name = "idx_idea_comments_parent", columnList = "parent_id")
})
@Data
@NoArgsConstructor
public class IdeaComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idea_id", nullable = false)
    private Long ideaId;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name", length = 100)
    private String userName;

    /** The comment message. */
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    /** Points to parent comment ID if this is a reply in a thread. */
    @Column(name = "parent_id")
    private Long parentId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
