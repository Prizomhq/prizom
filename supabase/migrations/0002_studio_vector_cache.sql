-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Table to cache visual hashes and their extracted AST responses for zero-latency retrieval
CREATE TABLE IF NOT EXISTS public.studio_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_hash TEXT NOT NULL UNIQUE,
    embedding VECTOR(1536), -- Assuming standard 1536d visual embeddings (e.g., CLIP/OpenAI)
    ast_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS studio_embeddings_vector_idx ON public.studio_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RPC for similarity matching
CREATE OR REPLACE FUNCTION match_studio_embeddings(
    query_embedding VECTOR(1536),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    image_hash TEXT,
    ast_payload JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        se.id,
        se.image_hash,
        se.ast_payload,
        1 - (se.embedding <=> query_embedding) AS similarity
    FROM public.studio_embeddings se
    WHERE 1 - (se.embedding <=> query_embedding) > match_threshold
    ORDER BY se.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
