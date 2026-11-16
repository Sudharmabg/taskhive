package com.taskhive.taskhive_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * A checklist item belonging to a Task or Bug.
 */
@Entity
@Table(name = "subtasks", indexes = @Index(name = "idx_subtasks_story_id", columnList = "story_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Subtask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "story_id", nullable = false)
    private Long storyId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column(name = "position")
    private Integer position = 0;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
