#!/usr/bin/env node
/**
 * Sync Shopify theme sections to the library
 * Extracts {% schema %} blocks from Liquid files and converts to toolkit format
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';

const THEME_PATH = './themes/forge-industrial/sections';
const OUTPUT_PATH = './library/sections';

// Map Shopify categories to toolkit categories
function mapCategory(name, tags = []) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('hero')) return 'hero';
  if (lowerName.includes('collection') || lowerName.includes('product-grid')) return 'collection';
  if (lowerName.includes('product')) return 'product';
  if (lowerName.includes('header') || lowerName.includes('announcement')) return 'header';
  if (lowerName.includes('footer')) return 'footer';
  if (lowerName.includes('image') || lowerName.includes('video') || lowerName.includes('gallery')) return 'media';
  return 'content';
}

// Extract schema JSON from Liquid file
function extractSchema(content) {
  const schemaMatch = content.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  if (!schemaMatch) return null;

  try {
    return JSON.parse(schemaMatch[1].trim());
  } catch (e) {
    console.error('Failed to parse schema JSON:', e.message);
    return null;
  }
}

// Convert Shopify schema to toolkit format
function convertToToolkitFormat(schema, filename) {
  const slug = basename(filename, '.liquid');

  return {
    name: schema.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    slug: slug,
    description: schema.tag || schema.class || `${schema.name} section from Forge Industrial theme`,
    category: mapCategory(schema.name || slug),
    previewImage: `/previews/sections/${slug}.png`,
    settings: (schema.settings || []).map(s => ({
      id: s.id,
      type: s.type,
      label: s.label || s.id,
      default: s.default,
      info: s.info,
    })).filter(s => s.id), // Filter out headers/paragraphs
    blocks: (schema.blocks || []).map(b => ({
      type: b.type,
      name: b.name || b.type,
      limit: b.limit,
      settings: (b.settings || []).map(s => ({
        id: s.id,
        type: s.type,
        label: s.label || s.id,
        default: s.default,
      })).filter(s => s.id),
    })),
    maxBlocks: schema.max_blocks || 50,
    presets: (schema.presets || []).map(p => ({
      name: p.name,
      blocks: p.blocks,
      settings: p.settings,
    })),
    // Store original Liquid path for reference
    _source: {
      theme: 'forge-industrial',
      path: `sections/${filename}`,
    }
  };
}

async function syncSections() {
  console.log('Syncing sections from Forge Industrial theme...\n');

  try {
    // Ensure output directory exists
    await mkdir(OUTPUT_PATH, { recursive: true });

    // Read all Liquid files
    const files = await readdir(THEME_PATH);
    const liquidFiles = files.filter(f => f.endsWith('.liquid'));

    console.log(`Found ${liquidFiles.length} section files\n`);

    let synced = 0;
    let skipped = 0;

    for (const file of liquidFiles) {
      const content = await readFile(join(THEME_PATH, file), 'utf-8');
      const schema = extractSchema(content);

      if (!schema) {
        console.log(`⏭️  Skipped ${file} (no schema)`);
        skipped++;
        continue;
      }

      const toolkitData = convertToToolkitFormat(schema, file);
      const outputFile = join(OUTPUT_PATH, `${toolkitData.slug}.json`);

      await writeFile(outputFile, JSON.stringify(toolkitData, null, 2));
      console.log(`✅ Synced ${file} → ${toolkitData.slug}.json`);
      synced++;
    }

    console.log(`\n✨ Done! Synced ${synced} sections, skipped ${skipped}`);

  } catch (error) {
    console.error('Error syncing sections:', error);
    process.exit(1);
  }
}

syncSections();
