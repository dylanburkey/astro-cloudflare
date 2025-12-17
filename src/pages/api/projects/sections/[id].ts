import type { APIRoute } from 'astro';
import { removeProjectSection } from '../../../../lib/project/create';

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const sectionId = parseInt(params.id || '', 10);

    if (isNaN(sectionId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid section ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get project slug from query params or body
    const url = new URL(request.url);
    const projectSlug = url.searchParams.get('project');

    if (!projectSlug) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project slug is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const success = await removeProjectSection(projectSlug, sectionId, locals);

    if (!success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Section not found or project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Remove section error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove section',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
