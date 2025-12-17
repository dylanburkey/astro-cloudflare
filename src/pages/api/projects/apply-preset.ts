import type { APIRoute } from 'astro';
import { applyPresetToProject, removePresetFromProject } from '../../../lib/presets/apply';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { projectSlug, presetSlug } = body;

    if (!projectSlug || typeof projectSlug !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Project slug is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If no preset slug, remove preset from project
    if (!presetSlug) {
      await removePresetFromProject(projectSlug, locals);
      return new Response(
        JSON.stringify({ success: true, message: 'Preset removed' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await applyPresetToProject(projectSlug, presetSlug, locals);

    return new Response(
      JSON.stringify({ success: true, presetSlug }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Apply preset error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply preset',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
