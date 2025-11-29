package com.taskhive.taskhive_backend.config;

import com.taskhive.taskhive_backend.model.*;
import com.taskhive.taskhive_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final SprintRepository sprintRepository;
    private final StoryRepository storyRepository;
    
    @Override
    public void run(String... args) throws Exception {
        if (companyRepository.count() == 0) {
            initializeMinimalData();
        } else {
            // Ensure admin user exists
            ensureAdminUser();
        }
    }
    
    private void initializeMinimalData() {
        // Create only company and admin user for login
        Company company = new Company();
        company.setName("TaskHive Demo");
        company.setCode("EMP");
        company.setDomain("taskhive.com");
        company.setSubscriptionPlan("PREMIUM");
        company.setMaxUsers(100);
        company = companyRepository.save(company);
        
        // Create admin user for login
        User admin = new User();
        admin.setCompany(company);
        admin.setEmployeeId("EMP001");
        admin.setName("Admin User");
        admin.setEmail("root");
        admin.setPassword("$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi."); // bcrypt for 'root123'
        admin.setDesignation("Administrator");
        admin.setJobRole(User.JobRole.BE);
        admin.setRole(User.Role.ADMIN);
        admin.setStatus(User.Status.ACTIVE);
        userRepository.save(admin);
        
        log.info("Initialized minimal data: 1 company, 1 admin user");
    }
    
    private void ensureAdminUser() {
        Company company = companyRepository.findAll().get(0);
        
        // Check if admin user exists by email or employeeId
        boolean adminExists = userRepository.findByEmail("root").isPresent() || 
                             userRepository.findByCompanyIdAndEmployeeId(company.getId(), "EMP001").isPresent();
        
        if (!adminExists) {
            User admin = new User();
            admin.setCompany(company);
            admin.setEmployeeId("EMP001");
            admin.setName("Admin User");
            admin.setEmail("root");
            admin.setPassword("$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi."); // bcrypt for 'root123'
            admin.setDesignation("Administrator");
            admin.setJobRole(User.JobRole.BE);
            admin.setRole(User.Role.ADMIN);
            admin.setStatus(User.Status.ACTIVE);
            userRepository.save(admin);
            log.info("Created missing admin user");
        } else {
            log.info("Admin user already exists");
        }
    }
}