package com.taskhive.taskhive_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * A company document with free-form tags. The file bytes live in {@link DocumentFile}
 * so listing documents never loads file contents.
 */
@Entity
@Table(name = "documents", indexes = {
    @Index(name = "idx_documents_company", columnList = "company_id")
})
@Data
@NoArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id")
    private Long companyId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "content_type", length = 150)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /** Lower-case tags, e.g. "policy", "onboarding". */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "document_tags", joinColumns = @JoinColumn(name = "document_id"),
        indexes = @Index(name = "idx_document_tags_tag", columnList = "tag"))
    @Column(name = "tag", nullable = false, length = 30)
    @BatchSize(size = 100)
    private Set<String> tags = new LinkedHashSet<>();

    @Column(name = "uploaded_by")
    private Long uploadedBy;

    @Column(name = "uploaded_by_name", length = 100)
    private String uploadedByName;

    @Column(name = "updated_by_name", length = 100)
    private String updatedByName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
