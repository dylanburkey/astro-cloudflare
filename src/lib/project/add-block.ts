import { getDB, now } from '../db';
import { getCollection } from 'astro:content';

export async function addBlockToProject(
  projectSlug: string,
  blockSlug: string,
  locals: App.Locals
): Promise<void> {
  const db = getDB(locals);

  // Verify project exists
  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) {
    throw new Error(`Project "${projectSlug}" not found`);
  }

  // Verify block exists in library
  const blocks = await getCollection('blocks');
  const block = blocks.find(b => b.data.slug === blockSlug);

  if (!block) {
    throw new Error(`Block "${blockSlug}" not found in library`);
  }

  // Check if block is already added to project
  const existing = await db
    .prepare('SELECT id FROM project_blocks WHERE project_id = ? AND block_slug = ?')
    .bind(project.id, blockSlug)
    .first();

  if (existing) {
    throw new Error(`Block "${blockSlug}" is already in project "${projectSlug}"`);
  }

  // Get next position
  const lastPosition = await db
    .prepare('SELECT MAX(position) as maxPos FROM project_blocks WHERE project_id = ?')
    .bind(project.id)
    .first<{ maxPos: number | null }>();

  const position = (lastPosition?.maxPos ?? -1) + 1;
  const timestamp = now();

  // Insert block reference
  await db
    .prepare(`
      INSERT INTO project_blocks (project_id, block_slug, position, added_at)
      VALUES (?, ?, ?, ?)
    `)
    .bind(project.id, blockSlug, position, timestamp)
    .run();

  // Update project timestamp
  await db
    .prepare('UPDATE projects SET updated_at = ? WHERE id = ?')
    .bind(timestamp, project.id)
    .run();
}
