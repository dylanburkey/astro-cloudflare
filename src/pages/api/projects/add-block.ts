import type { APIRoute } from 'astro';
import { addBlockToProject } from '../../../lib/project/add-block';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { projectSlug, blockSlug } = body;

    if (!projectSlug || !blockSlug) {
      return new Response(
        JSON.stringify({ error: 'Missing projectSlug or blockSlug' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await addBlockToProject(projectSlug, blockSlug, locals);

    return new Response(
      JSON.stringify({ success: true, message: 'Block added to project' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add block';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
