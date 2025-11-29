package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByCompanyId(Long companyId);
    Optional<Sprint> findBySprintId(String sprintId);
    Optional<Sprint> findByCompanyIdAndStatus(Long companyId, Sprint.Status status);
}