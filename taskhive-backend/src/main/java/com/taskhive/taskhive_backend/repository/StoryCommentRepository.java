package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.StoryComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoryCommentRepository extends JpaRepository<StoryComment, Long> {
    List<StoryComment> findByStoryIdOrderByCreatedAtAsc(Long storyId);
    long countByStoryId(Long storyId);
    void deleteByStoryId(Long storyId);
    void deleteByParentId(Long parentId);
}
