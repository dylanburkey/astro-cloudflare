import { getDB, now } from '../db';
import type { SectionData, SectionBlock } from '../db/schema';
import { getCollection } from 'astro:content';

export type { SectionData };

function generateLiquidSection(section: SectionData): string {
  // Generate the schema JSON
  const schema = {
    name: section.name,
    settings: section.settings,
    blocks: section.blocks,
    max_blocks: section.maxBlocks,
    presets: section.presets.length > 0 ? section.presets : [{ name: section.name }],
  };

  // Generate basic Liquid template
  const blockCases = section.blocks.map((block: SectionBlock) => `{%- when '${block.type}' -%}
            {%- comment -%} ${block.name} {%- endcomment -%}
            <div class="block__content">
              {%- comment -%} Block content here {%- endcomment -%}
            </div>`).join('\n          ');

  const liquidTemplate = `{%- comment -%}
  ${section.name}
  ${section.description || 'No description'}
{%- endcomment -%}

<section class="section-${section.slug}" {{ section.shopify_attributes }}>
  <div class="container">
    {%- for block in section.blocks -%}
      <div class="block block--{{ block.type }}" {{ block.shopify_attributes }}>
        {%- case block.type -%}
          ${blockCases}
        {%- endcase -%}
      </div>
    {%- endfor -%}
  </div>
</section>

{% schema %}
${JSON.stringify(schema, null, 2)}
{% endschema %}
`;

  return liquidTemplate;
}

export async function addSectionToProject(
  projectSlug: string,
  sectionSlug: string,
  locals: App.Locals
): Promise<boolean> {
  const db = getDB(locals);

  // Get section from content collection (library)
  const sections = await getCollection('sections');
  const section = sections.find(s => s.data.slug === sectionSlug);

  if (!section) {
    throw new Error(`Section "${sectionSlug}" not found in library`);
  }

  // Get project
  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) {
    throw new Error(`Project "${projectSlug}" not found`);
  }

  // Check if section already exists in project
  const existing = await db
    .prepare('SELECT id FROM project_sections WHERE project_id = ? AND section_slug = ?')
    .bind(project.id, sectionSlug)
    .first();

  if (existing) {
    throw new Error(`Section "${sectionSlug}" already exists in project`);
  }

  const timestamp = now();
  const sectionData = section.data as unknown as SectionData;

  // Generate Liquid content
  const liquidContent = generateLiquidSection(sectionData);

  // Get next position
  const maxPos = await db
    .prepare('SELECT MAX(position) as max FROM project_sections WHERE project_id = ?')
    .bind(project.id)
    .first<{ max: number | null }>();

  const position = (maxPos?.max ?? -1) + 1;

  // Insert section reference and file in a batch
  await db.batch([
    db.prepare(`
      INSERT INTO project_sections (project_id, section_slug, position, added_at)
      VALUES (?, ?, ?, ?)
    `).bind(project.id, sectionSlug, position, timestamp),

    db.prepare(`
      INSERT INTO project_files (project_id, file_path, content, content_type, created_at, updated_at)
      VALUES (?, ?, ?, 'text/liquid', ?, ?)
    `).bind(project.id, `sections/${sectionSlug}.liquid`, liquidContent, timestamp, timestamp),

    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?')
      .bind(timestamp, project.id),
  ]);

  return true;
}

export async function removeSectionFromProject(
  projectSlug: string,
  sectionSlug: string,
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

  await db.batch([
    db.prepare('DELETE FROM project_sections WHERE project_id = ? AND section_slug = ?')
      .bind(project.id, sectionSlug),
    db.prepare('DELETE FROM project_files WHERE project_id = ? AND file_path = ?')
      .bind(project.id, `sections/${sectionSlug}.liquid`),
    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?')
      .bind(timestamp, project.id),
  ]);

  return true;
}

export async function listProjectSections(projectSlug: string, locals: App.Locals): Promise<string[]> {
  const db = getDB(locals);

  const project = await db
    .prepare('SELECT id FROM projects WHERE slug = ?')
    .bind(projectSlug)
    .first<{ id: string }>();

  if (!project) return [];

  const sections = await db
    .prepare('SELECT section_slug FROM project_sections WHERE project_id = ? ORDER BY position')
    .bind(project.id)
    .all<{ section_slug: string }>();

  return sections.results.map(s => s.section_slug);
}
