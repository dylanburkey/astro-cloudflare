import { getDB, now } from '../db';
import { getProjectFile, updateProjectFile } from '../project/files';
import { getCustomPreset, listCustomPresets } from './custom';
import type { CustomPresetData } from '../db/schema';

export interface Preset {
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    background_secondary: string;
    text: string;
    text_secondary: string;
  };
  typography: {
    heading_font: string;
    body_font: string;
    heading_scale: number;
    body_scale: number;
  };
  buttons: {
    border_radius: number;
    padding_vertical: number;
    padding_horizontal: number;
  };
}

export interface PresetInfo {
  slug: string;
  name: string;
  description: string;
  isCustom?: boolean;
}

// Load presets at build time using Vite's import.meta.glob
// This bundles the JSON files and works in Cloudflare Workers
const presetModules = import.meta.glob<Preset>('/library/presets/*.json', {
  eager: true,
  import: 'default',
});

// Convert glob results to a map for easy access
const presetsMap: Record<string, Preset> = {};
for (const [path, preset] of Object.entries(presetModules)) {
  const slug = path.replace('/library/presets/', '').replace('.json', '');
  presetsMap[slug] = preset;
}

// List static presets only
export function listStaticPresets(): PresetInfo[] {
  return Object.entries(presetsMap)
    .map(([slug, preset]) => ({
      slug,
      name: preset.name,
      description: preset.description,
      isCustom: false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Legacy function name for compatibility
export function listPresets(): PresetInfo[] {
  return listStaticPresets();
}

// List all presets (static + custom from D1)
export async function listAllPresets(locals: App.Locals): Promise<PresetInfo[]> {
  const staticPresets = listStaticPresets();

  const customPresets = await listCustomPresets(locals);
  const customPresetInfos: PresetInfo[] = customPresets.map((cp) => ({
    slug: `custom:${cp.slug}`,
    name: cp.name,
    description: cp.description || '',
    isCustom: true,
  }));

  return [...staticPresets, ...customPresetInfos].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// Get a static preset by slug
export function getPreset(slug: string): Preset | null {
  return presetsMap[slug] || null;
}

// Convert custom preset to Preset format
function customPresetToPreset(custom: CustomPresetData): Preset {
  return {
    name: custom.name,
    description: custom.description || '',
    colors: custom.colors,
    typography: custom.typography,
    buttons: custom.buttons,
  };
}

// Get any preset (static or custom) by slug
// Custom presets use "custom:" prefix
export async function getAnyPreset(
  slug: string,
  locals: App.Locals
): Promise<Preset | null> {
  // Check if it's a custom preset
  if (slug.startsWith('custom:')) {
    const customSlug = slug.replace('custom:', '');
    const custom = await getCustomPreset(customSlug, locals);
    if (custom) {
      return customPresetToPreset(custom);
    }
    return null;
  }

  // Otherwise check static presets
  return presetsMap[slug] || null;
}

export async function applyPresetToProject(
  projectSlug: string,
  presetSlug: string,
  locals: App.Locals
): Promise<boolean> {
  // Support both static and custom presets
  const preset = await getAnyPreset(presetSlug, locals);
  if (!preset) {
    throw new Error(`Preset "${presetSlug}" not found`);
  }

  const db = getDB(locals);

  // Get project
  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) {
    throw new Error(`Project "${projectSlug}" not found`);
  }

  // Read existing settings_data.json from project_files
  let settingsData: Record<string, unknown>;
  const existingContent = await getProjectFile(projectSlug, 'config/settings_data.json', locals);

  if (existingContent) {
    try {
      settingsData = JSON.parse(existingContent);
    } catch {
      settingsData = {
        current: 'Default',
        presets: { Default: {} }
      };
    }
  } else {
    settingsData = {
      current: 'Default',
      presets: { Default: {} }
    };
  }

  // Ensure presets structure exists
  if (!settingsData.presets) {
    settingsData.presets = {};
  }

  const presets = settingsData.presets as Record<string, Record<string, unknown>>;
  const currentPresetName = (settingsData.current as string) || 'Default';

  if (!presets[currentPresetName]) {
    presets[currentPresetName] = {};
  }

  // Apply preset colors
  const currentSettings = presets[currentPresetName];
  currentSettings.color_primary = preset.colors.primary;
  currentSettings.color_secondary = preset.colors.secondary;
  currentSettings.color_accent = preset.colors.accent;
  currentSettings.color_background = preset.colors.background;
  currentSettings.color_background_secondary = preset.colors.background_secondary;
  currentSettings.color_text = preset.colors.text;
  currentSettings.color_text_secondary = preset.colors.text_secondary;

  // Apply preset typography
  currentSettings.typography_heading_font = preset.typography.heading_font;
  currentSettings.typography_body_font = preset.typography.body_font;
  currentSettings.typography_heading_scale = preset.typography.heading_scale;
  currentSettings.typography_body_scale = preset.typography.body_scale;

  // Apply preset buttons
  currentSettings.button_border_radius = preset.buttons.border_radius;
  currentSettings.button_padding_vertical = preset.buttons.padding_vertical;
  currentSettings.button_padding_horizontal = preset.buttons.padding_horizontal;

  // Write updated settings_data.json to D1
  await updateProjectFile(
    projectSlug,
    'config/settings_data.json',
    JSON.stringify(settingsData, null, 2),
    locals
  );

  // Update project's applied_preset field
  const timestamp = now();
  await db
    .prepare('UPDATE projects SET applied_preset = ?, updated_at = ? WHERE slug = ?')
    .bind(presetSlug, timestamp, projectSlug)
    .run();

  return true;
}

export async function removePresetFromProject(
  projectSlug: string,
  locals: App.Locals
): Promise<boolean> {
  const db = getDB(locals);

  const timestamp = now();
  const result = await db
    .prepare('UPDATE projects SET applied_preset = NULL, updated_at = ? WHERE slug = ?')
    .bind(timestamp, projectSlug)
    .run();

  return result.meta.changes > 0;
}
