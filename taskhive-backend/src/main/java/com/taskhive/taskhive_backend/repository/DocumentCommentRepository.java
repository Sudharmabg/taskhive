package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.DocumentComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentCommentRepository extends JpaRepository<DocumentComment, Long> {
    List<DocumentComment> findByDocumentIdOrderByCreatedAtAsc(Long documentId);
    void deleteByDocumentId(Long documentId);
    void deleteByParentId(Long parentId);
}
