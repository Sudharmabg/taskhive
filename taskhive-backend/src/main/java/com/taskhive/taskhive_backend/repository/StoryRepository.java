package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    List<Story> findByEpicId(Long epicId);
    List<Story> findByTeamId(Long teamId);
    boolean existsByStoryId(String storyId);

    /** Story keys starting with a prefix such as "ABC-T", used to pick the next number. */
    @Query("select s.storyId from Story s where s.storyId like concat(:prefix, '%')")
    List<String> findStoryIdsByPrefix(@Param("prefix") String prefix);
}