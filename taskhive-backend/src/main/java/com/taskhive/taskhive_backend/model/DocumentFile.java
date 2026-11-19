package com.taskhive.taskhive_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** File contents of a {@link Document}, keyed by the document's id. */
@Entity
@Table(name = "document_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentFile {

    @Id
    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "data", nullable = false, columnDefinition = "BYTEA")
    private byte[] data;
}
