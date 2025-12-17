import type {
  RenderContext,
  MockProductData,
  MockCollectionData,
  MockImageData,
  MockVariantData,
  MockSectionContext,
  MockBlockContext,
  MockShopData,
  MockThemeSettings,
} from './mock-data';
import type { SectionData, SectionSetting, SectionBlock, PresetColors, PresetTypography } from '../db/schema';

// Generate a placeholder image URL
function getPlaceholderImage(width: number, height: number, text?: string): string {
  const label = text ? encodeURIComponent(text) : 'Preview';
  return `https://placehold.co/${width}x${height}/e2e8f0/64748b?text=${label}`;
}

// Generate mock image data
function generateMockImage(index: number = 0, category?: string): MockImageData {
  const width = 800;
  const height = 800;
  return {
    id: 1000 + index,
    src: getPlaceholderImage(width, height, category || 'Product'),
    alt: `Sample image ${index + 1}`,
    width,
    height,
    aspect_ratio: width / height,
    position: index + 1,
  };
}

// Generate mock variant
function generateMockVariant(index: number, productHandle: string): MockVariantData {
  const sizes = ['Small', 'Medium', 'Large', 'X-Large'];
  const colors = ['Black', 'White', 'Navy', 'Gray'];
  const size = sizes[index % sizes.length];
  const color = colors[Math.floor(index / sizes.length) % colors.length];
  const price = 2999 + (index * 500);

  return {
    id: 2000 + index,
    title: `${size} / ${color}`,
    sku: `SKU-${productHandle.toUpperCase()}-${index + 1}`,
    barcode: `123456789${index}`,
    price,
    compare_at_price: index % 2 === 0 ? price + 1000 : null,
    available: index % 3 !== 2,
    inventory_quantity: 10 + index,
    inventory_policy: 'deny',
    option1: size,
    option2: color,
    option3: null,
    image: null,
    featured_image: null,
    url: `/products/${productHandle}?variant=${2000 + index}`,
    weight: 500,
    weight_unit: 'g',
  };
}

// Generate mock product
function generateMockProduct(index: number = 0): MockProductData {
  const titles = [
    'Premium Cotton T-Shirt',
    'Classic Denim Jacket',
    'Leather Messenger Bag',
    'Wireless Headphones',
    'Organic Face Serum',
    'Handcrafted Ceramic Mug',
  ];
  const vendors = ['Acme Co', 'StyleBrand', 'TechGear', 'NatureCraft'];
  const types = ['Apparel', 'Accessories', 'Electronics', 'Home & Garden'];

  const title = titles[index % titles.length];
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const price = 2999 + (index * 1000);
  const variants = Array.from({ length: 4 }, (_, i) => generateMockVariant(i, handle));
  const images = Array.from({ length: 3 }, (_, i) => generateMockImage(i, 'Product'));

  return {
    id: 1000 + index,
    title,
    handle,
    description: `<p>High-quality ${title.toLowerCase()} made with premium materials. Perfect for everyday use with exceptional durability and style.</p>`,
    price,
    price_min: price,
    price_max: price + 2000,
    compare_at_price: index % 2 === 0 ? price + 1500 : null,
    compare_at_price_min: index % 2 === 0 ? price + 1500 : null,
    compare_at_price_max: index % 2 === 0 ? price + 3500 : null,
    featured_image: images[0],
    featured_media: { id: 3000, media_type: 'image', preview_image: images[0], alt: title, position: 1 },
    images,
    media: images.map((img, i) => ({ id: 3000 + i, media_type: 'image' as const, preview_image: img, alt: img.alt, position: i + 1 })),
    variants,
    options: [
      { name: 'Size', position: 1, values: ['Small', 'Medium', 'Large', 'X-Large'] },
      { name: 'Color', position: 2, values: ['Black', 'White', 'Navy', 'Gray'] },
    ],
    options_with_values: [
      { name: 'Size', position: 1, values: [{ value: 'Small', available: true }, { value: 'Medium', available: true }, { value: 'Large', available: true }, { value: 'X-Large', available: false }], selected_value: 'Medium' },
      { name: 'Color', position: 2, values: [{ value: 'Black', available: true }, { value: 'White', available: true }, { value: 'Navy', available: true }, { value: 'Gray', available: true }], selected_value: 'Black' },
    ],
    vendor: vendors[index % vendors.length],
    type: types[index % types.length],
    tags: ['new', 'featured', 'bestseller'].slice(0, (index % 3) + 1),
    available: true,
    selected_variant: variants[0],
    selected_or_first_available_variant: variants[0],
    first_available_variant: variants[0],
    has_only_default_variant: false,
    requires_selling_plan: false,
    selling_plan_groups: [],
    url: `/products/${handle}`,
    collections: [],
  };
}

