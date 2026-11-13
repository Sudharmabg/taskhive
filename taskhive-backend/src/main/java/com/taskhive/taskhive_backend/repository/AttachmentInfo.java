package com.taskhive.taskhive_backend.repository;

import java.time.LocalDateTime;

/** Attachment metadata projection (excludes the file contents). */
public interface AttachmentInfo {
    Long getId();
    Long getStoryId();
    String getFileName();
    String getContentType();
    Long getFileSize();
    String getUploadedBy();
    LocalDateTime getUploadedAt();
}
