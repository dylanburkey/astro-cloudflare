// Database row types (matching D1 tables)

export interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  store_url: string | null;
  description: string | null;
  status: 'active' | 'draft' | 'archived';
  base_theme: string;
  applied_preset: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectSectionRow {
  id: number;
  project_id: string;
  section_slug: string;
  position: number;
  added_at: string;
}

export interface ProjectBlockRow {
  id: number;
  project_id: string;
  block_slug: string;
  position: number;
  added_at: string;
}

export interface ProjectFileRow {
  id: number;
  project_id: string;
  file_path: string;
  content: string;
  content_type: string;
  created_at: string;
  updated_at: string;
}

export interface VariantRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  parent_section: string;
  settings: string;  // JSON string
  blocks: string;    // JSON string
  max_blocks: number;
  presets: string;   // JSON string
  liquid_content: string;
  created_at: string;
  updated_at: string;
}

// Application types (for API responses)

export interface ProjectData {
  name: string;
  slug: string;
  storeUrl?: string;
  description?: string;
  status: 'active' | 'draft' | 'archived';
  baseTheme: string;
  appliedPreset?: string;
  createdAt: string;
  updatedAt: string;
  sections: string[];
  blocks: string[];
  metaobjects: string[];
}

export interface VariantData {
  name: string;
  slug: string;
  description?: string;
  category: string;
  parentSection: string;
  variantOf: string;
  settings: unknown[];
  blocks: unknown[];
  maxBlocks: number;
  presets: unknown[];
}

export interface SectionSetting {
  id: string;
  type: string;
  label: string;
  default?: unknown;
  info?: string;
}

export interface SectionBlock {
  type: string;
  name: string;
  limit?: number;
  settings?: SectionSetting[];
}

export interface SectionData {
  name: string;
  slug: string;
  description?: string;
  category: string;
  settings: SectionSetting[];
  blocks: SectionBlock[];
  maxBlocks: number;
  presets: unknown[];
}
