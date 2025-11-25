-- Optimize document searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_documents_title_trgm
ON documents
USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_documents_status_title
ON documents (status, title);
