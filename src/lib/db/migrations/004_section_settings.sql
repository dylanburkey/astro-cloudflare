-- Add settings column to project_sections for storing section configuration
ALTER TABLE project_sections ADD COLUMN settings TEXT DEFAULT '{}';

-- Create index for faster settings lookups
CREATE INDEX IF NOT EXISTS idx_project_sections_id ON project_sections(id);
