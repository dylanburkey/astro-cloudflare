import { getDB } from '../db';
import { zipSync } from 'fflate';

interface FileEntry {
  path: string;
  content: string;
}

// Text encoder for converting strings to bytes
const encoder = new TextEncoder();

function createZip(files: FileEntry[]): Uint8Array {
  // Build the file structure for fflate
  const zipData: { [key: string]: Uint8Array } = {};

  for (const file of files) {
    // fflate expects Uint8Array content
    zipData[file.path] = encoder.encode(file.content);
  }

  // Create ZIP using fflate (synchronous, no compression for speed)
  return zipSync(zipData, { level: 0 });
}

export async function exportProjectToZip(
  projectSlug: string,
  locals: App.Locals
): Promise<Uint8Array> {
  const db = getDB(locals);

  // Get project
  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) {
    throw new Error(`Project "${projectSlug}" not found`);
  }

  // Get all project files
  const files = await db
    .prepare('SELECT file_path, content FROM project_files WHERE project_id = ? ORDER BY file_path')
    .bind(project.id)
    .all<{ file_path: string; content: string }>();

  if (files.results.length === 0) {
    throw new Error('Project has no files to export');
  }

  // Convert to FileEntry format
  const fileEntries: FileEntry[] = files.results.map(f => ({
    path: f.file_path,
    content: f.content,
  }));

  // Create ZIP
  return createZip(fileEntries);
}

export async function getProjectFileCount(
  projectSlug: string,
  locals: App.Locals
): Promise<number> {
  const db = getDB(locals);

  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) return 0;

  const result = await db
    .prepare('SELECT COUNT(*) as count FROM project_files WHERE project_id = ?')
    .bind(project.id)
    .first<{ count: number }>();

  return result?.count ?? 0;
}
