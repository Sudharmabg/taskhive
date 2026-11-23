package com.taskhive.taskhive_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * A comment within a document, Google Docs style.
 * Can be anchored to a selected text snippet and support threaded replies.
 */
@Entity
@Table(name = "document_comments", indexes = {
    @Index(name = "idx_document_comments_doc", columnList = "document_id"),
    @Index(name = "idx_document_comments_parent", columnList = "parent_id")
})
@Data
@NoArgsConstructor
public class DocumentComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name", length = 100)
    private String userName;

    /** Selected/highlighted text snippet in the document being commented on. */
    @Column(name = "selected_text", length = 1000)
    private String selectedText;

    /** The comment message. */
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    /** Whether the thread is resolved (Google Docs style checkmark). */
    @Column(name = "resolved", nullable = false)
    private Boolean resolved = false;

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
