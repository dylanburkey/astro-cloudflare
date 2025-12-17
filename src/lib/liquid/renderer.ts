import { getCollection } from 'astro:content';
import { getLiquidEngine } from './engine';
import { generateMockDataFromSchema } from './mock-generator';
import {
  getCachedPreview,
  setCachedPreview,
  generateCacheKey,
  hashSettings,
  type CacheEntry,
} from './cache';
import type { SectionData, PresetColors, PresetTypography } from '../db/schema';

export interface RenderOptions {
  sectionSlug: string;
  presetSlug?: string;
  customSettings?: Record<string, unknown>;
  locals: App.Locals;
  skipCache?: boolean;
}

export interface RenderResult {
  html: string;
  css: string;
  errors: string[];
  renderTimeMs: number;
  cached: boolean;
}

// Load section data from content collection
async function loadSectionData(slug: string): Promise<SectionData | null> {
  try {
    const sections = await getCollection('sections');
    const section = sections.find(s => s.data.slug === slug);
    return section?.data ?? null;
  } catch (error) {
    console.error('Failed to load section:', error);
    return null;
  }
}

// Load preset data
async function loadPresetData(slug: string): Promise<{
  colors?: PresetColors;
  typography?: PresetTypography;
} | null> {
  try {
    // Load from static presets
    const presets = import.meta.glob('/library/presets/*.json', { eager: true });
    const presetPath = `/library/presets/${slug}.json`;

    if (presets[presetPath]) {
      const preset = presets[presetPath] as {
        default?: {
          colors?: PresetColors;
          typography?: PresetTypography;
        };
        colors?: PresetColors;
        typography?: PresetTypography;
      };
      return preset.default || preset;
    }

    return null;
  } catch (error) {
    console.error('Failed to load preset:', error);
    return null;
  }
}

// Load Liquid template for section
async function loadSectionTemplate(slug: string): Promise<string | null> {
  try {
    // Try to load from library/base-theme/sections/
    const templates = import.meta.glob('/library/base-theme/sections/*.liquid', {
      eager: true,
      query: '?raw',
      import: 'default',
    });

    const templatePath = `/library/base-theme/sections/${slug}.liquid`;
    if (templates[templatePath]) {
      return templates[templatePath] as string;
    }

    // If no template found, return null (will use generated template)
    return null;
  } catch (error) {
    console.error('Failed to load template:', error);
    return null;
  }
}

// Generate a basic template from section schema
function generateTemplateFromSchema(section: SectionData): string {
  const parts: string[] = [];

  // Opening section tag
  parts.push(`<section class="section section--${section.slug}" data-section-id="{{ section.id }}">`);
  parts.push('  <div class="section__container container">');

  // Generate content based on section category
  switch (section.category) {
    case 'hero':
      parts.push(generateHeroTemplate(section));
      break;
    case 'collection':
    case 'featured-collection':
      parts.push(generateCollectionTemplate(section));
      break;
    case 'product':
      parts.push(generateProductTemplate(section));
      break;
    case 'header':
      parts.push(generateHeaderTemplate(section));
      break;
    case 'footer':
      parts.push(generateFooterTemplate(section));
      break;
    default:
      parts.push(generateGenericTemplate(section));
  }

  parts.push('  </div>');
  parts.push('</section>');

  return parts.join('\n');
}

function generateHeroTemplate(section: SectionData): string {
  return `
    <div class="hero">
      {% if section.settings.heading %}
        <h1 class="hero__heading">{{ section.settings.heading }}</h1>
      {% endif %}
      {% if section.settings.subheading %}
        <p class="hero__subheading">{{ section.settings.subheading }}</p>
      {% endif %}
      {% if section.settings.button_label %}
        <a href="{{ section.settings.button_link | default: '#' }}" class="hero__button button">
          {{ section.settings.button_label }}
        </a>
      {% endif %}

      {% for block in section.blocks %}
        <div class="hero__block hero__block--{{ block.type }}" {{ block.shopify_attributes }}>
          {% case block.type %}
            {% when 'heading' %}
              <h2>{{ block.settings.heading | default: 'Heading' }}</h2>
            {% when 'text' %}
              <p>{{ block.settings.text | default: 'Text content' }}</p>
            {% when 'button' %}
              <a href="{{ block.settings.link | default: '#' }}" class="button">
                {{ block.settings.label | default: 'Button' }}
              </a>
            {% when 'image' %}
              {% if block.settings.image %}
                {{ block.settings.image | image_url: width: 800 | image_tag: block.settings.image.alt }}
              {% else %}
                <div class="placeholder-image">Image placeholder</div>
              {% endif %}
          {% endcase %}
        </div>
      {% endfor %}
    </div>
  `;
}