// Generate mock collection
function generateMockCollection(index: number = 0): MockCollectionData {
  const titles = [
    'New Arrivals',
    'Best Sellers',
    'Summer Collection',
    'Sale Items',
    'Featured Products',
  ];

  const title = titles[index % titles.length];
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const products = Array.from({ length: 8 }, (_, i) => generateMockProduct(i));

  return {
    id: 5000 + index,
    title,
    handle,
    description: `<p>Explore our ${title.toLowerCase()} featuring the best products curated just for you.</p>`,
    image: generateMockImage(0, 'Collection'),
    products,
    products_count: products.length,
    all_products_count: 24,
    all_tags: ['new', 'featured', 'sale', 'bestseller'],
    all_types: ['Apparel', 'Accessories', 'Electronics'],
    all_vendors: ['Acme Co', 'StyleBrand', 'TechGear'],
    url: `/collections/${handle}`,
    current_type: null,
    current_vendor: null,
    sort_by: 'best-selling',
    sort_options: [
      { name: 'Best Selling', value: 'best-selling' },
      { name: 'Alphabetically, A-Z', value: 'title-ascending' },
      { name: 'Alphabetically, Z-A', value: 'title-descending' },
      { name: 'Price, low to high', value: 'price-ascending' },
      { name: 'Price, high to low', value: 'price-descending' },
      { name: 'Date, old to new', value: 'created-ascending' },
      { name: 'Date, new to old', value: 'created-descending' },
    ],
  };
}

// Generate default shop data
function generateMockShop(): MockShopData {
  return {
    shop: {
      name: 'Demo Store',
      description: 'Your one-stop shop for quality products',
      email: 'hello@demo-store.com',
      url: 'https://demo-store.myshopify.com',
      currency: { iso_code: 'USD' },
      money_format: '${{amount}}',
      enabled_payment_types: ['visa', 'mastercard', 'amex', 'paypal', 'apple_pay', 'google_pay'],
    },
    request: {
      locale: { iso_code: 'en', name: 'English' },
      host: 'demo-store.myshopify.com',
      path: '/',
    },
    template: {
      name: 'index',
      suffix: null,
    },
    cart: {
      currency: { iso_code: 'USD' },
      item_count: 3,
      items: [],
      total_price: 8997,
      original_total_price: 10497,
    },
    customer: null,
    canonical_url: 'https://demo-store.myshopify.com/',
    page_title: 'Demo Store',
    page_description: 'Your one-stop shop for quality products',
  };
}

// Generate default value based on setting type
function getDefaultValue(setting: SectionSetting): unknown {
  if (setting.default !== undefined) {
    return setting.default;
  }

  const typeDefaults: Record<string, unknown> = {
    text: 'Sample text',
    textarea: 'Sample paragraph text with more details about this section.',
    richtext: '<p>Sample rich text content with <strong>formatting</strong>.</p>',
    html: '<div class="custom-html">Custom HTML content</div>',
    image_picker: null,
    video: null,
    video_url: null,
    url: '#',
    checkbox: false,
    range: 50,
    number: 1,
    select: null,
    radio: null,
    color: '#000000',
    color_background: 'rgba(0,0,0,0)',
    font_picker: 'sans-serif',
    collection: null,
    collection_list: [],
    product: null,
    product_list: [],
    blog: null,
    article: null,
    page: null,
    link_list: null,
    header: null,
    paragraph: null,
  };

  return typeDefaults[setting.type] ?? null;
}

