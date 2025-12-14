import type { APIRoute } from 'astro';
import { getDB, now } from '../../../lib/db';
import { getBaseThemeFiles } from '../../../lib/project/files';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { projectSlug } = body;

    if (!projectSlug) {
      return new Response(
        JSON.stringify({ error: 'Missing projectSlug' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = getDB(locals);

    // Get project
    const project = await db
      .prepare('SELECT id FROM projects WHERE slug = ?')
      .bind(projectSlug)
      .first<{ id: string }>();

    if (!project) {
      return new Response(
        JSON.stringify({ error: `Project "${projectSlug}" not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get existing file paths
    const existingFiles = await db
      .prepare('SELECT file_path FROM project_files WHERE project_id = ?')
      .bind(project.id)
      .all<{ file_path: string }>();

    const existingPaths = new Set(existingFiles.results.map(f => f.file_path));

    // Add base theme files that don't already exist
    const baseThemeFiles = getBaseThemeFiles();
    const timestamp = now();

    const filesToAdd = baseThemeFiles.filter(file => !existingPaths.has(file.path));

    if (filesToAdd.length === 0) {
      return new Response(
        JSON.stringify({ message: `All ${baseThemeFiles.length} base files already exist`, seeded: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const batch = filesToAdd.map(file =>
      db.prepare(`
        INSERT INTO project_files (project_id, file_path, content, content_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(project.id, file.path, file.content, file.contentType, timestamp, timestamp)
    );

    await db.batch(batch);

    return new Response(
      JSON.stringify({ success: true, message: `Added ${filesToAdd.length} base theme files (${existingPaths.size} already existed)`, seeded: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to seed files';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
