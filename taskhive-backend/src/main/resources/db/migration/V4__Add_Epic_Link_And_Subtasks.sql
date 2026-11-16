-- Link Tasks and Bugs to a parent Epic
ALTER TABLE stories ADD COLUMN epic_id BIGINT REFERENCES stories(id) ON DELETE SET NULL;
CREATE INDEX idx_stories_epic_id ON stories(epic_id);

-- Subtasks (checklist items) for Tasks and Bugs
CREATE TABLE subtasks (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subtasks_story_id ON subtasks(story_id);
