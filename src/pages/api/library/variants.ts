import type { APIRoute } from 'astro';
import { listVariantsOfSection, getVariantInfo } from '../../../lib/project/promote-variant';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const sectionSlug = url.searchParams.get('section');
    const variantSlug = url.searchParams.get('variant');

    if (variantSlug) {
      const variant = await getVariantInfo(variantSlug, locals);
      if (!variant) {
        return new Response(
          JSON.stringify({ error: 'Variant not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ variant }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (sectionSlug) {
      const variants = await listVariantsOfSection(sectionSlug, locals);
      return new Response(
        JSON.stringify({ variants }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Must provide section or variant parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch variants';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
