package com.taskhive.taskhive_backend.config;

import com.taskhive.taskhive_backend.model.*;
import com.taskhive.taskhive_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "root";
    private static final String ADMIN_EMPLOYEE_ID = "EMP001";
    private static final String ADMIN_PASSWORD = "root123";

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final SprintRepository sprintRepository;
    private final StoryRepository storyRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (companyRepository.count() == 0) {
            initializeMinimalData();
        } else {
            // Ensure admin user exists (and has a valid password)
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
        admin.setEmployeeId(ADMIN_EMPLOYEE_ID);
        admin.setName("Admin User");
        admin.setEmail(ADMIN_EMAIL);
        admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD)); // encodes 'root123'
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
        User admin = userRepository.findByEmail(ADMIN_EMAIL)
                .or(() -> userRepository.findByCompanyIdAndEmployeeId(company.getId(), ADMIN_EMPLOYEE_ID))
                .orElse(null);

        if (admin == null) {
            admin = new User();
            admin.setCompany(company);
            admin.setEmployeeId(ADMIN_EMPLOYEE_ID);
            admin.setName("Admin User");
            admin.setEmail(ADMIN_EMAIL);
            admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD)); // encodes 'root123'
            admin.setDesignation("Administrator");
            admin.setJobRole(User.JobRole.BE);
            admin.setRole(User.Role.ADMIN);
            admin.setStatus(User.Status.ACTIVE);
            userRepository.save(admin);
            log.info("Created missing admin user");
        } else if (admin.getPassword() == null
                || !passwordEncoder.matches(ADMIN_PASSWORD, admin.getPassword())) {
            // Repair an admin row whose stored hash doesn't match the expected password
            admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            admin.setStatus(User.Status.ACTIVE);
            userRepository.save(admin);
            log.info("Reset admin user password to default");
        } else {
            log.info("Admin user already exists");
        }
    }
}
