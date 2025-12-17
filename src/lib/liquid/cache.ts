import { getDB, now } from '../db';
import type { RenderedPreviewRow } from '../db/schema';

export interface CacheEntry {
  html: string;
  css: string | null;
  renderTimeMs: number;
}

// Generate a cache key from section slug, preset, and optional settings hash
export function generateCacheKey(
  sectionSlug: string,
  presetSlug?: string,
  settingsHash?: string
): string {
  const parts = [sectionSlug];
  if (presetSlug) parts.push(presetSlug);
  if (settingsHash) parts.push(settingsHash);
  return parts.join(':');
}

// Simple hash function for settings object
export function hashSettings(settings: Record<string, unknown>): string {
  const str = JSON.stringify(settings);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Get cached preview from D1
export async function getCachedPreview(
  cacheKey: string,
  locals: App.Locals
): Promise<CacheEntry | null> {
  try {
    const db = getDB(locals);

    const result = await db
      .prepare(`
        SELECT html, css, render_time_ms
        FROM rendered_previews
        WHERE cache_key = ? AND expires_at > datetime('now')
      `)
      .bind(cacheKey)
      .first<Pick<RenderedPreviewRow, 'html' | 'css' | 'render_time_ms'>>();

    if (!result) return null;

    return {
      html: result.html,
      css: result.css,
      renderTimeMs: result.render_time_ms ?? 0,
    };
  } catch (error) {
    // Cache miss on error - let rendering continue
    console.error('Cache lookup error:', error);
    return null;
  }
}

// Store rendered preview in D1 cache
export async function setCachedPreview(
  cacheKey: string,
  sectionSlug: string,
  presetSlug: string | null,
  entry: CacheEntry,
  ttlMinutes: number = 60,
  locals: App.Locals
): Promise<void> {
  try {
    const db = getDB(locals);
    const timestamp = now();
    const expires = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

    await db
      .prepare(`
        INSERT OR REPLACE INTO rendered_previews
        (cache_key, section_slug, preset_slug, html, css, render_time_ms, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        cacheKey,
        sectionSlug,
        presetSlug,
        entry.html,
        entry.css,
        entry.renderTimeMs,
        timestamp,
        expires
      )
      .run();
  } catch (error) {
    // Don't fail on cache write errors
    console.error('Cache write error:', error);
  }
}

// Invalidate cached previews for a section
export async function invalidateSectionCache(
  sectionSlug: string,
  locals: App.Locals
): Promise<number> {
  try {
    const db = getDB(locals);
    const result = await db
      .prepare('DELETE FROM rendered_previews WHERE section_slug = ?')
      .bind(sectionSlug)
      .run();
    return result.meta.changes;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

// Invalidate cached previews for a preset
export async function invalidatePresetCache(
  presetSlug: string,
  locals: App.Locals
): Promise<number> {
  try {
    const db = getDB(locals);
    const result = await db
      .prepare('DELETE FROM rendered_previews WHERE preset_slug = ?')
      .bind(presetSlug)
      .run();
    return result.meta.changes;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

// Clean up expired cache entries
export async function cleanupExpiredCache(locals: App.Locals): Promise<number> {
  try {
    const db = getDB(locals);
    const result = await db
      .prepare("DELETE FROM rendered_previews WHERE expires_at < datetime('now')")
      .run();
    return result.meta.changes;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}

// Get cache statistics
export async function getCacheStats(locals: App.Locals): Promise<{
  totalEntries: number;
  expiredEntries: number;
  totalSizeKb: number;
}> {
  try {
    const db = getDB(locals);

    const [total, expired] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM rendered_previews').first<{ count: number }>(),
      db.prepare("SELECT COUNT(*) as count FROM rendered_previews WHERE expires_at < datetime('now')").first<{ count: number }>(),
    ]);

    // Estimate size (approximate)
    const sizeResult = await db
      .prepare('SELECT SUM(LENGTH(html) + COALESCE(LENGTH(css), 0)) as size FROM rendered_previews')
      .first<{ size: number }>();

    return {
      totalEntries: total?.count ?? 0,
      expiredEntries: expired?.count ?? 0,
      totalSizeKb: Math.round((sizeResult?.size ?? 0) / 1024),
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return { totalEntries: 0, expiredEntries: 0, totalSizeKb: 0 };
  }
}