// Extract settings values from schema with defaults
function extractSettingsDefaults(settings: SectionSetting[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const setting of settings) {
    if (setting.type === 'header' || setting.type === 'paragraph') {
      continue; // Skip non-value settings
    }
    result[setting.id] = getDefaultValue(setting);
  }

  return result;
}

// Generate mock blocks from section schema
function generateMockBlocks(
  blockTypes: SectionBlock[],
  presets?: unknown[]
): MockBlockContext[] {
  // If presets exist and have blocks, use them
  if (presets && Array.isArray(presets) && presets.length > 0) {
    const preset = presets[0] as { blocks?: Array<{ type: string; settings?: Record<string, unknown> }> };
    if (preset.blocks && Array.isArray(preset.blocks)) {
      return preset.blocks.map((block, index) => {
        const blockType = blockTypes.find(bt => bt.type === block.type);
        const blockSettings = block.settings || {};

        // Merge with defaults from block type
        if (blockType?.settings) {
          for (const setting of blockType.settings) {
            if (!(setting.id in blockSettings)) {
              blockSettings[setting.id] = getDefaultValue(setting);
            }
          }
        }

        return {
          id: `block-${index}`,
          type: block.type,
          settings: blockSettings,
          shopify_attributes: `data-shopify-editor-block='{"id":"block-${index}","type":"${block.type}"}'`,
        };
      });
    }
  }

  // Otherwise generate sample blocks from block types
  return blockTypes.slice(0, 3).map((blockType, index) => {
    const blockSettings: Record<string, unknown> = {};

    if (blockType.settings) {
      for (const setting of blockType.settings) {
        blockSettings[setting.id] = getDefaultValue(setting);
      }
    }

    return {
      id: `block-${index}`,
      type: blockType.type,
      settings: blockSettings,
      shopify_attributes: `data-shopify-editor-block='{"id":"block-${index}","type":"${blockType.type}"}'`,
    };
  });
}

// Generate theme settings from preset
function generateThemeSettings(preset?: {
  colors?: PresetColors;
  typography?: PresetTypography;
}): MockThemeSettings {
  const defaults: MockThemeSettings = {
    // Colors
    color_primary: '#2563eb',
    color_secondary: '#64748b',
    color_accent: '#f59e0b',
    color_background: '#ffffff',
    color_background_secondary: '#f8fafc',
    color_text: '#1e293b',
    color_text_secondary: '#64748b',

    // Typography
    typography_heading_font: 'Inter',
    typography_body_font: 'Inter',
    typography_heading_scale: 100,
    typography_body_scale: 100,

    // Buttons
    button_border_radius: 8,
    button_padding_vertical: 12,
    button_padding_horizontal: 24,

    // Layout
    page_width: 1200,
    spacing_sections: 48,

    // Social
    social_twitter_link: '',
    social_facebook_link: '',
    social_instagram_link: '',
  };

  if (preset?.colors) {
    defaults.color_primary = preset.colors.primary;
    defaults.color_secondary = preset.colors.secondary;
    defaults.color_accent = preset.colors.accent;
    defaults.color_background = preset.colors.background;
    defaults.color_background_secondary = preset.colors.background_secondary;
    defaults.color_text = preset.colors.text;
    defaults.color_text_secondary = preset.colors.text_secondary;
  }

  if (preset?.typography) {
    defaults.typography_heading_font = preset.typography.heading_font;
    defaults.typography_body_font = preset.typography.body_font;
    defaults.typography_heading_scale = preset.typography.heading_scale;
    defaults.typography_body_scale = preset.typography.body_scale;
  }

  return defaults;
}

