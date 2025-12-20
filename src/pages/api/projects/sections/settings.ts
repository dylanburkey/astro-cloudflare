import type { APIRoute } from 'astro';
import { getDB } from '../../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { projectSlug, sectionId, settings } = body;

    if (!projectSlug) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project slug is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!sectionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Section ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!settings || typeof settings !== 'object') {
      return new Response(
        JSON.stringify({ success: false, error: 'Settings object is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = getDB(locals);

    // First verify the project exists
    const project = await db
      .prepare('SELECT id FROM projects WHERE slug = ?')
      .bind(projectSlug)
      .first();

    if (!project) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the section exists in this project
    const section = await db
      .prepare('SELECT id, section_slug FROM project_sections WHERE id = ? AND project_id = ?')
      .bind(sectionId, project.id)
      .first();

    if (!section) {
      return new Response(
        JSON.stringify({ success: false, error: 'Section not found in project' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update section settings
    const settingsJson = JSON.stringify(settings);

    await db
      .prepare('UPDATE project_sections SET settings = ? WHERE id = ?')
      .bind(settingsJson, sectionId)
      .run();

    // Update project's updated_at timestamp
    await db
      .prepare('UPDATE projects SET updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), project.id)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Settings saved successfully',
        sectionId,
        settings,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Save settings error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save settings',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// GET endpoint to fetch current settings for a section
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const projectSlug = url.searchParams.get('project');
    const sectionId = url.searchParams.get('sectionId');

    if (!projectSlug || !sectionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project slug and section ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = getDB(locals);

    // Get project
    const project = await db
      .prepare('SELECT id FROM projects WHERE slug = ?')
      .bind(projectSlug)
      .first();

    if (!project) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get section with settings
    const section = await db
      .prepare('SELECT id, section_slug, settings FROM project_sections WHERE id = ? AND project_id = ?')
      .bind(parseInt(sectionId), project.id)
      .first<{ id: number; section_slug: string; settings: string | null }>();

    if (!section) {
      return new Response(
        JSON.stringify({ success: false, error: 'Section not found in project' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const settings = section.settings ? JSON.parse(section.settings) : {};

    return new Response(
      JSON.stringify({
        success: true,
        sectionId: section.id,
        sectionSlug: section.section_slug,
        settings,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get settings error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch settings',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
