-- Comments on stories (tasks, epics, bugs) and ideas
CREATE TABLE IF NOT EXISTS story_comments (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    company_id BIGINT REFERENCES companies(id),
    user_id BIGINT REFERENCES users(id),
    user_name VARCHAR(100),
    content TEXT NOT NULL,
    parent_id BIGINT REFERENCES story_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_story_comments_story ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_parent ON story_comments(parent_id);

CREATE TABLE IF NOT EXISTS idea_comments (
    id BIGSERIAL PRIMARY KEY,
    idea_id BIGINT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    company_id BIGINT REFERENCES companies(id),
    user_id BIGINT REFERENCES users(id),
    user_name VARCHAR(100),
    content TEXT NOT NULL,
    parent_id BIGINT REFERENCES idea_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_idea_comments_idea ON idea_comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_parent ON idea_comments(parent_id);
