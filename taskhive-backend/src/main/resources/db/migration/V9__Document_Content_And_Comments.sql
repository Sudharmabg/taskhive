-- Document content editing and Google Doc-style comments
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content TEXT;

CREATE TABLE IF NOT EXISTS document_comments (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    company_id BIGINT REFERENCES companies(id),
    user_id BIGINT REFERENCES users(id),
    user_name VARCHAR(100),
    selected_text VARCHAR(1000),
    content TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    parent_id BIGINT REFERENCES document_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_comments_doc ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_parent ON document_comments(parent_id);
