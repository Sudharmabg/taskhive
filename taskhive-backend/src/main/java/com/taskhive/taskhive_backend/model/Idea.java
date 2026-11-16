package com.taskhive.taskhive_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/** An idea anyone in the company can post and upvote; admins move it through review. */
@Entity
@Table(name = "ideas", indexes = {
    @Index(name = "idx_ideas_company", columnList = "company_id")
})
@Data
@NoArgsConstructor
public class Idea {

    public enum Category { PRODUCT, PROCESS, TECHNICAL, CULTURE, OTHER }

    public enum Status { NEW, UNDER_REVIEW, PLANNED, IMPLEMENTED, DECLINED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category = Category.OTHER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.NEW;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(name = "author_name", length = 100)
    private String authorName;

    /** Admin's reply shown with the status (e.g. why it was declined). */
    @Column(name = "admin_note", length = 500)
    private String adminNote;

    @Column(name = "status_changed_by_name", length = 100)
    private String statusChangedByName;

    @Column(name = "vote_count", nullable = false)
    private int voteCount;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