function generateCollectionTemplate(section: SectionData): string {
  return `
    <div class="collection-section">
      {% if section.settings.heading %}
        <h2 class="collection-section__heading">{{ section.settings.heading }}</h2>
      {% endif %}

      {% if collection %}
        <div class="collection-grid">
          {% for product in collection.products limit: 8 %}
            <div class="product-card">
              <a href="{{ product.url }}">
                {% if product.featured_image %}
                  {{ product.featured_image | image_url: width: 400 | image_tag: product.title }}
                {% else %}
                  <div class="product-card__placeholder">No image</div>
                {% endif %}
                <h3 class="product-card__title">{{ product.title }}</h3>
                <p class="product-card__price">{{ product.price | money }}</p>
              </a>
            </div>
          {% endfor %}
        </div>
      {% else %}
        <p class="collection-section__empty">No collection selected</p>
      {% endif %}
    </div>
  `;
}

function generateProductTemplate(section: SectionData): string {
  return `
    <div class="product-section">
      {% if product %}
        <div class="product-section__media">
          {% if product.featured_image %}
            {{ product.featured_image | image_url: width: 600 | image_tag: product.title }}
          {% endif %}
        </div>
        <div class="product-section__info">
          <h1 class="product-section__title">{{ product.title }}</h1>
          <p class="product-section__price">{{ product.price | money }}</p>
          <div class="product-section__description">{{ product.description }}</div>
          <button type="button" class="button product-section__button">Add to Cart</button>
        </div>
      {% else %}
        <p>No product selected</p>
      {% endif %}
    </div>
  `;
}

function generateHeaderTemplate(section: SectionData): string {
  return `
    <header class="header">
      <div class="header__logo">
        {% if section.settings.logo %}
          {{ section.settings.logo | image_url: width: 200 | image_tag: shop.name }}
        {% else %}
          <span class="header__logo-text">{{ shop.name }}</span>
        {% endif %}
      </div>
      <nav class="header__nav">
        {% if linklists['main-menu'] %}
          {% for link in linklists['main-menu'].links %}
            <a href="{{ link.url }}" class="header__nav-link{% if link.active %} header__nav-link--active{% endif %}">
              {{ link.title }}
            </a>
          {% endfor %}
        {% endif %}
      </nav>
      <div class="header__actions">
        <a href="{{ routes.search_url }}" class="header__icon">Search</a>
        <a href="{{ routes.cart_url }}" class="header__icon">Cart ({{ cart.item_count }})</a>
      </div>
    </header>
  `;
}

function generateFooterTemplate(section: SectionData): string {
  return `
    <footer class="footer">
      <div class="footer__content">
        {% for block in section.blocks %}
          <div class="footer__block footer__block--{{ block.type }}" {{ block.shopify_attributes }}>
            {% case block.type %}
              {% when 'menu' %}
                <h4>{{ block.settings.heading | default: 'Menu' }}</h4>
                {% if linklists['footer-menu'] %}
                  <ul class="footer__menu">
                    {% for link in linklists['footer-menu'].links %}
                      <li><a href="{{ link.url }}">{{ link.title }}</a></li>
                    {% endfor %}
                  </ul>
                {% endif %}
              {% when 'text' %}
                <h4>{{ block.settings.heading | default: 'About' }}</h4>
                <p>{{ block.settings.text | default: 'About text' }}</p>
            {% endcase %}
          </div>
        {% endfor %}
      </div>
      <div class="footer__copyright">
        <p>&copy; {{ 'now' | date: '%Y' }} {{ shop.name }}. All rights reserved.</p>
      </div>
    </footer>
  `;
}

function generateGenericTemplate(section: SectionData): string {
  return `
    <div class="generic-section">
      {% if section.settings.heading %}
        <h2 class="generic-section__heading">{{ section.settings.heading }}</h2>
      {% endif %}

      {% if section.settings.text or section.settings.content %}
        <div class="generic-section__content">
          {{ section.settings.text | default: section.settings.content }}
        </div>
      {% endif %}

      {% for block in section.blocks %}
        <div class="generic-section__block generic-section__block--{{ block.type }}" {{ block.shopify_attributes }}>
          {% case block.type %}
            {% when 'heading' %}
              <h3>{{ block.settings.heading | default: block.settings.text | default: 'Heading' }}</h3>
            {% when 'text' %}
              <p>{{ block.settings.text | default: 'Text content' }}</p>
            {% when 'button' %}
              <a href="{{ block.settings.link | default: '#' }}" class="button">
                {{ block.settings.label | default: block.settings.text | default: 'Button' }}
              </a>
            {% when 'image' %}
              {% if block.settings.image %}
                {{ block.settings.image | image_url: width: 600 | image_tag }}
              {% else %}
                <div class="placeholder-image">Image</div>
              {% endif %}
            {% else %}
              <div class="block-placeholder">{{ block.type }}</div>
          {% endcase %}
        </div>
      {% endfor %}
    </div>
  `;
}

