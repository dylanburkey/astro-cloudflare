import { getDB, generateId, now, parseJSON, toJSON } from '../db';
import type {
  CustomPresetRow,
  CustomPresetData,
  PresetColors,
  PresetTypography,
  PresetButtons,
} from '../db/schema';

export interface CreatePresetInput {
  name: string;
  description?: string;
  isGlobal?: boolean;
  colors: PresetColors;
  typography: PresetTypography;
  buttons: PresetButtons;
}

export interface UpdatePresetInput {
  name?: string;
  description?: string;
  isGlobal?: boolean;
  colors?: Partial<PresetColors>;
  typography?: Partial<PresetTypography>;
  buttons?: Partial<PresetButtons>;
}

// Generate a URL-friendly slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// Convert database row to application data
function rowToData(row: CustomPresetRow): CustomPresetData {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    isGlobal: row.is_global === 1,
    colors: parseJSON<PresetColors>(row.colors) || getDefaultColors(),
    typography: parseJSON<PresetTypography>(row.typography) || getDefaultTypography(),
    buttons: parseJSON<PresetButtons>(row.buttons) || getDefaultButtons(),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Default values
function getDefaultColors(): PresetColors {
  return {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    background: '#ffffff',
    background_secondary: '#f8fafc',
    text: '#1e293b',
    text_secondary: '#64748b',
  };
}

function getDefaultTypography(): PresetTypography {
  return {
    heading_font: 'Inter',
    body_font: 'Inter',
    heading_scale: 100,
    body_scale: 100,
  };
}

function getDefaultButtons(): PresetButtons {
  return {
    border_radius: 8,
    padding_vertical: 12,
    padding_horizontal: 24,
  };
}

// Create a new custom preset
export async function createCustomPreset(
  input: CreatePresetInput,
  locals: App.Locals
): Promise<CustomPresetData> {
  const db = getDB(locals);
  const id = generateId();
  const timestamp = now();

  // Generate unique slug
  let slug = generateSlug(input.name);
  let slugSuffix = 0;

  // Check for existing slug and make unique if needed
  while (true) {
    const existingSlug = slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug;
    const existing = await db
      .prepare('SELECT id FROM custom_presets WHERE slug = ?')
      .bind(existingSlug)
      .first();

    if (!existing) {
      slug = existingSlug;
      break;
    }
    slugSuffix++;
  }

  await db
    .prepare(`
      INSERT INTO custom_presets (id, slug, name, description, is_global, colors, typography, buttons, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      slug,
      input.name,
      input.description || null,
      input.isGlobal ? 1 : 0,
      toJSON(input.colors),
      toJSON(input.typography),
      toJSON(input.buttons),
      timestamp,
      timestamp
    )
    .run();

  return {
    id,
    slug,
    name: input.name,
    description: input.description,
    isGlobal: input.isGlobal ?? false,
    colors: input.colors,
    typography: input.typography,
    buttons: input.buttons,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

// Get a custom preset by ID or slug
export async function getCustomPreset(
  idOrSlug: string,
  locals: App.Locals
): Promise<CustomPresetData | null> {
  const db = getDB(locals);

  const row = await db
    .prepare('SELECT * FROM custom_presets WHERE id = ? OR slug = ?')
    .bind(idOrSlug, idOrSlug)
    .first<CustomPresetRow>();

  if (!row) return null;
  return rowToData(row);
}

// List all custom presets
export async function listCustomPresets(locals: App.Locals): Promise<CustomPresetData[]> {
  const db = getDB(locals);

  const result = await db
    .prepare('SELECT * FROM custom_presets ORDER BY name')
    .all<CustomPresetRow>();

  return result.results.map(rowToData);
}

// List global custom presets only
export async function listGlobalPresets(locals: App.Locals): Promise<CustomPresetData[]> {
  const db = getDB(locals);

  const result = await db
    .prepare('SELECT * FROM custom_presets WHERE is_global = 1 ORDER BY name')
    .all<CustomPresetRow>();

  return result.results.map(rowToData);
}

// Update a custom preset
export async function updateCustomPreset(
  idOrSlug: string,
  updates: UpdatePresetInput,
  locals: App.Locals
): Promise<CustomPresetData | null> {
  const db = getDB(locals);
  const timestamp = now();

  // Get existing preset
  const existing = await getCustomPreset(idOrSlug, locals);
  if (!existing) return null;

  // Merge updates
  const updatedColors = updates.colors
    ? { ...existing.colors, ...updates.colors }
    : existing.colors;

  const updatedTypography = updates.typography
    ? { ...existing.typography, ...updates.typography }
    : existing.typography;

  const updatedButtons = updates.buttons
    ? { ...existing.buttons, ...updates.buttons }
    : existing.buttons;

  await db
    .prepare(`
      UPDATE custom_presets
      SET name = ?, description = ?, is_global = ?, colors = ?, typography = ?, buttons = ?, updated_at = ?
      WHERE id = ?
    `)
    .bind(
      updates.name ?? existing.name,
      updates.description ?? existing.description ?? null,
      updates.isGlobal !== undefined ? (updates.isGlobal ? 1 : 0) : (existing.isGlobal ? 1 : 0),
      toJSON(updatedColors),
      toJSON(updatedTypography),
      toJSON(updatedButtons),
      timestamp,
      existing.id
    )
    .run();

  return {
    ...existing,
    name: updates.name ?? existing.name,
    description: updates.description ?? existing.description,
    isGlobal: updates.isGlobal ?? existing.isGlobal,
    colors: updatedColors,
    typography: updatedTypography,
    buttons: updatedButtons,
    updatedAt: timestamp,
  };
}

// Delete a custom preset
export async function deleteCustomPreset(
  idOrSlug: string,
  locals: App.Locals
): Promise<boolean> {
  const db = getDB(locals);

  // Get preset first to get actual ID
  const preset = await getCustomPreset(idOrSlug, locals);
  if (!preset) return false;

  // Delete from project_presets first (foreign key constraint)
  await db
    .prepare('DELETE FROM project_presets WHERE preset_id = ?')
    .bind(preset.id)
    .run();

  // Delete the preset
  const result = await db
    .prepare('DELETE FROM custom_presets WHERE id = ?')
    .bind(preset.id)
    .run();

  return result.meta.changes > 0;
}

// Link a preset to a project
export async function linkPresetToProject(
  presetIdOrSlug: string,
  projectSlug: string,
  locals: App.Locals
): Promise<boolean> {
  const db = getDB(locals);
  const timestamp = now();

  // Get preset
  const preset = await getCustomPreset(presetIdOrSlug, locals);
  if (!preset) {
    throw new Error(`Preset "${presetIdOrSlug}" not found`);
  }

  // Get project
  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) {
    throw new Error(`Project "${projectSlug}" not found`);
  }

  // Insert or update link
  await db
    .prepare(`
      INSERT INTO project_presets (project_id, preset_id, is_active, applied_at)
      VALUES (?, ?, 0, ?)
      ON CONFLICT (project_id, preset_id) DO UPDATE SET applied_at = ?
    `)
    .bind(project.id, preset.id, timestamp, timestamp)
    .run();

  return true;
}

// Apply a custom preset to a project
export async function applyCustomPresetToProject(
  presetIdOrSlug: string,
  projectSlug: string,
  locals: App.Locals
): Promise<boolean> {
  const db = getDB(locals);
  const timestamp = now();

  // Get preset
  const preset = await getCustomPreset(presetIdOrSlug, locals);
  if (!preset) {
    throw new Error(`Preset "${presetIdOrSlug}" not found`);
  }

  // Get project
  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) {
    throw new Error(`Project "${projectSlug}" not found`);
  }

  // Deactivate all other presets for this project
  await db
    .prepare('UPDATE project_presets SET is_active = 0 WHERE project_id = ?')
    .bind(project.id)
    .run();

  // Link and activate this preset
  await db
    .prepare(`
      INSERT INTO project_presets (project_id, preset_id, is_active, applied_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT (project_id, preset_id) DO UPDATE SET is_active = 1, applied_at = ?
    `)
    .bind(project.id, preset.id, timestamp, timestamp)
    .run();

  // Update project's applied_preset field with custom: prefix
  await db
    .prepare('UPDATE projects SET applied_preset = ?, updated_at = ? WHERE slug = ?')
    .bind(`custom:${preset.slug}`, timestamp, projectSlug)
    .run();

  return true;
}

// Get presets linked to a project
export async function getProjectPresets(
  projectSlug: string,
  locals: App.Locals
): Promise<CustomPresetData[]> {
  const db = getDB(locals);

  const result = await db
    .prepare(`
      SELECT cp.*
      FROM custom_presets cp
      INNER JOIN project_presets pp ON cp.id = pp.preset_id
      INNER JOIN projects p ON pp.project_id = p.id
      WHERE p.slug = ?
      ORDER BY cp.name
    `)
    .bind(projectSlug)
    .all<CustomPresetRow>();

  return result.results.map(rowToData);
}

// Get the active preset for a project
export async function getActiveProjectPreset(
  projectSlug: string,
  locals: App.Locals
): Promise<CustomPresetData | null> {
  const db = getDB(locals);

  const row = await db
    .prepare(`
      SELECT cp.*
      FROM custom_presets cp
      INNER JOIN project_presets pp ON cp.id = pp.preset_id
      INNER JOIN projects p ON pp.project_id = p.id
      WHERE p.slug = ? AND pp.is_active = 1
    `)
    .bind(projectSlug)
    .first<CustomPresetRow>();

  if (!row) return null;
  return rowToData(row);
}

// Export default colors/typography/buttons for preset editor
export { getDefaultColors, getDefaultTypography, getDefaultButtons };
