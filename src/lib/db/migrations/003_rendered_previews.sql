-- Rendered previews cache table for Liquid section renders
CREATE TABLE IF NOT EXISTS rendered_previews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,
  section_slug TEXT NOT NULL,
  preset_slug TEXT,
  html TEXT NOT NULL,
  css TEXT,
  render_time_ms INTEGER,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- Indexes for cache lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_previews_cache_key ON rendered_previews(cache_key);
CREATE INDEX IF NOT EXISTS idx_previews_section ON rendered_previews(section_slug);
CREATE INDEX IF NOT EXISTS idx_previews_expires ON rendered_previews(expires_at);
