import type { APIRoute } from 'astro';
import { exportProjectToZip } from '../../../lib/project/export';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const projectSlug = url.searchParams.get('project');

    if (!projectSlug) {
      return new Response(
        JSON.stringify({ error: 'Missing project parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const zipData = await exportProjectToZip(projectSlug, locals);

    return new Response(zipData, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectSlug}-theme.zip"`,
        'Content-Length': zipData.length.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export project';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
