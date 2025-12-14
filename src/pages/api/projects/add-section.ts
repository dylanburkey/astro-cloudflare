import type { APIRoute } from 'astro';
import { addSectionToProject } from '../../../lib/project/add-section';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { projectSlug, sectionSlug } = body;

    if (!projectSlug || !sectionSlug) {
      return new Response(
        JSON.stringify({ error: 'Missing projectSlug or sectionSlug' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await addSectionToProject(projectSlug, sectionSlug, locals);

    return new Response(
      JSON.stringify({ success: true, message: 'Section added to project' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add section';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
