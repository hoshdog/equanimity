# Trackle Design Tokens Documentation

## Overview
This document provides a comprehensive reference for all design tokens available in the Trackle design system. These tokens ensure consistency across the entire application and provide a scalable foundation for UI development.

## Color Tokens

### Primary Brand Colors
```css
/* Electric Blue - Primary brand color */
--primary: 200 98% 45%; /* #0EA5E9 */
--primary-foreground: 0 0% 100%; /* White text on blue */

/* Modern Teal - Secondary brand color */
--secondary: 160 84% 39%; /* #14B8A6 */
--secondary-foreground: 0 0% 100%; /* White text on teal */

/* Soft Coral - Accent color */
--accent: 0 79% 63%; /* #FF6B6B */
--accent-foreground: 0 0% 100%; /* White text on coral */

/* Neon Lime - Chart/success color */
--chart-4: 84 81% 44%; /* #84CC16 */
```

### Neutral Colors
```css
/* Backgrounds */
--background: 220 13% 97%; /* #F8FAFC - White Smoke */
--card: 0 0% 100%; /* Pure White */
--muted: 215 16% 47%; /* Mid-tone gray */

/* Text Colors */
--foreground: 215 20% 33%; /* #475569 - Soft Charcoal */
--muted-foreground: 215 13% 65%; /* Light gray text */

/* Borders and Inputs */
--border: 215 14% 89%; /* Light border */
--input: 215 14% 89%; /* Input background */
--ring: 200 98% 45%; /* Focus ring (Electric Blue) */
```

### Dark Mode Colors
All colors have dark mode variants that automatically apply when the `dark` class is present:

```css
.dark {
  --background: 215 28% 11%; /* Dark charcoal */
  --foreground: 220 13% 97%; /* White smoke */
  --card: 215 25% 15%; /* Dark card background */
  /* ... other dark mode variants */
}
```

### Tailwind Color Aliases
```css
/* Convenient aliases for brand colors */
trackle-blue: hsl(var(--primary))
trackle-teal: hsl(var(--secondary))
trackle-coral: hsl(var(--accent))
trackle-lime: hsl(var(--chart-4))
trackle-charcoal: hsl(var(--foreground))
trackle-smoke: hsl(var(--background))
```

## Typography Tokens

### Font Families
```typescript
// Font loading in layout.tsx
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const poppins = Poppins({ 
  subsets: ['latin'], 
  variable: '--font-logo',
  weight: ['400', '500', '600', '700']
});
const nunito = Nunito({ 
  subsets: ['latin'], 
  variable: '--font-heading',
  weight: ['400', '500', '600', '700']
});
```

### Tailwind Font Classes
```css
font-sans: Inter (default body text)
font-logo: Poppins (brand elements)
font-heading: Nunito (headings and titles)
```

### Typography Scale
```css
/* Trackle-specific text sizes with optimal line heights */
text-trackle-hero: 3rem / 1.1 / 700 weight
text-trackle-h1: 2.25rem / 1.2 / 600 weight
text-trackle-h2: 1.875rem / 1.3 / 600 weight
text-trackle-h3: 1.5rem / 1.4 / 500 weight
text-trackle-body-lg: 1.125rem / 1.6
text-trackle-body: 1rem / 1.5 (default)
text-trackle-small: 0.875rem / 1.4
text-trackle-caption: 0.75rem / 1.3
```

## Spacing Tokens

### 8px Base Unit System
All spacing follows an 8px base unit for consistent rhythm:

```css
/* Margin and padding utilities */
trackle-xs: 0.25rem (4px)
trackle-sm: 0.5rem (8px)
trackle-md: 1rem (16px)
trackle-lg: 1.5rem (24px)
trackle-xl: 2rem (32px)
trackle-2xl: 3rem (48px)
trackle-3xl: 4rem (64px)
trackle-4xl: 6rem (96px)
trackle-5xl: 8rem (128px)
```

### Usage Examples
```html
<!-- Consistent spacing -->
<div class="p-trackle-md"> <!-- 16px padding -->
<div class="mb-trackle-lg"> <!-- 24px margin bottom -->
<div class="gap-trackle-sm"> <!-- 8px gap in flexbox/grid -->
```

## Component Tokens

### Pre-built Component Classes
```css
/* Card Variants */
.card-trackle: Basic card with border and shadow
.card-trackle-hover: Interactive card with hover effects
.card-trackle-dark: Dark mode optimized card with backdrop blur

/* Button Variants */
.button-trackle-primary: Electric blue primary button
.button-trackle-secondary: Modern teal secondary button
.button-trackle-ghost: Transparent button with hover effects

/* Typography Utilities */
.text-trackle-hero: Large hero text with brand font
.text-trackle-h1: H1 styling with proper hierarchy
.text-gradient-trackle: Brand gradient text effect
```

