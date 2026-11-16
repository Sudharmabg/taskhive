package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.TimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {

    List<TimeLog> findByStoryIdOrderByWorkDateDescIdDesc(Long storyId);

    /** Total hours a user has logged on a day, across all items. */
    @Query("select coalesce(sum(t.hours), 0) from TimeLog t where t.userId = :userId and t.workDate = :date")
    BigDecimal sumHoursForUserOnDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Modifying
    @Transactional
    @Query("delete from TimeLog t where t.storyId = :storyId")
    void deleteByStoryId(@Param("storyId") Long storyId);
}
