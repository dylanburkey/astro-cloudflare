import type { APIRoute } from 'astro';
import { reorderProjectSections } from '../../../../lib/project/create';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { projectSlug, sectionIds } = body;

    if (!projectSlug || typeof projectSlug !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Project slug is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Section IDs array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate all IDs are numbers
    if (!sectionIds.every((id) => typeof id === 'number')) {
      return new Response(
        JSON.stringify({ success: false, error: 'All section IDs must be numbers' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const success = await reorderProjectSections(projectSlug, sectionIds, locals);

    if (!success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reorder sections error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder sections',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
