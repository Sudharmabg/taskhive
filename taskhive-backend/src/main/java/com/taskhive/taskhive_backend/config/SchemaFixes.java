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
        // Several assignees joined by commas overflowed 100 characters and failed the insert
        "ALTER TABLE stories ALTER COLUMN assignee_name TYPE VARCHAR(1000)",
        // Document content editing and Google Doc-style comments
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS content TEXT",
        "CREATE TABLE IF NOT EXISTS document_comments (id BIGSERIAL PRIMARY KEY, document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE, company_id BIGINT, user_id BIGINT, user_name VARCHAR(100), selected_text VARCHAR(1000), content TEXT NOT NULL, resolved BOOLEAN NOT NULL DEFAULT FALSE, parent_id BIGINT REFERENCES document_comments(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE INDEX IF NOT EXISTS idx_document_comments_doc ON document_comments(document_id)",
        "CREATE INDEX IF NOT EXISTS idx_document_comments_parent ON document_comments(parent_id)",
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