// Generate basic CSS for preview
function generatePreviewCSS(section: SectionData): string {
  return `
    /* Preview styles for ${section.name} */
    .section {
      padding: 2rem 0;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    /* Hero styles */
    .hero {
      text-align: center;
      padding: 4rem 2rem;
      background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
      border-radius: 0.5rem;
    }

    .hero__heading {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #1e293b;
    }

    .hero__subheading {
      font-size: 1.25rem;
      color: #64748b;
      margin-bottom: 2rem;
    }

    /* Button styles */
    .button {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: background 0.2s;
    }

    .button:hover {
      background: #1d4ed8;
    }

    /* Collection grid */
    .collection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    /* Product card */
    .product-card {
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }

    .product-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .product-card a {
      text-decoration: none;
      color: inherit;
    }

    .product-card img {
      width: 100%;
      height: auto;
      display: block;
    }

    .product-card__title {
      font-size: 1rem;
      padding: 0.75rem;
      margin: 0;
    }

    .product-card__price {
      padding: 0 0.75rem 0.75rem;
      color: #64748b;
      margin: 0;
    }

    /* Product section */
    .product-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .product-section__media img {
      width: 100%;
      height: auto;
      border-radius: 0.5rem;
    }

    .product-section__title {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .product-section__price {
      font-size: 1.5rem;
      color: #2563eb;
      margin-bottom: 1rem;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .header__logo-text {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .header__nav {
      display: flex;
      gap: 1.5rem;
    }

    .header__nav-link {
      text-decoration: none;
      color: #64748b;
    }

    .header__nav-link:hover,
    .header__nav-link--active {
      color: #1e293b;
    }

    .header__actions {
      display: flex;
      gap: 1rem;
    }

    .header__icon {
      text-decoration: none;
      color: #64748b;
    }

    /* Footer */
    .footer {
      background: #f8fafc;
      padding: 3rem 0 1.5rem;
      margin-top: 2rem;
    }

    .footer__content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .footer__menu {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer__menu a {
      color: #64748b;
      text-decoration: none;
    }

    .footer__copyright {
      text-align: center;
      color: #94a3b8;
      font-size: 0.875rem;
      border-top: 1px solid #e2e8f0;
      padding-top: 1.5rem;
    }

    /* Generic section */
    .generic-section__heading {
      font-size: 1.75rem;
      margin-bottom: 1rem;
    }

    .generic-section__content {
      color: #64748b;
      margin-bottom: 1.5rem;
    }

    .generic-section__block {
      margin-bottom: 1rem;
    }

    /* Placeholder */
    .placeholder-image {
      background: #e2e8f0;
      padding: 2rem;
      text-align: center;
      color: #94a3b8;
      border-radius: 0.5rem;
    }

    .block-placeholder {
      background: #f1f5f9;
      padding: 1rem;
      border-radius: 0.25rem;
      color: #94a3b8;
      font-style: italic;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
    }
  `;
}

// Main render function
export async function renderSection(options: RenderOptions): Promise<RenderResult> {
  const { sectionSlug, presetSlug, customSettings, locals, skipCache } = options;
  const startTime = performance.now();
  const errors: string[] = [];

  // Generate cache key
  const settingsHash = customSettings ? hashSettings(customSettings) : undefined;
  const cacheKey = generateCacheKey(sectionSlug, presetSlug, settingsHash);

  // Check cache first (unless skipped)
  if (!skipCache) {
    const cached = await getCachedPreview(cacheKey, locals);
    if (cached) {
      return {
        html: cached.html,
        css: cached.css ?? '',
        errors: [],
        renderTimeMs: cached.renderTimeMs,
        cached: true,
      };
    }
  }

  // Load section data
  const sectionData = await loadSectionData(sectionSlug);
  if (!sectionData) {
    return {
      html: `<div class="error">Section not found: ${sectionSlug}</div>`,
      css: '',
      errors: [`Section not found: ${sectionSlug}`],
      renderTimeMs: performance.now() - startTime,
      cached: false,
    };
  }

  // Load preset if specified
  const presetData = presetSlug ? await loadPresetData(presetSlug) : undefined;

  // Load or generate template
  let template = await loadSectionTemplate(sectionSlug);
  if (!template) {
    template = generateTemplateFromSchema(sectionData);
  }

  // Generate mock data
  const context = generateMockDataFromSchema(sectionData, presetData ?? undefined);

  // Apply custom settings if provided
  if (customSettings) {
    Object.assign(context.section.settings, customSettings);
  }

  // Render template
  const engine = getLiquidEngine();
  let html: string;

  try {
    html = await engine.parseAndRender(template, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown render error';
    errors.push(message);
    html = `<div class="error">Render error: ${message}</div>`;
  }

  // Generate CSS
  const css = generatePreviewCSS(sectionData);

  const renderTimeMs = Math.round(performance.now() - startTime);

  // Cache the result
  if (!skipCache && errors.length === 0) {
    const cacheEntry: CacheEntry = { html, css, renderTimeMs };
    await setCachedPreview(cacheKey, sectionSlug, presetSlug ?? null, cacheEntry, 60, locals);
  }

  return {
    html,
    css,
    errors,
    renderTimeMs,
    cached: false,
  };
}

// Batch render multiple sections
export async function renderSectionsBatch(
  slugs: string[],
  presetSlug: string | undefined,
  locals: App.Locals
): Promise<Map<string, RenderResult>> {
  const results = new Map<string, RenderResult>();

  // Limit batch size
  const limitedSlugs = slugs.slice(0, 20);

  await Promise.all(
    limitedSlugs.map(async (slug) => {
      const result = await renderSection({
        sectionSlug: slug,
        presetSlug,
        locals,
      });
      results.set(slug, result);
    })
  );

  return results;
}
