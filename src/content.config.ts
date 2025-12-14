import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Project schema
const projectSchema = z.object({
  name: z.string(),
  slug: z.string(),
  storeUrl: z.string().url().optional(),
  storeId: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']).default('draft'),
  baseTheme: z.enum(['base', 'dawn', 'horizon', 'minimal', 'custom']).default('base'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  sections: z.array(z.string()).default([]),
  blocks: z.array(z.string()).default([]),
  metaobjects: z.array(z.string()).default([]),
});

// Section component schema
const sectionSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  category: z.enum(['hero', 'collection', 'product', 'content', 'media', 'footer', 'header', 'custom']).default('custom'),
  previewImage: z.string().optional(),
  settings: z.array(z.object({
    id: z.string(),
    type: z.string(),
    label: z.string(),
    default: z.any().optional(),
    info: z.string().optional(),
  })).default([]),
  blocks: z.array(z.object({
    type: z.string(),
    name: z.string(),
    limit: z.number().optional(),
    settings: z.array(z.object({
      id: z.string(),
      type: z.string(),
      label: z.string(),
      default: z.any().optional(),
    })).default([]),
  })).default([]),
  maxBlocks: z.number().default(50),
  presets: z.array(z.object({
    name: z.string(),
    blocks: z.array(z.any()).optional(),
    settings: z.record(z.any()).optional(),
  })).default([]),
});

// Block component schema
const blockSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  category: z.enum(['text', 'media', 'interactive', 'layout', 'custom']).default('custom'),
  settings: z.array(z.object({
    id: z.string(),
    type: z.string(),
    label: z.string(),
    default: z.any().optional(),
  })).default([]),
});

// Metaobject schema
const metaobjectSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  type: z.string(), // Shopify metaobject type
  fields: z.array(z.object({
    key: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    required: z.boolean().default(false),
    validations: z.array(z.any()).optional(),
  })).default([]),
  capabilities: z.object({
    publishable: z.boolean().default(false),
    translatable: z.boolean().default(false),
    onlineStore: z.boolean().default(false),
  }).default({}),
});

// Define collections
const projects = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/projects' }),
  schema: projectSchema,
});

const sections = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './library/sections' }),
  schema: sectionSchema,
});

const blocks = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './library/blocks' }),
  schema: blockSchema,
});

const metaobjects = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './library/metaobjects' }),
  schema: metaobjectSchema,
});

export const collections = {
  projects,
  sections,
  blocks,
  metaobjects,
};
