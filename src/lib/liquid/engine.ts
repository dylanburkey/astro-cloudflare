import { Liquid, type TagToken, type Context, type TopLevelToken, type Emitter } from 'liquidjs';

// Create a Shopify-compatible Liquid engine
export function createLiquidEngine(): Liquid {
  const engine = new Liquid({
    strictFilters: false,
    strictVariables: false,
    trimTagLeft: false,
    trimTagRight: false,
    trimOutputLeft: false,
    trimOutputRight: false,
  });

  // Register Shopify-specific tags
  registerShopifyTags(engine);

  // Register Shopify-specific filters
  registerShopifyFilters(engine);

  return engine;
}

function registerShopifyTags(engine: Liquid): void {
  // {% schema %} - Parse and ignore (metadata only, already extracted)
  engine.registerTag('schema', {
    parse(tagToken: TagToken, remainTokens: TopLevelToken[]) {
      // Consume all tokens until endschema
      while (remainTokens.length) {
        const token = remainTokens.shift();
        if (token?.name === 'endschema') break;
      }
    },
    render() {
      // Schema is metadata only, don't render anything
      return '';
    },
  });

  // {% style %} - Output CSS with scope
  engine.registerTag('style', {
    parse(tagToken: TagToken, remainTokens: TopLevelToken[]) {
      this.content = [];
      while (remainTokens.length) {
        const token = remainTokens.shift();
        if (token?.name === 'endstyle') break;
        if (token) this.content.push(token);
      }
    },
    *render(context: Context, emitter: Emitter) {
      const content: string[] = [];
      for (const token of this.content) {
        const rendered = yield this.liquid.renderer.renderToken(token, context);
        content.push(String(rendered ?? ''));
      }
      emitter.write(`<style>${content.join('')}</style>`);
    },
  });

  // {% javascript %} - Output JS (deferred in real Shopify, inline in preview)
  engine.registerTag('javascript', {
    parse(tagToken: TagToken, remainTokens: TopLevelToken[]) {
      this.content = [];
      while (remainTokens.length) {
        const token = remainTokens.shift();
        if (token?.name === 'endjavascript') break;
        if (token) this.content.push(token);
      }
    },
    *render(context: Context, emitter: Emitter) {
      const content: string[] = [];
      for (const token of this.content) {
        const rendered = yield this.liquid.renderer.renderToken(token, context);
        content.push(String(rendered ?? ''));
      }
      emitter.write(`<script>${content.join('')}</script>`);
    },
  });

  // {% render 'snippet' %} - Render snippet (stub for preview)
  engine.registerTag('render', {
    parse(tagToken: TagToken) {
      this.snippetName = tagToken.args.replace(/['"]/g, '').trim();
    },
    render() {
      // In preview mode, show placeholder for snippets
      return `<!-- snippet: ${this.snippetName} -->`;
    },
  });

  // {% section 'name' %} - Section include (stub for preview)
  engine.registerTag('section', {
    parse(tagToken: TagToken) {
      this.sectionName = tagToken.args.replace(/['"]/g, '').trim();
    },
    render() {
      return `<!-- section: ${this.sectionName} -->`;
    },
  });

  // {% sections 'group' %} - Section group (stub for preview)
  engine.registerTag('sections', {
    parse(tagToken: TagToken) {
      this.groupName = tagToken.args.replace(/['"]/g, '').trim();
    },
    render() {
      return `<!-- sections group: ${this.groupName} -->`;
    },
  });

  // {% form 'type' %} - Shopify form (simplified preview)
  engine.registerTag('form', {
    parse(tagToken: TagToken, remainTokens: TopLevelToken[]) {
      this.formType = tagToken.args.replace(/['"]/g, '').split(',')[0].trim();
      this.content = [];
      while (remainTokens.length) {
        const token = remainTokens.shift();
        if (token?.name === 'endform') break;
        if (token) this.content.push(token);
      }
    },
    *render(context: Context, emitter: Emitter) {
      emitter.write(`<form class="shopify-form" data-form-type="${this.formType}">`);
      for (const token of this.content) {
        const rendered = yield this.liquid.renderer.renderToken(token, context);
        emitter.write(String(rendered ?? ''));
      }
      emitter.write('</form>');
    },
  });

  // {% paginate %} - Pagination (stub)
  engine.registerTag('paginate', {
    parse(tagToken: TagToken, remainTokens: TopLevelToken[]) {
      this.content = [];
      while (remainTokens.length) {
        const token = remainTokens.shift();
        if (token?.name === 'endpaginate') break;
        if (token) this.content.push(token);
      }
    },
    *render(context: Context, emitter: Emitter) {
      for (const token of this.content) {
        const rendered = yield this.liquid.renderer.renderToken(token, context);
        emitter.write(String(rendered ?? ''));
      }
    },
  });

  // {% layout 'none' %} - Layout control (ignore in preview)
  engine.registerTag('layout', {
    parse() {},
    render() {
      return '';
    },
  });

  // {% liquid %} - Multi-line liquid (already supported by liquidjs)
}

function registerShopifyFilters(engine: Liquid): void {
  // Image URL filter
  engine.registerFilter('image_url', (src: string, options?: { width?: number; height?: number }) => {
    if (!src) return getPlaceholderImage(400, 400);
    if (src.startsWith('http')) return src;
    const width = options?.width || 400;
    const height = options?.height || width;
    return getPlaceholderImage(width, height);
  });

  // Image tag filter
  engine.registerFilter('image_tag', (src: string, alt?: string) => {
    const url = typeof src === 'string' ? src : getPlaceholderImage(400, 400);
    const altText = alt || 'Image';
    return `<img src="${url}" alt="${escapeHtml(altText)}" loading="lazy" />`;
  });

  // Asset URL filter
  engine.registerFilter('asset_url', (filename: string) => {
    return `/assets/${filename}`;
  });

  // Asset image URL filter
  engine.registerFilter('asset_img_url', (filename: string, size?: string) => {
    return `/assets/${filename}`;
  });

  // Stylesheet tag filter
  engine.registerFilter('stylesheet_tag', (url: string) => {
    return `<link rel="stylesheet" href="${escapeHtml(url)}" />`;
  });

  // Script tag filter
  engine.registerFilter('script_tag', (url: string) => {
    return `<script src="${escapeHtml(url)}"></script>`;
  });

  // Money filters
  engine.registerFilter('money', (cents: number) => {
    const dollars = (cents / 100).toFixed(2);
    return `$${dollars}`;
  });

  engine.registerFilter('money_with_currency', (cents: number) => {
    const dollars = (cents / 100).toFixed(2);
    return `$${dollars} USD`;
  });

  engine.registerFilter('money_without_currency', (cents: number) => {
    const dollars = (cents / 100).toFixed(2);
    return `$${dollars}`;
  });

  engine.registerFilter('money_without_trailing_zeros', (cents: number) => {
    const dollars = cents / 100;
    return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
  });

  // Translation filter (returns key or default)
  engine.registerFilter('t', (key: string, vars?: Record<string, unknown>) => {
    // In preview mode, just return the key or use vars as fallback
    if (vars && vars.default) return String(vars.default);
    return key;
  });

  // Handle filter
  engine.registerFilter('handle', (str: string) => {
    return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });

  // Handleize filter (alias)
  engine.registerFilter('handleize', (str: string) => {
    return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });

  // URL filters
  engine.registerFilter('link_to', (label: string, url: string, title?: string) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(url || '#')}"${titleAttr}>${label}</a>`;
  });

  engine.registerFilter('link_to_tag', (label: string, tag: string) => {
    return `<a href="/collections/all/${tag}">${label}</a>`;
  });

  engine.registerFilter('link_to_vendor', (vendor: string) => {
    return `<a href="/collections/vendors?q=${encodeURIComponent(vendor)}">${vendor}</a>`;
  });

  engine.registerFilter('link_to_type', (type: string) => {
    return `<a href="/collections/types?q=${encodeURIComponent(type)}">${type}</a>`;
  });

  engine.registerFilter('within', (url: string, collection: { url?: string }) => {
    if (collection?.url) {
      return `${collection.url}${url}`;
    }
    return url;
  });

  // Product URL filter
  engine.registerFilter('product_url', (product: { handle?: string }) => {
    return `/products/${product?.handle || 'product'}`;
  });

  // Collection URL filter
  engine.registerFilter('collection_url', (collection: { handle?: string }) => {
    return `/collections/${collection?.handle || 'all'}`;
  });

  // Font filters
  engine.registerFilter('font_face', (font: { family?: string; style?: string; weight?: number }) => {
    if (!font) return '';
    return `@font-face { font-family: "${font.family || 'sans-serif'}"; }`;
  });

  engine.registerFilter('font_url', (font: { family?: string }) => {
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font?.family || 'Inter')}`;
  });

  engine.registerFilter('font_modify', (font: unknown, property: string, value: unknown) => {
    return font;
  });

  // Color filters
  engine.registerFilter('color_to_rgb', (color: string) => {
    return color; // Return as-is for preview
  });

  engine.registerFilter('color_to_hsl', (color: string) => {
    return color;
  });

  engine.registerFilter('color_modify', (color: string, property: string, value: number) => {
    return color;
  });

  engine.registerFilter('color_lighten', (color: string, amount: number) => {
    return color;
  });

  engine.registerFilter('color_darken', (color: string, amount: number) => {
    return color;
  });

  engine.registerFilter('brightness_difference', (color1: string, color2: string) => {
    return 100;
  });

  engine.registerFilter('color_contrast', (color1: string, color2: string) => {
    return 4.5;
  });

  // String filters
  engine.registerFilter('pluralize', (count: number, singular: string, plural: string) => {
    return count === 1 ? singular : plural;
  });

  engine.registerFilter('highlight', (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return String(text).replace(regex, '<mark>$1</mark>');
  });

  engine.registerFilter('json', (obj: unknown) => {
    return JSON.stringify(obj);
  });

  // Date filter
  engine.registerFilter('date', (date: string | Date, format: string) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return String(date);
    // Simplified date formatting
    return d.toLocaleDateString();
  });

  // Array filters
  engine.registerFilter('where', (array: unknown[], property: string, value: unknown) => {
    if (!Array.isArray(array)) return [];
    return array.filter(item => {
      if (typeof item === 'object' && item !== null) {
        return (item as Record<string, unknown>)[property] === value;
      }
      return false;
    });
  });

  // Media filters
  engine.registerFilter('media_tag', (media: { preview_image?: { src?: string }; alt?: string }) => {
    const src = media?.preview_image?.src || getPlaceholderImage(400, 400);
    return `<img src="${src}" alt="${escapeHtml(media?.alt || 'Media')}" />`;
  });

  // Metafield filter
  engine.registerFilter('metafield_tag', (metafield: { value?: string; type?: string }) => {
    return metafield?.value || '';
  });

  engine.registerFilter('metafield_text', (metafield: { value?: string }) => {
    return metafield?.value || '';
  });

  // External video filters
  engine.registerFilter('external_video_tag', (video: { host?: string; id?: string }) => {
    return `<div class="video-placeholder">Video: ${video?.host || 'external'}</div>`;
  });

  engine.registerFilter('external_video_url', (video: { host?: string; id?: string }) => {
    if (video?.host === 'youtube') {
      return `https://www.youtube.com/embed/${video.id}`;
    }
    return '#';
  });
}

// Helper function to get placeholder images
function getPlaceholderImage(width: number, height: number): string {
  return `https://placehold.co/${width}x${height}/e2e8f0/64748b?text=Preview`;
}

// Helper to escape HTML
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export singleton instance
let engineInstance: Liquid | null = null;

export function getLiquidEngine(): Liquid {
  if (!engineInstance) {
    engineInstance = createLiquidEngine();
  }
  return engineInstance;
}
