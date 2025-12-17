# Advanced Modern CSS Standards

## 1. Scoping & Encapsulation

### `@scope` Over BEM
Use the native `@scope` at-rule for component isolation.
```css
@scope (.card) to (.card__slot) {
  :scope {
    /* styles for .card itself */
  }
  .title {
    /* scoped to .card, won't leak into .card__slot */
  }
}
```

Avoid global leakage; never use deep descendant selectors without a scope boundary.

### Native CSS Nesting
Use native nesting for component organization. Limit nesting depth to 3 levels maximum to maintain readability.
```css
.component {
  color: var(--text-primary);
  
  & .header {
    font-weight: 600;
    
    &:hover {
      color: var(--text-accent);
    }
  }
  
  @media (width >= 48rem) {
    padding-block: 2rem;
  }
}
```

### Namespacing
Prefix all custom utility classes with a project namespace (e.g., `prj-`) to prevent collisions with third-party libraries.

---

## 2. Custom Properties Architecture

### Naming Convention
Use a three-tier naming system:
```css
:root {
  /* Tier 1: Primitives (raw values, rarely referenced directly) */
  --color-blue-500: oklch(55% 0.2 250);
  --spacing-4: 1rem;
  
  /* Tier 2: Semantic tokens (purpose-driven aliases) */
  --color-primary: var(--color-blue-500);
  --spacing-component-gap: var(--spacing-4);
  
  /* Tier 3: Component-scoped (local overrides) */
  --card-padding: var(--spacing-component-gap);
}
```

### Scoped Custom Properties
Define component-specific properties at the component level, not globally.
```css
.button {
  --_bg: var(--button-bg, var(--color-primary));
  --_text: var(--button-text, var(--color-on-primary));
  
  background: var(--_bg);
  color: var(--_text);
}
```

Use the `--_` prefix for private/internal component properties.

### Fallback Strategy
Always provide fallbacks for custom properties that may be undefined.
```css
color: var(--theme-text, var(--color-neutral-900, #1a1a1a));
```

---

## 3. Layout & Responsiveness

### Container Queries (Primary Rule)
Use `@container` for all component-level responsiveness. Media queries (`@media`) should only be used for global page layouts.
```css
.card {
  container: card / inline-size;
}

@container card (width >= 30rem) {
  .card__content {
    grid-template-columns: 1fr 2fr;
  }
}
```

Components must define their own `container-type: inline-size`.

### Style Queries
Use container style queries for conditional styling based on custom property values.
```css
@container style(--variant: compact) {
  .card {
    padding: var(--spacing-2);
  }
}
```

### Grid & Subgrid
Use `display: grid` for 2D layouts and macro-structures. Use subgrid to inherit track sizing from parent grids.
```css
.grid-parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-4);
}

.grid-child {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 3;
}
```

### Flexbox
Use `display: flex` for 1D alignment and micro-structures. Use `gap` exclusively; do not use `margin` for spacing between sibling elements.

### Modern Media Query Syntax
Use range syntax for media queries.
```css
/* Preferred */
@media (width >= 48rem) { }
@media (48rem <= width <= 64rem) { }

/* Avoid */
@media (min-width: 48rem) { }
```

---

## 4. Fluid Typography & Scaling

### CSS Functions
Use `clamp()`, `min()`, and `max()` for all fluid sizing.
```css
font-size: clamp(1rem, 0.8rem + 1vw, 2rem);
padding: clamp(1rem, 5cqi, 3rem); /* container query units */
```

### Unit Guidelines
- `rem` for typography and global spacing
- `em` for component-relative spacing (e.g., button padding relative to its font-size)
- `cqi`/`cqb` for container-relative sizing within components
- `dvh`/`svh`/`lvh` for viewport heights (prefer `dvh` for mobile-friendly layouts)
- Avoid `px` except for borders and box-shadows where sub-pixel rendering causes issues

### Fluid Spacing Scale
Define a fluid spacing scale using custom properties.
```css
:root {
  --space-3xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.375rem);
  --space-2xs: clamp(0.5rem, 0.45rem + 0.25vw, 0.625rem);
  --space-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --space-s: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --space-m: clamp(1.5rem, 1.4rem + 0.5vw, 1.75rem);
  --space-l: clamp(2rem, 1.85rem + 0.75vw, 2.5rem);
  --space-xl: clamp(3rem, 2.75rem + 1.25vw, 4rem);
}
```

---

