-- TaskHive Database Schema
-- PostgreSQL Script

-- Drop tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS story_assignees CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS company_inquiries CASCADE;

-- 1. Company Inquiries Table
CREATE TABLE company_inquiries (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Companies Table
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    domain VARCHAR(100),
    subscription_plan VARCHAR(20) DEFAULT 'FREE',
    max_users INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Teams Table
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, name)
);

-- 4. Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    designation VARCHAR(100),
    job_role VARCHAR(20) CHECK (job_role IN ('UI', 'BE', 'QA', 'DevOps')),
    team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, employee_id)
);

-- 5. Stories Table
CREATE TABLE stories (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    story_id VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(10) CHECK (type IN ('Epic', 'Task', 'Bug')),
    priority VARCHAR(10) CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    status VARCHAR(15) CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Overdue')),
    story_points INTEGER,
    deadline DATE,
    acceptance_criteria TEXT,
    progress INTEGER DEFAULT 0,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, story_id)
);

-- 6. Story Assignees Junction Table
CREATE TABLE story_assignees (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, user_id)
);

-- 7. Attachments Table
CREATE TABLE attachments (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_teams_company_id ON teams(company_id);
CREATE INDEX idx_stories_company_id ON stories(company_id);
CREATE INDEX idx_stories_created_by ON stories(created_by);
CREATE INDEX idx_story_assignees_story_id ON story_assignees(story_id);
CREATE INDEX idx_story_assignees_user_id ON story_assignees(user_id);
CREATE INDEX idx_attachments_story_id ON attachments(story_id);

-- Insert Sample Data
INSERT INTO companies (name, code, domain, subscription_plan, max_users) VALUES
('TaskHive Demo Company', 'EMP', 'taskhive.com', 'PREMIUM', 100),
('ABC Corporation', 'ABC', 'abc.com', 'FREE', 10);

INSERT INTO teams (company_id, name, description) VALUES
(1, 'Development Team', 'Frontend and Backend developers'),
(1, 'QA Team', 'Quality Assurance and Testing'),
(2, 'Engineering', 'Software Engineering Team');

INSERT INTO users (company_id, employee_id, name, email, password, designation, job_role, team_id, role, status) VALUES
(1, 'EMP001', 'John Admin', 'admin@taskhive.com', '$2a$10$example', 'Tech Lead', 'BE', 1, 'ADMIN', 'ACTIVE'),
(1, 'EMP002', 'Jane Developer', 'jane@taskhive.com', '$2a$10$example', 'Senior Developer', 'UI', 1, 'USER', 'ACTIVE'),
(1, 'EMP003', 'Bob Tester', 'bob@taskhive.com', '$2a$10$example', 'QA Engineer', 'QA', 2, 'USER', 'ACTIVE');

-- Sample Stories
INSERT INTO stories (company_id, story_id, title, description, type, priority, status, story_points, created_by) VALUES
(1, 'EMP-E1001', 'User Authentication System', 'Implement JWT-based authentication', 'Epic', 'High', 'In Progress', 13, 1),
(1, 'EMP-T2001', 'Login Page UI', 'Create responsive login page', 'Task', 'Medium', 'Completed', 5, 2),
(1, 'EMP-B3001', 'Password Reset Bug', 'Fix password reset email issue', 'Bug', 'Critical', 'Pending', 3, 3);

-- Sample Story Assignments
INSERT INTO story_assignees (story_id, user_id) VALUES
(1, 1), (1, 2),
(2, 2),
(3, 3);

COMMENT ON TABLE companies IS 'Multi-tenant companies using TaskHive';
COMMENT ON TABLE users IS 'Users belonging to companies with role-based access';
COMMENT ON TABLE stories IS 'Tasks, Epics, and Bugs with company isolation';
COMMENT ON TABLE story_assignees IS 'Many-to-many relationship between stories and users';