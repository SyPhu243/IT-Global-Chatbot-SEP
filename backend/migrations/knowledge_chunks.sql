-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table to store knowledge chunks
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id SERIAL PRIMARY KEY,
    content TEXT,
    metadata JSONB,
    embedding VECTOR(768)
);

-- Create HNSW index for cosine similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
ON knowledge_chunks
USING hnsw (embedding vector_cosine_ops);
