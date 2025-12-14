import { getDB, parseJSON } from '../db';
import type { VariantData, VariantRow } from '../db/schema';

export type { VariantData };

export interface VariantsMap {
  [parentSection: string]: VariantData[];
}

export async function getAllVariants(locals: App.Locals): Promise<VariantsMap> {
  const db = getDB(locals);

  const variants = await db
    .prepare('SELECT * FROM variants ORDER BY parent_section, name')
    .all<VariantRow>();

  const variantsMap: VariantsMap = {};

  for (const v of variants.results) {
    const parentSlug = v.parent_section;

    if (!variantsMap[parentSlug]) {
      variantsMap[parentSlug] = [];
    }

    variantsMap[parentSlug].push({
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
    });
  }

  return variantsMap;
}

export async function getVariantsByParent(
  parentSlug: string,
  locals: App.Locals
): Promise<VariantData[]> {
  const db = getDB(locals);

  const variants = await db
    .prepare('SELECT * FROM variants WHERE parent_section = ? ORDER BY name')
    .bind(parentSlug)
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

export async function listAllVariants(locals: App.Locals): Promise<VariantData[]> {
  const db = getDB(locals);

  const variants = await db
    .prepare('SELECT * FROM variants ORDER BY name')
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
