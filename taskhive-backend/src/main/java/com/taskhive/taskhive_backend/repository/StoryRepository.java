package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByCompanyId(Long companyId);
    List<Story> findByCompanyIdAndType(Long companyId, String type);
    List<Story> findBySprintId(Long sprintId);
    Optional<Story> findByStoryId(String storyId);
    List<Story> findByCompanyIdAndSprintIdIsNull(Long companyId);
}