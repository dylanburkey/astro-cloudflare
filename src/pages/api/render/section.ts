import type { APIRoute } from 'astro';
import { renderSection } from '../../../lib/liquid';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { sectionSlug, presetSlug, customSettings, skipCache } = body as {
      sectionSlug?: string;
      presetSlug?: string;
      customSettings?: Record<string, unknown>;
      skipCache?: boolean;
    };

    // Validate required parameters
    if (!sectionSlug) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: sectionSlug' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Render the section
    const result = await renderSection({
      sectionSlug,
      presetSlug,
      customSettings,
      locals,
      skipCache: skipCache ?? false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        html: result.html,
        css: result.css,
        errors: result.errors,
        renderTimeMs: result.renderTimeMs,
        cached: result.cached,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': result.cached
            ? 'public, max-age=300, s-maxage=3600'
            : 'public, max-age=60, s-maxage=300',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Render API error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        html: '',
        css: '',
        errors: [message],
        renderTimeMs: 0,
        cached: false,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// GET endpoint for direct iframe loading
export const GET: APIRoute = async ({ url, locals }) => {
  const sectionSlug = url.searchParams.get('section');
  const presetSlug = url.searchParams.get('preset') ?? undefined;
  const settingsParam = url.searchParams.get('settings');
  const viewport = url.searchParams.get('viewport') ?? 'desktop';

  // Parse custom settings from query param if provided
  let customSettings: Record<string, unknown> | undefined;
  if (settingsParam) {
    try {
      customSettings = JSON.parse(decodeURIComponent(settingsParam));
    } catch {
      // Invalid JSON, ignore
    }
  }

  if (!sectionSlug) {
    return new Response(
      '<html><body><p>Missing section parameter</p></body></html>',
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  try {
    const result = await renderSection({
      sectionSlug,
      presetSlug,
      customSettings,
      locals,
    });

    // Return full HTML document for iframe
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: ${sectionSlug}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    ${result.css}
  </style>
</head>
<body>
  ${result.html}
  ${result.errors.length > 0 ? `<script>console.warn('Render errors:', ${JSON.stringify(result.errors)})</script>` : ''}
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-Render-Time': result.renderTimeMs.toString(),
        'X-Cached': result.cached.toString(),
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      `<html><body><p>Render error: ${message}</p></body></html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
};
