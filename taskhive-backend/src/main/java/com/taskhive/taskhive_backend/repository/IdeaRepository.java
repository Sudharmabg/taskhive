package com.taskhive.taskhive_backend.repository;

import com.taskhive.taskhive_backend.model.Idea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IdeaRepository extends JpaRepository<Idea, Long> {
    List<Idea> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
}
