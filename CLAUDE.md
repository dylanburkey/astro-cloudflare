# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `astro-cloudflare/` directory:

```bash
npm run dev       # Start local dev server at localhost:4321
npm run build     # Build production site to ./dist/
npm run preview   # Preview build with wrangler pages dev
npm run deploy    # Build and deploy to Cloudflare Workers
npm run sync:theme  # Sync theme sections from library
```

For deployment:
```bash
wrangler d1 execute theme-builder --remote --file=path/to/migration.sql  # Run D1 migrations
wrangler tail astro-cloudflare  # View live logs from deployed worker
```

## Architecture

This is a Shopify theme builder deployed to Cloudflare Workers using Astro SSR with Cloudflare D1 (SQLite) for data persistence.

### Data Layer

**D1 Database** (`theme-builder`) stores:
- `projects` - User-created theme projects
- `project_sections` - Sections added to each project (references library)
- `project_blocks` - Blocks added to each project
- `project_files` - Generated theme files (Liquid, JSON, assets)
- `variants` - Custom section variants created from library sections

Access pattern: `locals.runtime.env.DB` via `getDB(locals)` helper from `src/lib/db/index.ts`.

**Astro Content Collections** (static, read-only library):
- `library/sections/*.json` - Section definitions with settings/blocks schemas
- `library/blocks/*.json` - Block definitions with settings schemas
- `library/metaobjects/*.json` - Metaobject definitions
- `library/presets/*.json` - Color/typography presets
- `library/base-theme/` - Base Shopify theme files (layout, templates, snippets)

Content collections are configured in `src/content.config.ts` and accessed via `getCollection('sections')`, etc.

### Key Directories

```
src/
  lib/
    db/           # D1 helpers and TypeScript types (schema.ts)
    project/      # Project CRUD, add-section, add-block, export
    presets/      # Apply presets to projects
  pages/
    api/          # API routes (POST handlers for mutations)
    projects/     # Project dashboard and detail pages
    library/      # Browse sections, blocks, presets
  layouts/        # Dashboard.astro (main layout)
library/          # Static library content (JSON files)
```

### Runtime Environment

Cloudflare Workers with:
- `nodejs_compat` flag for Node.js APIs
- D1 binding as `DB`
- `fflate` for ZIP export (no Node.js fs/zlib)

TypeScript types for the runtime in `src/env.d.ts`.

## Patterns

### API Routes
API routes in `src/pages/api/` export `APIRoute` handlers. Pattern:
```typescript
import type { APIRoute } from 'astro';
export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDB(locals);
  // ...
};
```

### Page Data Loading
Astro pages access D1 via `Astro.locals`:
```typescript
const projects = await listProjects(Astro.locals);
```

### ZIP Export
Uses `fflate` library's `zipSync()` for creating theme ZIP files (see `src/lib/project/export.ts`).

## Notes

- When writing CSS, avoid using `!important`
- Never use emojis in commit messages, README.md files, or Pull Requests
- Projects in D1 are the source of truth; content collection projects (`src/content/projects/`) are legacy