## 5. Modern Color

### Color Spaces
Use `oklch` or `oklab` for perceptually uniform color manipulation.
```css
:root {
  --color-primary: oklch(55% 0.2 250);
  --color-primary-light: oklch(from var(--color-primary) calc(l + 0.2) c h);
  --color-primary-dark: oklch(from var(--color-primary) calc(l - 0.2) c h);
}
```

### Relative Color Syntax
Use relative color syntax for dynamic color variations.
```css
.button:hover {
  background: oklch(from var(--button-bg) calc(l - 0.1) c h);
}
```

### Color Mixing
Use `color-mix()` for blending colors.
```css
--color-overlay: color-mix(in oklch, var(--color-primary) 60%, transparent);
```

### Dark Mode
Use `light-dark()` for theme-aware values. Set `color-scheme` on the root.
```css
:root {
  color-scheme: light dark;
  
  --surface-primary: light-dark(#ffffff, #1a1a1a);
  --text-primary: light-dark(#1a1a1a, #f5f5f5);
}
```

For complex theming, use class-based switching with custom property overrides.

---

## 6. Modern Selectors

### Specificity Management
Use `:where()` to eliminate specificity. Use `:is()` when specificity should match the highest selector.
```css
/* Zero specificity - easily overridable */
:where(.btn, .link, .tag) {
  text-decoration: none;
}

/* Specificity matches highest selector */
:is(h1, h2, h3):first-child {
  margin-block-start: 0;
}
```

### Relational Selector `:has()`
Use `:has()` for parent/sibling selection.
```css
/* Style parent based on child state */
.form-field:has(:user-invalid) {
  --field-border: var(--color-error);
}

/* Style based on sibling */
.label:has(+ input:required)::after {
  content: " *";
  color: var(--color-error);
}
```

### Form Validation Selectors
Prefer `:user-valid` and `:user-invalid` over `:valid` and `:invalid` to only show validation state after user interaction.
```css
input:user-invalid {
  border-color: var(--color-error);
}

input:user-valid {
  border-color: var(--color-success);
}
```

---

## 7. Logical Properties

Use logical properties exclusively to ensure RTL support by default.

| Physical | Logical |
|----------|---------|
| `left/right` | `inline-start/inline-end` |
| `top/bottom` | `block-start/block-end` |
| `width/height` | `inline-size/block-size` |
| `margin-left` | `margin-inline-start` |
| `padding-top` | `padding-block-start` |
| `border-radius: 4px 0 0 4px` | `border-start-start-radius: 4px; border-end-start-radius: 4px` |
```css
.sidebar {
  inset-inline-start: 0;
  padding-inline: var(--space-m);
  margin-block-end: var(--space-l);
  inline-size: 20rem;
}
```

---

## 8. Animation & Motion

### Scroll-Driven Animations
Use `animation-timeline` for scroll-linked animations.
```css
@keyframes fade-in {
  from { opacity: 0; translate: 0 2rem; }
  to { opacity: 1; translate: 0 0; }
}

.reveal {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
```

### View Transitions
Use the View Transitions API for page and state transitions.
```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 300ms;
}

.card {
  view-transition-name: card;
}
```

### Discrete Property Transitions
Use `transition-behavior: allow-discrete` for transitioning display and overlay.
```css
.modal {
  transition: 
    opacity 300ms,
    display 300ms allow-discrete,
    overlay 300ms allow-discrete;
    
  @starting-style {
    opacity: 0;
  }
}
```

### `@starting-style`
Define initial animation states for elements entering the DOM.
```css
.toast {
  opacity: 1;
  translate: 0;
  transition: opacity 300ms, translate 300ms;
  
  @starting-style {
    opacity: 0;
    translate: 0 1rem;
  }
}
```

### Reduced Motion
Always respect user motion preferences.
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 9. Scroll Behavior

### Scroll Snapping
Use scroll snap for carousels and paginated content.
```css
.carousel {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
}

.carousel__slide {
  scroll-snap-align: start;
  scroll-snap-stop: always; /* prevent skipping */
}
```

### Scroll Margins
Account for fixed headers with `scroll-margin` or `scroll-padding`.
```css
:target {
  scroll-margin-block-start: 5rem;
}

html {
  scroll-padding-block-start: var(--header-height);
}
```

---

## 10. Text & Typography

### Text Wrapping
Use `text-wrap` for improved typography.
```css
h1, h2, h3, h4 {
  text-wrap: balance; /* even line lengths */
}

p {
  text-wrap: pretty; /* avoids orphans */
}
```

