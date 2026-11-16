-- Idea board
CREATE TABLE ideas (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL DEFAULT 'OTHER',
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    author_id BIGINT NOT NULL REFERENCES users(id),
    author_name VARCHAR(100),
    admin_note VARCHAR(500),
    status_changed_by_name VARCHAR(100),
    vote_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ideas_company ON ideas(company_id);

CREATE TABLE idea_votes (
    id BIGSERIAL PRIMARY KEY,
    idea_id BIGINT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    CONSTRAINT uk_idea_votes_idea_user UNIQUE (idea_id, user_id)
);

-- Leave requests
CREATE TABLE leave_requests (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    user_name VARCHAR(100),
    leave_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    half_day BOOLEAN NOT NULL DEFAULT FALSE,
    days NUMERIC(5, 1) NOT NULL,
    reason VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_by_name VARCHAR(100),
    review_note VARCHAR(500),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leave_requests_company ON leave_requests(company_id);
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
