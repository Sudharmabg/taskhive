package com.taskhive.taskhive_backend.service;

import com.taskhive.taskhive_backend.model.Sprint;

import java.util.List;

public interface SprintService {
    List<Sprint> getAllSprintsByCompany(Long companyId);
    Sprint getSprintById(Long id);
    Sprint getSprintBySprintId(String sprintId);
    Sprint getCurrentSprint(Long companyId);
    Sprint createSprint(Sprint sprint);
    Sprint updateSprint(Long id, Sprint sprint);
    Sprint closeSprint(Long id);
    void deleteSprint(Long id);
}