### Hyphenation
Enable hyphenation for justified or narrow text columns.
```css
.prose {
  hyphens: auto;
  hyphenate-limit-chars: 6 3 3;
  hyphenate-limit-lines: 2;
}
```

### Font Display
Always define `font-display` in `@font-face` rules.
```css
@font-face {
  font-family: "Custom";
  src: url("custom.woff2") format("woff2");
  font-display: swap;
  font-weight: 100 900; /* variable font range */
}
```

---

## 11. Cascade Management (`@layer`)

All CSS must reside within a defined `@layer` to prevent specificity conflicts.
```css
@layer reset, base, components, utilities;

@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
  }
}

@layer base {
  :root {
    /* custom properties */
  }
  
  body {
    font-family: var(--font-body);
    line-height: 1.6;
  }
}

@layer components {
  /* UI components */
}

@layer utilities {
  /* Override helpers */
  .visually-hidden {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    block-size: 1px;
    inline-size: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
  }
}
```

Third-party CSS should be imported into a lower-priority layer.
```css
@layer vendor, reset, base, components, utilities;

@import url("third-party.css") layer(vendor);
```

---

## 12. Performance

### Containment
Use `contain` to isolate rendering.
```css
.card {
  contain: layout style; /* or contain: content */
}
```

### Content Visibility
Use `content-visibility` for off-screen content.
```css
.below-fold-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
```

### `will-change` Guidelines
Only apply `will-change` immediately before animation, then remove it.
```css
/* Apply via JavaScript just before animation */
.animating {
  will-change: transform, opacity;
}

/* Never in static CSS */
/* ❌ .card { will-change: transform; } */
```

---

## 13. Accessibility

### Focus Styles
Use `:focus-visible` for keyboard-only focus indicators.
```css
:focus {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

### Forced Colors Mode
Support Windows High Contrast mode.
```css
@media (forced-colors: active) {
  .button {
    border: 2px solid currentColor;
  }
  
  .icon {
    forced-color-adjust: none; /* preserve icon colors if needed */
  }
}
```

### Touch Targets
Ensure minimum touch target sizes.
```css
.interactive {
  min-block-size: 44px;
  min-inline-size: 44px;
}
```

### Visibility Utilities
Provide accessible hiding options.
```css
/* Hidden from all */
.hidden {
  display: none;
}

/* Visually hidden, accessible to screen readers */
.visually-hidden {
  position: absolute;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  block-size: 1px;
  inline-size: 1px;
  overflow: hidden;
  white-space: nowrap;
}

/* Hidden from screen readers only */
.decorative {
  aria-hidden: true; /* set in HTML, not CSS */
}
```

---

## 14. Anchor Positioning

Use CSS anchor positioning for tooltips, popovers, and overlays.
```css
.trigger {
  anchor-name: --my-anchor;
}

.popover {
  position: fixed;
  position-anchor: --my-anchor;
  inset-area: block-end;
  position-try-fallbacks: flip-block, flip-inline;
  margin-block-start: 0.5rem;
}
```

---

## 15. Aspect Ratio

Use `aspect-ratio` for intrinsic sizing.
```css
.video-embed {
  aspect-ratio: 16 / 9;
  inline-size: 100%;
  block-size: auto;
}

.avatar {
  aspect-ratio: 1;
  border-radius: 50%;
}
```

---

## 16. Print Styles

Include print considerations.
```css
@media print {
  *,
  *::before,
  *::after {
    background: transparent !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  
  a[href]::after {
    content: " (" attr(href) ")";
  }
  
  .no-print {
    display: none;
  }
  
  .page-break-before {
    break-before: page;
  }
}
```

---

## Checklist Summary

Before shipping CSS, verify:

- [ ] All styles are within `@layer` declarations
- [ ] Component responsiveness uses `@container`, not `@media`
- [ ] Logical properties are used instead of physical
- [ ] Colors are defined in `oklch` or `oklab`
- [ ] Spacing uses the fluid scale with `clamp()`
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Focus states use `:focus-visible`
- [ ] Custom properties follow the three-tier naming convention
- [ ] No `px` units except for borders/shadows
- [ ] `:has()`, `:is()`, `:where()` are used appropriately for specificity
- [ ] `gap` is used instead of margins for sibling spacing
- [ ] Subgrid is used where nested grid alignment is needed