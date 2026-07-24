-- Table for Studio Projects/Workspaces
CREATE TABLE IF NOT EXISTS public.studio_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users in a real app, keeping it generic here
    title TEXT NOT NULL,
    folder TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Studio Snapshots (Versions within a project)
CREATE TABLE IF NOT EXISTS public.studio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.studio_projects(id) ON DELETE CASCADE,
    version_num INT NOT NULL DEFAULT 1,
    original_image_url TEXT NOT NULL,
    ast_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, version_num)
);

-- Trigger to auto-update updated_at on projects
CREATE OR REPLACE FUNCTION update_studio_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_studio_projects_updated_at
BEFORE UPDATE ON public.studio_projects
FOR EACH ROW EXECUTE FUNCTION update_studio_projects_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_studio_projects_user_id ON public.studio_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_snapshots_project_id ON public.studio_snapshots(project_id);
