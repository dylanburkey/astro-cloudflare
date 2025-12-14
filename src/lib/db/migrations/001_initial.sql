-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  store_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('active', 'draft', 'archived')),
  base_theme TEXT DEFAULT 'base',
  applied_preset TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Project sections tracking (replaces projects.sections array)
CREATE TABLE IF NOT EXISTS project_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_slug TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  added_at TEXT NOT NULL,
  UNIQUE(project_id, section_slug)
);

-- Project blocks tracking (replaces projects.blocks array)
CREATE TABLE IF NOT EXISTS project_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  block_slug TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  added_at TEXT NOT NULL,
  UNIQUE(project_id, block_slug)
);

-- Project files (replaces projects/[slug]/* filesystem)
CREATE TABLE IF NOT EXISTS project_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text/plain',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, file_path)
);

-- Variants table (replaces library/sections/*-*.json with variantOf field)
CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom',
  parent_section TEXT NOT NULL,
  settings TEXT NOT NULL,
  blocks TEXT NOT NULL,
  max_blocks INTEGER DEFAULT 50,
  presets TEXT NOT NULL,
  liquid_content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_project_files_path ON project_files(project_id, file_path);
CREATE INDEX IF NOT EXISTS idx_project_sections_project ON project_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_variants_parent ON variants(parent_section);
