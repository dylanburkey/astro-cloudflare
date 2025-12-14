import { getDB, generateId, now, toJSON, parseJSON } from '../db';
import type { VariantData, VariantRow } from '../db/schema';
import { getCollection } from 'astro:content';

export type { VariantData };

function extractSchemaFromLiquid(liquidContent: string): Record<string, unknown> | null {
  const schemaMatch = liquidContent.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  if (!schemaMatch) return null;

  try {
    return JSON.parse(schemaMatch[1].trim());
  } catch {
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function promoteToVariant(
  projectSlug: string,
  sectionSlug: string,
  variantName: string,
  description: string | undefined,
  locals: App.Locals
): Promise<VariantData> {
  const db = getDB(locals);

  // Get project
  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) {
    throw new Error(`Project "${projectSlug}" not found`);
  }

  // Get section Liquid file from project_files
  const sectionFile = await db
    .prepare('SELECT content FROM project_files WHERE project_id = ? AND file_path = ?')
    .bind(project.id, `sections/${sectionSlug}.liquid`)
    .first<{ content: string }>();

  if (!sectionFile) {
    throw new Error(`Section "${sectionSlug}" not found in project "${projectSlug}"`);
  }

  // Extract schema from Liquid
  const schema = extractSchemaFromLiquid(sectionFile.content);
  if (!schema) {
    throw new Error('Could not extract schema from section Liquid file');
  }

  // Generate variant slug
  const variantSlug = `${sectionSlug}-${slugify(variantName)}`;

  // Check if variant already exists in D1
  const existing = await db
    .prepare('SELECT id FROM variants WHERE slug = ?')
    .bind(variantSlug)
    .first();

  if (existing) {
    throw new Error(`Variant "${variantSlug}" already exists`);
  }

  // Determine category from parent section in content collection
  let category = 'custom';
  try {
    const sections = await getCollection('sections');
    const parentSection = sections.find(s => s.data.slug === sectionSlug);
    if (parentSection) {
      category = parentSection.data.category || 'custom';
    }
  } catch {
    // Content collection not available, use custom
  }

  const timestamp = now();
  const id = generateId();

  // Create variant data
  const variantData: VariantData = {
    name: `${(schema.name as string) || sectionSlug} - ${variantName}`,
    slug: variantSlug,
    description: description || `Variant of ${sectionSlug}`,
    category,
    parentSection: sectionSlug,
    variantOf: sectionSlug,
    settings: (schema.settings as unknown[]) || [],
    blocks: (schema.blocks as unknown[]) || [],
    maxBlocks: (schema.max_blocks as number) || 50,
    presets: (schema.presets as unknown[]) || [{ name: variantName }],
  };

  // Insert variant into D1
  await db
    .prepare(`
      INSERT INTO variants (id, slug, name, description, category, parent_section, settings, blocks, max_blocks, presets, liquid_content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      variantData.slug,
      variantData.name,
      variantData.description || null,
      variantData.category,
      variantData.parentSection,
      toJSON(variantData.settings),
      toJSON(variantData.blocks),
      variantData.maxBlocks,
      toJSON(variantData.presets),
      sectionFile.content,
      timestamp,
      timestamp
    )
    .run();

  return variantData;
}

export async function listVariantsOfSection(
  sectionSlug: string,
  locals: App.Locals
): Promise<VariantData[]> {
  const db = getDB(locals);

  const variants = await db
    .prepare('SELECT * FROM variants WHERE parent_section = ? ORDER BY name')
    .bind(sectionSlug)
    .all<VariantRow>();

  return variants.results.map(v => ({
    name: v.name,
    slug: v.slug,
    description: v.description || undefined,
    category: v.category,
    parentSection: v.parent_section,
    variantOf: v.parent_section,
    settings: parseJSON<unknown[]>(v.settings) || [],
    blocks: parseJSON<unknown[]>(v.blocks) || [],
    maxBlocks: v.max_blocks,
    presets: parseJSON<unknown[]>(v.presets) || [],
  }));
}

export async function getVariantInfo(
  variantSlug: string,
  locals: App.Locals
): Promise<VariantData | null> {
  const db = getDB(locals);

  const variant = await db
    .prepare('SELECT * FROM variants WHERE slug = ?')
    .bind(variantSlug)
    .first<VariantRow>();

  if (!variant) return null;

  return {
    name: variant.name,
    slug: variant.slug,
    description: variant.description || undefined,
    category: variant.category,
    parentSection: variant.parent_section,
    variantOf: variant.parent_section,
    settings: parseJSON<unknown[]>(variant.settings) || [],
    blocks: parseJSON<unknown[]>(variant.blocks) || [],
    maxBlocks: variant.max_blocks,
    presets: parseJSON<unknown[]>(variant.presets) || [],
  };
}

export async function deleteVariant(
  variantSlug: string,
  locals: App.Locals
): Promise<boolean> {
  const db = getDB(locals);

  const result = await db
    .prepare('DELETE FROM variants WHERE slug = ?')
    .bind(variantSlug)
    .run();

  return result.meta.changes > 0;
}
