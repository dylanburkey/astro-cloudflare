# Shopify Development Framework

## Core Concept

Write Shopify themes in Astro → Convert to Liquid → Export as complete theme ZIP.

---

## Architecture

```
astro-cloudflare/
├── src/
│   ├── pages/
│   │   ├── index.astro                    # Dashboard
│   │   ├── projects/
│   │   │   ├── index.astro                # All projects
│   │   │   ├── new.astro                  # Create project wizard
│   │   │   └── [project]/
│   │   │       ├── index.astro            # Project overview
│   │   │       ├── sections/              # Manage sections
│   │   │       ├── presets/               # Manage presets
│   │   │       └── export.astro           # Export to ZIP
│   │   └── library/
│   │       ├── index.astro                # Browse all components
│   │       ├── sections/[slug].astro      # Section detail + add to project
│   │       └── blocks/[slug].astro        # Block detail
│   │
│   ├── components/
│   │   ├── astro/                         # Astro preview components
│   │   │   ├── sections/
│   │   │   └── blocks/
│   │   └── ui/                            # Dashboard UI
│   │
│   └── lib/
│       ├── project/
│       │   ├── create.ts                  # Initialize new project
│       │   ├── add-section.ts             # Add section from library
│       │   └── export.ts                  # Export to ZIP
│       ├── liquid/
│       │   ├── astro-to-liquid.ts         # Transpiler
│       │   └── schema-builder.ts          # Generate {% schema %}
│       └── presets/
│           └── apply.ts                   # Apply preset to project
│
├── projects/                              # Generated project themes
│   └── [project-name]/
│       ├── assets/
│       ├── config/
│       │   ├── settings_schema.json
│       │   └── settings_data.json         # Preset values applied here
│       ├── layout/
│       ├── locales/
│       ├── sections/
│       ├── snippets/
│       └── templates/
│
├── library/
│   ├── base-theme/                        # Minimal theme skeleton
│   │   ├── assets/
│   │   ├── config/
│   │   ├── layout/
│   │   ├── locales/
│   │   └── templates/
│   ├── sections/                          # Section library (JSON schemas)
│   ├── blocks/
│   ├── snippets/
│   └── presets/                           # Color + typography presets
│       ├── industrial-red.json
│       ├── corporate-blue.json
│       └── minimal-mono.json
│
└── themes/
    └── forge-industrial/                  # Symlink to full reference theme
```

---

## Workflow

### 1. Create New Project

```
User clicks "New Project"
    ↓
Enter: name, store URL, description
    ↓
System copies library/base-theme/ → projects/[name]/
    ↓
Project appears in dashboard
```

### 2. Apply Preset

```
User selects preset (e.g., "Industrial Red")
    ↓
System reads library/presets/industrial-red.json
    ↓
Updates projects/[name]/config/settings_data.json
    ↓
Colors + typography now set
```

**Preset structure:**
```json
{
  "name": "Industrial Red",
  "colors": {
    "primary": "#d71920",
    "secondary": "#334fb4",
    "background": "#ffffff",
    "text": "#1a1a1a"
  },
  "typography": {
    "heading_font": "oswald_n7",
    "body_font": "roboto_n4",
    "heading_scale": 100,
    "body_scale": 100
  }
}
```

### 3. Add Sections from Library

```
User browses library → clicks "Add to Project"
    ↓
System copies section to projects/[name]/sections/
    ↓
Updates project's template JSON to include section
    ↓
Section now available in project
```

### 4. Customize Section (Create Variant)

```
User modifies section in project
    ↓
Option: "Save as Variant" or "Project Only"
    ↓
If variant: copies to library/sections/[original]-[variant].json
    ↓
Variant now available for other projects
```

### 5. Export Theme

```
User clicks "Export" → chooses format
    ↓
System bundles projects/[name]/ into ZIP
    ↓
Downloads [project-name]-theme.zip
    ↓
Ready to upload to Shopify
```

---

## Base Theme (Minimal Skeleton)

The base theme includes only essential files:

```
library/base-theme/
├── assets/
│   └── base.css                          # CSS variables + minimal styles
├── config/
│   ├── settings_schema.json              # Theme settings (colors, fonts, etc.)
│   └── settings_data.json                # Default values
├── layout/
│   └── theme.liquid                      # Main layout wrapper
├── locales/
│   └── en.default.json                   # English translations
├── snippets/
│   ├── head.liquid                       # <head> content
│   └── css-variables.liquid              # CSS custom properties
└── templates/
    ├── index.json                        # Homepage (empty sections array)
    ├── product.json
    ├── collection.json
    ├── page.json
    ├── cart.json
    ├── 404.json
    └── customers/
        ├── account.json
        ├── login.json
        └── register.json
```

---

## Key Technical Decisions

### Astro → Liquid Conversion

**Option A: Template-based** (Recommended)
- Astro components are paired with `.liquid` templates
- Schema is extracted from component props/frontmatter
- Liquid template is copied to project with schema attached

**Option B: AST Transpilation**
- Parse Astro AST → Generate Liquid
- More complex, higher maintenance
- Better for dynamic generation

### Storage

- **Projects**: File-based in `projects/` directory
- **Library**: JSON schemas in `library/`
- **No database needed** - Git-friendly, portable

### Export Format

- ZIP containing complete theme structure
- Optionally minify CSS/JS
- Include `theme.zip` manifest for Shopify

---

## Implementation Order

### Phase 1: Project Foundation ← START HERE
1. Create base theme skeleton in `library/base-theme/`
2. Build project creation API (`src/lib/project/create.ts`)
3. Build "New Project" page with form
4. Generate project directory from base theme

### Phase 2: Presets
1. Create 3-5 preset JSON files
2. Build preset application logic
3. Add preset selector to project creation + settings

### Phase 3: Library → Project
1. Build "Add to Project" API
2. Copy sections with proper schema
3. Update template JSON files
4. Show added sections in project view

### Phase 4: Variants & Customization
1. Track section modifications
2. Promote to library as variant
3. Link variants to parent sections

### Phase 5: Export
1. Bundle project to ZIP
2. Validate theme structure
3. Add download endpoint

---

## Next Action

Create the base theme skeleton. This is the foundation everything builds on.

Shall I proceed with building `library/base-theme/`?
