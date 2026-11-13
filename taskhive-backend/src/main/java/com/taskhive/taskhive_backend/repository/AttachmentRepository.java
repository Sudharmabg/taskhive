package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    /** Metadata only - avoids loading file contents when listing. */
    List<AttachmentInfo> findByStoryIdOrderByUploadedAtAsc(Long storyId);

    @Modifying
    @Query("delete from Attachment a where a.storyId = :storyId")
    void deleteByStoryId(@Param("storyId") Long storyId);
}
