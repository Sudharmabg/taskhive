package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    /** Story-level attachments only (metadata, no file contents). */
    List<AttachmentInfo> findByStoryIdAndSubtaskIdIsNullOrderByUploadedAtAsc(Long storyId);

    /** Attachments of one subtask (metadata, no file contents). */
    List<AttachmentInfo> findBySubtaskIdOrderByUploadedAtAsc(Long subtaskId);

    long countBySubtaskId(Long subtaskId);

    /** Deletes story-level and subtask attachments of the story. */
    @Modifying
    @Transactional
    @Query("delete from Attachment a where a.storyId = :storyId")
    void deleteByStoryId(@Param("storyId") Long storyId);

    @Modifying
    @Transactional
    @Query("delete from Attachment a where a.subtaskId = :subtaskId")
    void deleteBySubtaskId(@Param("subtaskId") Long subtaskId);
}
