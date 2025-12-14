import type { APIRoute } from 'astro';
import { promoteToVariant } from '../../../lib/project/promote-variant';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { projectSlug, sectionSlug, variantName, description } = body;

    if (!projectSlug || !sectionSlug || !variantName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: projectSlug, sectionSlug, variantName' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const variant = await promoteToVariant(projectSlug, sectionSlug, variantName, description, locals);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Section promoted to library as variant',
        variant: {
          name: variant.name,
          slug: variant.slug,
          parentSection: variant.parentSection,
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to promote variant';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