## Animation Tokens

### Keyframe Animations
```css
/* Available animations */
animate-trackle-fade-in: Gentle fade in from bottom (0.3s)
animate-trackle-slide-up: Slide up with fade (0.4s)
animate-trackle-bounce-in: Bounce scale effect (0.5s)
animate-trackle-pulse: Gentle pulsing effect (2s infinite)
```

### Easing and Timing
```css
/* Consistent timing functions */
ease-out: Used for entrances and micro-interactions
ease-in-out: Used for state transitions
duration-200: Quick feedback (0.2s)
duration-300: Standard transitions (0.3s)
duration-500: Emphasized animations (0.5s)
```

## Gradient Tokens

### Brand Gradients
```css
/* Primary brand gradient */
.bg-gradient-trackle-primary {
  background: linear-gradient(135deg, 
    hsl(var(--primary)) 0%, 
    hsl(var(--secondary)) 100%
  );
}

/* Warm accent gradient */
.bg-gradient-trackle-warm {
  background: linear-gradient(135deg, 
    hsl(var(--accent)) 0%, 
    hsl(var(--chart-4)) 100%
  );
}

/* Text gradient */
.text-gradient-trackle {
  background: linear-gradient(135deg, 
    hsl(var(--primary)) 0%, 
    hsl(var(--secondary)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

## Accessibility Tokens

### Focus States
```css
.focus-trackle: Consistent focus ring using brand colors
  focus:outline-none 
  focus:ring-2 
  focus:ring-primary 
  focus:ring-offset-2
```

### High Contrast Support
```css
.high-contrast: Increases contrast by 20% for accessibility
  filter: contrast(1.2)

.sr-only-trackle: Screen reader only content
  @apply sr-only
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  /* All trackle animations are disabled */
  .animate-trackle-fade-in,
  .animate-trackle-slide-up,
  .animate-trackle-bounce-in {
    animation: none !important;
  }
}
```

## Usage Guidelines

### Color Usage Hierarchy
1. **Electric Blue** (`trackle-blue`) - Primary CTAs, links, active states
2. **Modern Teal** (`trackle-teal`) - Secondary actions, success states
3. **Soft Coral** (`trackle-coral`) - Warnings, alerts, delete actions
4. **Neon Lime** (`trackle-lime`) - Success indicators, positive metrics
5. **Soft Charcoal** (`trackle-charcoal`) - Body text, secondary content
6. **White Smoke** (`trackle-smoke`) - Backgrounds, subtle containers

### Typography Usage
1. **Hero text** - Landing pages, major section headers
2. **H1-H3** - Page titles, section headers, card titles
3. **Body Large** - Important descriptions, lead paragraphs
4. **Body** - Default text, form labels, general content
5. **Small** - Secondary information, metadata
6. **Caption** - Fine print, timestamps, helper text

### Spacing Consistency
- Use `trackle-sm` (8px) for tight spacing within components
- Use `trackle-md` (16px) for standard component padding
- Use `trackle-lg` (24px) for section spacing
- Use `trackle-xl` (32px) and above for page-level spacing

### Animation Best Practices
- Use `fade-in` for content that appears
- Use `slide-up` for modals and overlays
- Use `bounce-in` for success states and celebrations
- Use `pulse` for loading states and attention-grabbing elements

## Implementation Examples

### Basic Component
```tsx
function TrackleCard({ children, className }: CardProps) {
  return (
    <div className={cn(
      "card-trackle animate-trackle-fade-in", 
      className
    )}>
      {children}
    </div>
  );
}
```

### Typography Component
```tsx
function TrackleHeading({ level = 1, children }: HeadingProps) {
  const classes = {
    1: "text-trackle-h1",
    2: "text-trackle-h2", 
    3: "text-trackle-h3"
  };
  
  return (
    <h1 className={classes[level]}>
      {children}
    </h1>
  );
}
```

### Button Component
```tsx
function TrackleButton({ variant = "primary", children }: ButtonProps) {
  const variants = {
    primary: "button-trackle-primary",
    secondary: "button-trackle-secondary",
    ghost: "button-trackle-ghost"
  };
  
  return (
    <button className={cn(
      variants[variant],
      "focus-trackle animate-trackle-fade-in"
    )}>
      {children}
    </button>
  );
}
```

## Maintenance Notes

### Adding New Tokens
1. Add CSS custom properties to `globals.css`
2. Update Tailwind config with new utilities
3. Document the token in this file
4. Test in both light and dark modes
5. Verify accessibility compliance

### Token Naming Convention
- Prefix all custom tokens with `trackle-`
- Use semantic names (e.g., `trackle-blue` not `trackle-color-1`)
- Follow existing patterns for consistency
- Include size modifiers when needed (`sm`, `md`, `lg`, etc.)

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintained By**: Trackle Design System Team