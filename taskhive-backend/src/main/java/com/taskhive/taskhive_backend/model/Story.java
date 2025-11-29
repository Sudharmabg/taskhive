package com.taskhive.taskhive_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "stories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Story {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnore
    private Company company;
    
    @Column(name = "story_id", unique = true, nullable = false, length = 20)
    private String storyId;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, length = 20)
    private String type;
    
    @Column(length = 20)
    private String priority;
    
    @Column(length = 20)
    private String status;
    
    @Column(name = "assignee_id")
    private Long assigneeId;
    
    @Column(name = "assignee_name", length = 100)
    private String assigneeName;
    
    @Column(name = "story_points")
    private Integer storyPoints;
    
    @Column(name = "progress")
    private Integer progress = 0;
    
    @Column(name = "deadline")
    private LocalDate deadline;
    
    @Column(name = "acceptance_criteria", columnDefinition = "TEXT")
    private String acceptanceCriteria;
    
    @Column(name = "sprint_id")
    private Long sprintId;
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}