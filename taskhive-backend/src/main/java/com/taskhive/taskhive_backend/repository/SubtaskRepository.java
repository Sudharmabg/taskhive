package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {

    List<Subtask> findByStoryIdOrderByPositionAscIdAsc(Long storyId);

    long countByStoryId(Long storyId);

    @Modifying
    @Transactional
    @Query("delete from Subtask s where s.storyId = :storyId")
    void deleteByStoryId(@Param("storyId") Long storyId);
}
