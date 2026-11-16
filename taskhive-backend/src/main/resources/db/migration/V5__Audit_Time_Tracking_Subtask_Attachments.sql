-- Who created / last edited each story, and the assignee's estimate
ALTER TABLE stories ADD COLUMN created_by_name VARCHAR(100);
ALTER TABLE stories ADD COLUMN updated_by BIGINT;
ALTER TABLE stories ADD COLUMN updated_by_name VARCHAR(100);
ALTER TABLE stories ADD COLUMN estimated_hours NUMERIC(7, 2);

-- Attachments can belong to a subtask
ALTER TABLE story_attachments ADD COLUMN subtask_id BIGINT REFERENCES subtasks(id) ON DELETE CASCADE;
CREATE INDEX idx_story_attachments_subtask_id ON story_attachments(subtask_id);

-- Daily time logs on Tasks and Bugs
CREATE TABLE time_logs (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    user_name VARCHAR(100),
    work_date DATE NOT NULL,
    hours NUMERIC(5, 2) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_time_logs_story_id ON time_logs(story_id);
CREATE INDEX idx_time_logs_user_date ON time_logs(user_id, work_date);

-- Audit trail for Epics, Tasks and Bugs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT,
    story_id BIGINT,
    story_key VARCHAR(20),
    story_title VARCHAR(200),
    story_type VARCHAR(20),
    action VARCHAR(20) NOT NULL,
    details TEXT,
    user_id BIGINT,
    user_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_story_id ON audit_logs(story_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
