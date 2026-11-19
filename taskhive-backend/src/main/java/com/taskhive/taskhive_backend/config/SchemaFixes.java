package com.taskhive.taskhive_backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Small schema changes that ddl-auto=update can't make on its own. Each statement is
 * idempotent and runs on every start; failures are logged, never fatal.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class SchemaFixes implements ApplicationRunner {

    private static final String[] STATEMENTS = {
        // job_role used to be an enum: Hibernate added a CHECK limiting it to the presets and
        // sized the column for them. Custom roles need both lifted.
        "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_job_role_check",
        "ALTER TABLE users ALTER COLUMN job_role TYPE VARCHAR(50)",
    };

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        for (String sql : STATEMENTS) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception e) {
                log.warn("Schema fix skipped ({}): {}", sql, e.getMessage());
            }
        }
    }
}
