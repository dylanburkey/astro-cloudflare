import { getDB, now } from '../db';

interface BaseThemeFile {
  path: string;
  content: string;
  contentType: string;
}

// Base theme files bundled at build time
// These are the essential files needed for a new Shopify theme project
export function getBaseThemeFiles(): BaseThemeFile[] {
  return [
    {
      path: 'layout/theme.liquid',
      content: `<!doctype html>
<html lang="{{ request.locale.iso_code }}" class="no-js">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="{{ settings.color_primary }}">
    <title>
      {%- if page_title -%}{{ page_title }} &ndash; {{ shop.name }}{%- else -%}{{ shop.name }}{%- endif -%}
    </title>
    {% render 'head' %}
    {% render 'css-variables' %}
    {{ 'base.css' | asset_url | stylesheet_tag }}
    {{ content_for_header }}
  </head>
  <body class="template-{{ template.name | handle }}">
    <a href="#main-content" class="skip-to-content">{{ 'accessibility.skip_to_content' | t }}</a>
    {% sections 'header-group' %}
    <main id="main-content" role="main" tabindex="-1">{{ content_for_layout }}</main>
    {% sections 'footer-group' %}
    <script src="{{ 'base.js' | asset_url }}" defer></script>
  </body>
</html>`,
      contentType: 'text/liquid',
    },
    {
      path: 'config/settings_data.json',
      content: JSON.stringify({
        current: 'Default',
        presets: {
          Default: {}
        }
      }, null, 2),
      contentType: 'application/json',
    },
    {
      path: 'config/settings_schema.json',
      content: JSON.stringify([
        {
          name: "theme_info",
          theme_name: "Custom Theme",
          theme_version: "1.0.0",
          theme_author: "Theme Builder"
        },
        {
          name: "Colors",
          settings: [
            { type: "color", id: "color_primary", label: "Primary", default: "#000000" },
            { type: "color", id: "color_secondary", label: "Secondary", default: "#333333" },
            { type: "color", id: "color_accent", label: "Accent", default: "#0066cc" },
            { type: "color", id: "color_background", label: "Background", default: "#ffffff" },
            { type: "color", id: "color_text", label: "Text", default: "#000000" }
          ]
        },
        {
          name: "Typography",
          settings: [
            { type: "font_picker", id: "typography_heading_font", label: "Heading font", default: "assistant_n7" },
            { type: "font_picker", id: "typography_body_font", label: "Body font", default: "assistant_n4" }
          ]
        }
      ], null, 2),
      contentType: 'application/json',
    },
    {
      path: 'snippets/head.liquid',
      content: `{%- comment -%}
  Head snippet - meta tags and preloads
{%- endcomment -%}

<meta name="description" content="{{ page_description | escape }}">
<link rel="canonical" href="{{ canonical_url }}">

{%- if settings.favicon != blank -%}
  <link rel="icon" type="image/png" href="{{ settings.favicon | image_url: width: 32, height: 32 }}">
{%- endif -%}

<link rel="preconnect" href="https://cdn.shopify.com" crossorigin>`,
      contentType: 'text/liquid',
    },
    {
      path: 'snippets/css-variables.liquid',
      content: `{%- comment -%}
  CSS Variables from theme settings
{%- endcomment -%}

<style>
  :root {
    --color-primary: {{ settings.color_primary }};
    --color-secondary: {{ settings.color_secondary }};
    --color-accent: {{ settings.color_accent }};
    --color-background: {{ settings.color_background }};
    --color-text: {{ settings.color_text }};
  }
</style>`,
      contentType: 'text/liquid',
    },
    {
      path: 'assets/base.css',
      content: `/* Base CSS */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-body-family, system-ui, sans-serif);
  color: var(--color-text);
  background-color: var(--color-background);
}

.skip-to-content {
  position: absolute;
  left: -9999px;
}

.skip-to-content:focus {
  left: 0;
  z-index: 9999;
  padding: 1rem;
  background: var(--color-primary);
  color: #fff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}`,
      contentType: 'text/css',
    },
    {
      path: 'assets/base.js',
      content: `// Base JavaScript
document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');`,
      contentType: 'application/javascript',
    },
    {
      path: 'templates/index.json',
      content: JSON.stringify({
        sections: {},
        order: []
      }, null, 2),
      contentType: 'application/json',
    },
    {
      path: 'templates/product.json',
      content: JSON.stringify({
        sections: {
          main: { type: "main-product" }
        },
        order: ["main"]
      }, null, 2),
      contentType: 'application/json',
    },
    {
      path: 'templates/collection.json',
      content: JSON.stringify({
        sections: {
          main: { type: "main-collection" }
        },
        order: ["main"]
      }, null, 2),
      contentType: 'application/json',
    },
    {
      path: 'templates/cart.json',
      content: JSON.stringify({
        sections: {
          main: { type: "main-cart" }
        },
        order: ["main"]
      }, null, 2),
      contentType: 'application/json',
    },
    {
      path: 'templates/page.json',
      content: JSON.stringify({
        sections: {
          main: { type: "main-page" }
        },
        order: ["main"]
      }, null, 2),
      contentType: 'application/json',
    },
    {
      path: 'templates/404.json',
      content: JSON.stringify({
        sections: {
          main: { type: "main-404" }
        },
        order: ["main"]
      }, null, 2),
      contentType: 'application/json',
    },
    {
      path: 'locales/en.default.json',
      content: JSON.stringify({
        general: {
          skip_to_content: "Skip to content"
        },
        accessibility: {
          skip_to_content: "Skip to content"
        }
      }, null, 2),
      contentType: 'application/json',
    },
  ];
}

export async function getProjectFile(
  projectSlug: string,
  filePath: string,
  locals: App.Locals
): Promise<string | null> {
  const db = getDB(locals);

  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) return null;

  const file = await db
    .prepare('SELECT content FROM project_files WHERE project_id = ? AND file_path = ?')
    .bind(project.id, filePath)
    .first<{ content: string }>();

  return file?.content || null;
}

export async function updateProjectFile(
  projectSlug: string,
  filePath: string,
  content: string,
  locals: App.Locals
): Promise<boolean> {
  const db = getDB(locals);

  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) {
    throw new Error(`Project "${projectSlug}" not found`);
  }

  const timestamp = now();

  const result = await db
    .prepare('UPDATE project_files SET content = ?, updated_at = ? WHERE project_id = ? AND file_path = ?')
    .bind(content, timestamp, project.id, filePath)
    .run();

  return result.meta.changes > 0;
}

export async function listProjectFiles(projectSlug: string, locals: App.Locals): Promise<string[]> {
  const db = getDB(locals);

  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) return [];

  const files = await db
    .prepare('SELECT file_path FROM project_files WHERE project_id = ? ORDER BY file_path')
    .bind(project.id)
    .all<{ file_path: string }>();

  return files.results.map(f => f.file_path);
}
