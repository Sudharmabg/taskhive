package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.DocumentFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentFileRepository extends JpaRepository<DocumentFile, Long> {
}
