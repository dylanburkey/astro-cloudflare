import type { APIRoute } from 'astro';
import { listAllPresets, listStaticPresets } from '../../../lib/presets/apply';
import { listCustomPresets } from '../../../lib/presets/custom';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const type = url.searchParams.get('type'); // 'all', 'static', 'custom'

    let presets;

    switch (type) {
      case 'static':
        presets = listStaticPresets();
        break;
      case 'custom':
        const customPresets = await listCustomPresets(locals);
        presets = customPresets.map((cp) => ({
          slug: `custom:${cp.slug}`,
          name: cp.name,
          description: cp.description || '',
          isCustom: true,
          id: cp.id,
          colors: cp.colors,
          typography: cp.typography,
          buttons: cp.buttons,
        }));
        break;
      default:
        presets = await listAllPresets(locals);
    }

    return new Response(
      JSON.stringify({ success: true, presets }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list presets';
    console.error('List presets error:', error);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
