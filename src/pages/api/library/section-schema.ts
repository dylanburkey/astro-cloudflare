import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getDB } from '../../../lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const sectionId = url.searchParams.get('sectionId');

    if (!slug) {
      return new Response(
        JSON.stringify({ success: false, error: 'Section slug is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get section from content collection
    const sections = await getCollection('sections');
    const section = sections.find((s) => s.data.slug === slug);

    if (!section) {
      return new Response(
        JSON.stringify({ success: false, error: 'Section not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current settings from database if sectionId provided
    let currentSettings: Record<string, unknown> = {};
    if (sectionId) {
      try {
        const db = getDB(locals);
        const row = await db
          .prepare('SELECT settings FROM project_sections WHERE id = ?')
          .bind(parseInt(sectionId, 10))
          .first<{ settings: string }>();

        if (row?.settings) {
          currentSettings = JSON.parse(row.settings);
        }
      } catch (dbError) {
        console.error('Failed to fetch section settings:', dbError);
        // Continue without settings, will use defaults
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        schema: {
          name: section.data.name,
          slug: section.data.slug,
          settings: section.data.settings || [],
          blocks: section.data.blocks || [],
        },
        currentSettings,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Section schema error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch section schema',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