// Generate mock entities based on section category
function generateMockEntities(category: string): Partial<RenderContext> {
  const result: Partial<RenderContext> = {};

  switch (category) {
    case 'product':
    case 'main-product':
      result.product = generateMockProduct(0);
      break;

    case 'collection':
    case 'main-collection':
      result.collection = generateMockCollection(0);
      break;

    case 'featured-collection':
    case 'collection-list':
      result.collections = Array.from({ length: 4 }, (_, i) => generateMockCollection(i));
      result.collection = result.collections[0];
      break;

    case 'hero':
    case 'slideshow':
    case 'image-banner':
      // Hero sections typically don't need special entities
      break;

    default:
      // Provide a default product and collection for flexibility
      result.product = generateMockProduct(0);
      result.collection = generateMockCollection(0);
      break;
  }

  return result;
}

// Main function to generate full render context from section schema
export function generateMockDataFromSchema(
  sectionSchema: SectionData,
  preset?: {
    colors?: PresetColors;
    typography?: PresetTypography;
  }
): RenderContext {
  const shopData = generateMockShop();
  const sectionSettings = extractSettingsDefaults(sectionSchema.settings);
  const blocks = generateMockBlocks(sectionSchema.blocks, sectionSchema.presets);
  const themeSettings = generateThemeSettings(preset);
  const mockEntities = generateMockEntities(sectionSchema.category);

  return {
    // Global shop data
    shop: shopData.shop,
    request: shopData.request,
    template: shopData.template,
    cart: shopData.cart,
    customer: shopData.customer,
    canonical_url: shopData.canonical_url,
    page_title: shopData.page_title,
    page_description: shopData.page_description,

    // Theme settings
    settings: themeSettings,

    // Section context
    section: {
      id: sectionSchema.slug,
      settings: sectionSettings,
      blocks,
    },

    // Mock entities based on category
    ...mockEntities,

    // Navigation
    linklists: {
      'main-menu': {
        handle: 'main-menu',
        title: 'Main Menu',
        levels: 2,
        links: [
          { active: false, child_active: false, current: false, child_current: false, handle: 'home', levels: 0, links: [], object: null, title: 'Home', type: 'http', url: '/' },
          { active: false, child_active: false, current: false, child_current: false, handle: 'catalog', levels: 0, links: [], object: null, title: 'Catalog', type: 'collection', url: '/collections/all' },
          { active: false, child_active: false, current: false, child_current: false, handle: 'about', levels: 0, links: [], object: null, title: 'About', type: 'page', url: '/pages/about' },
          { active: false, child_active: false, current: false, child_current: false, handle: 'contact', levels: 0, links: [], object: null, title: 'Contact', type: 'page', url: '/pages/contact' },
        ],
      },
      'footer-menu': {
        handle: 'footer-menu',
        title: 'Footer Menu',
        levels: 1,
        links: [
          { active: false, child_active: false, current: false, child_current: false, handle: 'search', levels: 0, links: [], object: null, title: 'Search', type: 'http', url: '/search' },
          { active: false, child_active: false, current: false, child_current: false, handle: 'about', levels: 0, links: [], object: null, title: 'About Us', type: 'page', url: '/pages/about' },
          { active: false, child_active: false, current: false, child_current: false, handle: 'contact', levels: 0, links: [], object: null, title: 'Contact', type: 'page', url: '/pages/contact' },
        ],
      },
    },

    // Routes
    routes: {
      root_url: '/',
      account_url: '/account',
      account_login_url: '/account/login',
      account_logout_url: '/account/logout',
      account_register_url: '/account/register',
      account_addresses_url: '/account/addresses',
      collections_url: '/collections',
      all_products_collection_url: '/collections/all',
      search_url: '/search',
      cart_url: '/cart',
    },

    // Content placeholders
    content_for_header: '<!-- header content -->',
    content_for_layout: '<!-- main content -->',
  };
}

// Export individual generators for flexibility
export {
  generateMockProduct,
  generateMockCollection,
  generateMockImage,
  generateMockShop,
  generateThemeSettings,
};
