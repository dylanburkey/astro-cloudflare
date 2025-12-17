-- Custom presets table for user-created color/typography presets
CREATE TABLE IF NOT EXISTS custom_presets (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_global INTEGER DEFAULT 0,
  colors TEXT NOT NULL,
  typography TEXT NOT NULL,
  buttons TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Link presets to projects (many-to-many)
CREATE TABLE IF NOT EXISTS project_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  preset_id TEXT NOT NULL REFERENCES custom_presets(id) ON DELETE CASCADE,
  is_active INTEGER DEFAULT 0,
  applied_at TEXT,
  UNIQUE(project_id, preset_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_presets_slug ON custom_presets(slug);
CREATE INDEX IF NOT EXISTS idx_project_presets_project ON project_presets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_presets_preset ON project_presets(preset_id);
