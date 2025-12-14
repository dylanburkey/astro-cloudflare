import { getDB, generateId, now } from '../db';
import type { ProjectData, ProjectRow } from '../db/schema';
import { getBaseThemeFiles } from './files';

export interface CreateProjectInput {
  name: string;
  storeUrl?: string;
  description?: string;
}

export type { ProjectData };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createProject(
  input: CreateProjectInput,
  locals: App.Locals
): Promise<ProjectData> {
  const db = getDB(locals);
  const { name, storeUrl, description } = input;
  const slug = slugify(name);
  const timestamp = now();
  const id = generateId();

  // Check if project already exists
  const existing = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(slug)
    .first();

  if (existing) {
    throw new Error(`Project with slug "${slug}" already exists`);
  }

  // Insert project
  await db
    .prepare(`
      INSERT INTO projects (id, slug, name, store_url, description, status, base_theme, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'draft', 'base', ?, ?)
    `)
    .bind(id, slug, name, storeUrl || null, description || null, timestamp, timestamp)
    .run();

  // Copy base theme files to project_files table
  const baseThemeFiles = getBaseThemeFiles();
  const batch = baseThemeFiles.map(file =>
    db.prepare(`
      INSERT INTO project_files (project_id, file_path, content, content_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, file.path, file.content, file.contentType, timestamp, timestamp)
  );

  await db.batch(batch);

  return {
    name,
    slug,
    storeUrl,
    description,
    status: 'draft',
    baseTheme: 'base',
    createdAt: timestamp,
    updatedAt: timestamp,
    sections: [],
    blocks: [],
    metaobjects: [],
  };
}

export async function listProjects(locals: App.Locals): Promise<ProjectData[]> {
  const db = getDB(locals);

  const projects = await db
    .prepare('SELECT * FROM projects ORDER BY created_at DESC')
    .all<ProjectRow>();

  // For each project, get sections array
  const results: ProjectData[] = [];
  for (const p of projects.results) {
    const sections = await db
      .prepare('SELECT section_slug FROM project_sections WHERE project_id = ? ORDER BY position')
      .bind(p.id)
      .all<{ section_slug: string }>();

    const blocks = await db
      .prepare('SELECT block_slug FROM project_blocks WHERE project_id = ? ORDER BY position')
      .bind(p.id)
      .all<{ block_slug: string }>();

    results.push({
      name: p.name,
      slug: p.slug,
      storeUrl: p.store_url || undefined,
      description: p.description || undefined,
      status: p.status,
      baseTheme: p.base_theme,
      appliedPreset: p.applied_preset || undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      sections: sections.results.map(s => s.section_slug),
      blocks: blocks.results.map(b => b.block_slug),
      metaobjects: [],
    });
  }

  return results;
}

export async function getProject(slug: string, locals: App.Locals): Promise<ProjectData | null> {
  const db = getDB(locals);

  const project = await db
    .prepare('SELECT * FROM projects WHERE slug = ?')
    .bind(slug)
    .first<ProjectRow>();

  if (!project) return null;

  const sections = await db
    .prepare('SELECT section_slug FROM project_sections WHERE project_id = ? ORDER BY position')
    .bind(project.id)
    .all<{ section_slug: string }>();

  const blocks = await db
    .prepare('SELECT block_slug FROM project_blocks WHERE project_id = ? ORDER BY position')
    .bind(project.id)
    .all<{ block_slug: string }>();

  return {
    name: project.name,
    slug: project.slug,
    storeUrl: project.store_url || undefined,
    description: project.description || undefined,
    status: project.status,
    baseTheme: project.base_theme,
    appliedPreset: project.applied_preset || undefined,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    sections: sections.results.map(s => s.section_slug),
    blocks: blocks.results.map(b => b.block_slug),
    metaobjects: [],
  };
}

export async function deleteProject(slug: string, locals: App.Locals): Promise<boolean> {
  const db = getDB(locals);

  const result = await db
    .prepare('DELETE FROM projects WHERE slug = ?')
    .bind(slug)
    .run();

  return result.meta.changes > 0;
}

export async function updateProject(
  slug: string,
  updates: Partial<Pick<ProjectData, 'name' | 'description' | 'storeUrl' | 'status'>>,
  locals: App.Locals
): Promise<ProjectData | null> {
  const db = getDB(locals);
  const timestamp = now();

  const setClauses: string[] = ['updated_at = ?'];
  const values: (string | null)[] = [timestamp];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    values.push(updates.description || null);
  }
  if (updates.storeUrl !== undefined) {
    setClauses.push('store_url = ?');
    values.push(updates.storeUrl || null);
  }
  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    values.push(updates.status);
  }

  values.push(slug);

  await db
    .prepare(`UPDATE projects SET ${setClauses.join(', ')} WHERE slug = ?`)
    .bind(...values)
    .run();

  return getProject(slug, locals);
}
