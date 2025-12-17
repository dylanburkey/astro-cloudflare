import type { APIRoute } from 'astro';
import { createCustomPreset } from '../../../lib/presets/custom';
import type { PresetColors, PresetTypography, PresetButtons } from '../../../lib/db/schema';

interface CreatePresetBody {
  name: string;
  description?: string;
  isGlobal?: boolean;
  colors: PresetColors;
  typography: PresetTypography;
  buttons: PresetButtons;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as Partial<CreatePresetBody>;

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.colors || typeof body.colors !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Colors object is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.typography || typeof body.typography !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Typography object is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.buttons || typeof body.buttons !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Buttons object is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const preset = await createCustomPreset(
      {
        name: body.name.trim(),
        description: body.description?.trim(),
        isGlobal: body.isGlobal ?? false,
        colors: body.colors,
        typography: body.typography,
        buttons: body.buttons,
      },
      locals
    );

    return new Response(
      JSON.stringify({ success: true, preset }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create preset';
    console.error('Create preset error:', error);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
