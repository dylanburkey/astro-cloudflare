// Mock data types for Liquid rendering

export interface MockShopData {
  shop: {
    name: string;
    description: string;
    email: string;
    url: string;
    currency: { iso_code: string };
    money_format: string;
    enabled_payment_types: string[];
  };
  request: {
    locale: { iso_code: string; name: string };
    host: string;
    path: string;
  };
  template: {
    name: string;
    suffix: string | null;
  };
  cart: {
    currency: { iso_code: string };
    item_count: number;
    items: MockCartItem[];
    total_price: number;
    original_total_price: number;
  };
  customer: MockCustomer | null;
  canonical_url: string;
  page_title: string;
  page_description: string;
}

export interface MockProductData {
  id: number;
  title: string;
  handle: string;
  description: string;
  price: number;
  price_min: number;
  price_max: number;
  compare_at_price: number | null;
  compare_at_price_min: number | null;
  compare_at_price_max: number | null;
  featured_image: MockImageData;
  featured_media: MockMediaData;
  images: MockImageData[];
  media: MockMediaData[];
  variants: MockVariantData[];
  options: MockOptionData[];
  options_with_values: MockOptionWithValues[];
  vendor: string;
  type: string;
  tags: string[];
  available: boolean;
  selected_variant: MockVariantData | null;
  selected_or_first_available_variant: MockVariantData;
  first_available_variant: MockVariantData;
  has_only_default_variant: boolean;
  requires_selling_plan: boolean;
  selling_plan_groups: unknown[];
  url: string;
  collections: MockCollectionData[];
}

export interface MockVariantData {
  id: number;
  title: string;
  sku: string;
  barcode: string;
  price: number;
  compare_at_price: number | null;
  available: boolean;
  inventory_quantity: number;
  inventory_policy: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  image: MockImageData | null;
  featured_image: MockImageData | null;
  url: string;
  weight: number;
  weight_unit: string;
}

export interface MockOptionData {
  name: string;
  position: number;
  values: string[];
}

export interface MockOptionWithValues {
  name: string;
  position: number;
  values: { value: string; available: boolean }[];
  selected_value: string;
}

export interface MockCollectionData {
  id: number;
  title: string;
  handle: string;
  description: string;
  image: MockImageData | null;
  products: MockProductData[];
  products_count: number;
  all_products_count: number;
  all_tags: string[];
  all_types: string[];
  all_vendors: string[];
  url: string;
  current_type: string | null;
  current_vendor: string | null;
  sort_by: string;
  sort_options: { name: string; value: string }[];
}

export interface MockImageData {
  id: number;
  src: string;
  alt: string;
  width: number;
  height: number;
  aspect_ratio: number;
  attached_to_variant?: boolean;
  position?: number;
}

export interface MockMediaData {
  id: number;
  media_type: 'image' | 'video' | 'external_video' | 'model';
  preview_image: MockImageData;
  alt: string;
  position: number;
}

export interface MockCartItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  product: MockProductData;
  variant: MockVariantData;
  quantity: number;
  price: number;
  line_price: number;
  original_price: number;
  original_line_price: number;
  discounted_price: number;
  final_price: number;
  final_line_price: number;
  image: MockImageData | null;
  url: string;
  properties: Record<string, string>;
}

export interface MockCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  orders_count: number;
  total_spent: number;
  tags: string[];
  addresses: MockAddressData[];
  default_address: MockAddressData | null;
}

export interface MockAddressData {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  province_code: string;
  country: string;
  country_code: string;
  zip: string;
  phone: string | null;
}

export interface MockArticleData {
  id: number;
  title: string;
  handle: string;
  author: string;
  content: string;
  excerpt: string;
  excerpt_or_content: string;
  image: MockImageData | null;
  published_at: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  url: string;
  user: { first_name: string; last_name: string };
  comments: MockCommentData[];
  comments_count: number;
  comment_post_url: string;
  comments_enabled: boolean;
}

export interface MockCommentData {
  id: number;
  author: string;
  email: string;
  content: string;
  created_at: string;
  status: string;
}

export interface MockBlogData {
  id: number;
  title: string;
  handle: string;
  url: string;
  articles: MockArticleData[];
  articles_count: number;
  all_tags: string[];
  comments_enabled: boolean;
}

export interface MockPageData {
  id: number;
  title: string;
  handle: string;
  content: string;
  author: string;
  url: string;
  template_suffix: string | null;
}

export interface MockMenuData {
  handle: string;
  title: string;
  levels: number;
  links: MockLinkData[];
}

export interface MockLinkData {
  active: boolean;
  child_active: boolean;
  current: boolean;
  child_current: boolean;
  handle: string;
  levels: number;
  links: MockLinkData[];
  object: unknown;
  title: string;
  type: string;
  url: string;
}

// Theme settings type
export interface MockThemeSettings {
  [key: string]: string | number | boolean | null;
}

// Section context type
export interface MockSectionContext {
  id: string;
  settings: Record<string, unknown>;
  blocks: MockBlockContext[];
}

export interface MockBlockContext {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  shopify_attributes: string;
}

// Full render context
export interface RenderContext {
  shop: MockShopData['shop'];
  request: MockShopData['request'];
  template: MockShopData['template'];
  cart: MockShopData['cart'];
  customer: MockCustomer | null;
  canonical_url: string;
  page_title: string;
  page_description: string;
  settings: MockThemeSettings;
  section: MockSectionContext;
  product?: MockProductData;
  collection?: MockCollectionData;
  collections?: MockCollectionData[];
  all_products?: MockProductData[];
  article?: MockArticleData;
  blog?: MockBlogData;
  page?: MockPageData;
  linklists?: Record<string, MockMenuData>;
  routes: {
    root_url: string;
    account_url: string;
    account_login_url: string;
    account_logout_url: string;
    account_register_url: string;
    account_addresses_url: string;
    collections_url: string;
    all_products_collection_url: string;
    search_url: string;
    cart_url: string;
  };
  content_for_header: string;
  content_for_layout: string;
}
