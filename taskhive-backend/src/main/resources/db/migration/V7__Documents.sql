-- Document library with tags. Safe to re-run: the backend (ddl-auto=update)
-- may already have created these objects.
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id),
    title VARCHAR(150) NOT NULL,
    description VARCHAR(1000),
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(150),
    file_size BIGINT NOT NULL,
    uploaded_by BIGINT REFERENCES users(id),
    uploaded_by_name VARCHAR(100),
    updated_by_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);

CREATE TABLE IF NOT EXISTS document_tags (
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag VARCHAR(30) NOT NULL,
    PRIMARY KEY (document_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag);

-- File contents kept apart so listing documents never reads the bytes
CREATE TABLE IF NOT EXISTS document_files (
    document_id BIGINT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    data BYTEA NOT NULL
);
