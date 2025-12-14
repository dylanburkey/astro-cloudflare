import type { D1Database } from '@cloudflare/workers-types';

export function getDB(locals: App.Locals): D1Database {
  return locals.runtime.env.DB;
}

// Helper for JSON fields
export function parseJSON<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function toJSON(data: unknown): string {
  return JSON.stringify(data);
}

// Generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Get current ISO timestamp
export function now(): string {
  return new Date().toISOString();
}
