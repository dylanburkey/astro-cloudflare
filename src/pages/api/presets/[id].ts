import type { APIRoute } from 'astro';
import {
  getCustomPreset,
  updateCustomPreset,
  deleteCustomPreset,
} from '../../../lib/presets/custom';
import { getPreset } from '../../../lib/presets/apply';

// GET - Retrieve a preset
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Preset ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if it's a custom preset
    if (id.startsWith('custom:')) {
      const customSlug = id.replace('custom:', '');
      const preset = await getCustomPreset(customSlug, locals);

      if (!preset) {
        return new Response(
          JSON.stringify({ error: 'Preset not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, preset, isCustom: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check custom presets by ID or slug
    const customPreset = await getCustomPreset(id, locals);
    if (customPreset) {
      return new Response(
        JSON.stringify({ success: true, preset: customPreset, isCustom: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check static presets
    const staticPreset = getPreset(id);
    if (staticPreset) {
      return new Response(
        JSON.stringify({
          success: true,
          preset: { slug: id, ...staticPreset },
          isCustom: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Preset not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get preset';
    console.error('Get preset error:', error);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Update a custom preset
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Preset ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if it's a static preset (cannot be updated)
    const staticPreset = getPreset(id);
    if (staticPreset) {
      return new Response(
        JSON.stringify({ error: 'Static presets cannot be modified' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const updates = {
      name: body.name,
      description: body.description,
      isGlobal: body.isGlobal,
      colors: body.colors,
      typography: body.typography,
      buttons: body.buttons,
    };

    // Remove undefined values
    Object.keys(updates).forEach((key) => {
      if (updates[key as keyof typeof updates] === undefined) {
        delete updates[key as keyof typeof updates];
      }
    });

    // Extract ID from custom: prefix if present
    const presetId = id.startsWith('custom:') ? id.replace('custom:', '') : id;

    const preset = await updateCustomPreset(presetId, updates, locals);

    if (!preset) {
      return new Response(
        JSON.stringify({ error: 'Preset not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, preset }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update preset';
    console.error('Update preset error:', error);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Delete a custom preset
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Preset ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if it's a static preset (cannot be deleted)
    const staticPreset = getPreset(id);
    if (staticPreset) {
      return new Response(
        JSON.stringify({ error: 'Static presets cannot be deleted' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract ID from custom: prefix if present
    const presetId = id.startsWith('custom:') ? id.replace('custom:', '') : id;

    const deleted = await deleteCustomPreset(presetId, locals);

    if (!deleted) {
      return new Response(
        JSON.stringify({ error: 'Preset not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete preset';
    console.error('Delete preset error:', error);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
