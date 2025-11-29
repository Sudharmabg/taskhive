package com.taskhive.taskhive_backend.service.impl;

import com.taskhive.taskhive_backend.model.Sprint;
import com.taskhive.taskhive_backend.model.Company;
import com.taskhive.taskhive_backend.repository.SprintRepository;
import com.taskhive.taskhive_backend.repository.CompanyRepository;
import com.taskhive.taskhive_backend.service.SprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SprintServiceImpl implements SprintService {
    
    private final SprintRepository sprintRepository;
    private final CompanyRepository companyRepository;
    
    @Override
    public List<Sprint> getAllSprintsByCompany(Long companyId) {
        return sprintRepository.findByCompanyId(companyId);
    }
    
    @Override
    public Sprint getSprintById(Long id) {
        return sprintRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Sprint not found with id: " + id));
    }
    
    @Override
    public Sprint getSprintBySprintId(String sprintId) {
        return sprintRepository.findBySprintId(sprintId)
            .orElseThrow(() -> new RuntimeException("Sprint not found with sprintId: " + sprintId));
    }
    
    @Override
    public Sprint getCurrentSprint(Long companyId) {
        return sprintRepository.findByCompanyIdAndStatus(companyId, Sprint.Status.ACTIVE)
            .orElseThrow(() -> new RuntimeException("No active sprint found"));
    }
    
    @Override
    public Sprint createSprint(Sprint sprint) {
        // Set company if not set (default to company 1)
        if (sprint.getCompany() == null) {
            Company company = companyRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default company not found"));
            sprint.setCompany(company);
        }
        
        // Generate sprint ID
        long count = sprintRepository.count() + 1;
        sprint.setSprintId("SPR-" + String.format("%03d", count));
        
        return sprintRepository.save(sprint);
    }
    
    @Override
    public Sprint updateSprint(Long id, Sprint sprint) {
        Sprint existingSprint = getSprintById(id);
        
        existingSprint.setName(sprint.getName());
        existingSprint.setDescription(sprint.getDescription());
        existingSprint.setStartDate(sprint.getStartDate());
        existingSprint.setEndDate(sprint.getEndDate());
        existingSprint.setStatus(sprint.getStatus());
        existingSprint.setProgress(sprint.getProgress());
        
        return sprintRepository.save(existingSprint);
    }
    
    @Override
    public Sprint closeSprint(Long id) {
        Sprint sprint = getSprintById(id);
        sprint.setStatus(Sprint.Status.COMPLETED);
        sprint.setProgress(100);
        return sprintRepository.save(sprint);
    }
    
    @Override
    public void deleteSprint(Long id) {
        sprintRepository.deleteById(id);
    }
}