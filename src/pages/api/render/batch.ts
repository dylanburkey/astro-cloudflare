import type { APIRoute } from 'astro';
import { renderSectionsBatch } from '../../../lib/liquid';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { sections, presetSlug } = body as {
      sections?: string[];
      presetSlug?: string;
    };

    // Validate required parameters
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid parameter: sections (array of slugs required)' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Limit batch size to prevent timeout
    const maxBatchSize = 20;
    if (sections.length > maxBatchSize) {
      return new Response(
        JSON.stringify({
          error: `Batch size exceeds maximum of ${maxBatchSize}. Please split into smaller batches.`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Render all sections
    const startTime = performance.now();
    const resultsMap = await renderSectionsBatch(sections, presetSlug, locals);
    const totalTime = Math.round(performance.now() - startTime);

    // Convert Map to array of results
    const results = sections.map((slug) => {
      const result = resultsMap.get(slug);
      if (!result) {
        return {
          slug,
          success: false,
          html: '',
          css: '',
          error: 'Section not rendered',
          renderTimeMs: 0,
          cached: false,
        };
      }
      return {
        slug,
        success: result.errors.length === 0,
        html: result.html,
        css: result.css,
        error: result.errors.length > 0 ? result.errors[0] : null,
        renderTimeMs: result.renderTimeMs,
        cached: result.cached,
      };
    });

    // Calculate stats
    const successCount = results.filter((r) => r.success).length;
    const cachedCount = results.filter((r) => r.cached).length;

    return new Response(
      JSON.stringify({
        success: true,
        results,
        stats: {
          total: results.length,
          successful: successCount,
          failed: results.length - successCount,
          cached: cachedCount,
          totalTimeMs: totalTime,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Batch render API error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        results: [],
        stats: {
          total: 0,
          successful: 0,
          failed: 0,
          cached: 0,
          totalTimeMs: 0,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
