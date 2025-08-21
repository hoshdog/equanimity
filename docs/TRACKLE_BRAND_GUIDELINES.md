# Trackle Brand Guidelines

## Brand Identity

**Name**: Trackle (Tackle + Track)  
**Tagline**: "Tackle work. Track everything. Simplify success."  
**Positioning**: Modern business management platform for Australian field service companies

## Logo Assets

- **Primary Logo**: `assets/trackle_logo.png`
- **Compressed Logo**: `assets/trackle_logo_compressed.png`
- **Usage**: Logo should maintain clear space of 2x the height of the logo on all sides

## Color Palette

### Primary Colors
- **Electric Blue**: `#0EA5E9` (HSL: 200, 98%, 45%)
  - Usage: Primary CTAs, links, brand accents
  - CSS Variable: `--primary`
  
- **Modern Teal**: `#14B8A6` (HSL: 160, 84%, 39%)
  - Usage: Secondary actions, success states
  - CSS Variable: `--secondary`

### Accent Colors
- **Soft Coral**: `#FF6B6B` (HSL: 0, 79%, 63%)
  - Usage: Alerts, highlights, warm accents
  - CSS Variable: `--accent`
  
- **Neon Lime**: `#84CC16` (HSL: 84, 81%, 44%)
  - Usage: Success indicators, charts
  - CSS Variable: `--chart-4`

### Neutral Colors
- **Soft Charcoal**: `#475569` (HSL: 215, 20%, 33%)
  - Usage: Body text, secondary text
  - CSS Variable: `--foreground`
  
- **White Smoke**: `#F8FAFC` (HSL: 220, 13%, 97%)
  - Usage: Light backgrounds, cards
  - CSS Variable: `--background`

## Typography

### Font Families
1. **Logo Font**: Poppins (weights: 400, 500, 600, 700)
   - Usage: Brand name, logo text
   - Tailwind class: `font-logo`

2. **Heading Font**: Nunito (weights: 400, 500, 600, 700)
   - Usage: Page titles, section headers
   - Tailwind class: `font-heading`

3. **Body Font**: Inter (weights: 400, 500, 600)
   - Usage: Body text, UI elements
   - Tailwind class: `font-sans` (default)

### Typography Scale
- **Hero**: 48px+ (font-heading)
- **H1**: 36px (font-heading)
- **H2**: 30px (font-heading)
- **H3**: 24px (font-heading)
- **Body Large**: 18px (font-sans)
- **Body**: 16px (font-sans)
- **Small**: 14px (font-sans)
- **Caption**: 12px (font-sans)

## Brand Voice & Tone

### Personality
- **Professional yet approachable**
- **Confident and reliable**
- **Clear and direct**
- **Supportive and empowering**

### Language Guidelines
- Use active voice
- Keep sentences concise
- Avoid jargon unless necessary
- Focus on benefits, not just features
- Use "you" to address users directly

### Key Messages
- "Simplify your business operations"
- "Take control of your projects"
- "Work smarter, not harder"
- "Everything you need in one place"

## UI Design Principles

### Visual Hierarchy
1. Use Electric Blue (#0EA5E9) for primary actions
2. Use Modern Teal (#14B8A6) for secondary actions
3. Use Soft Coral (#FF6B6B) sparingly for alerts/warnings
4. Maintain high contrast ratios (4.5:1 minimum)

### Component Guidelines
- **Buttons**: Rounded corners (8px), clear hierarchy
- **Cards**: Subtle shadows, white/light backgrounds
- **Forms**: Clear labels, helpful validation messages
- **Navigation**: Consistent iconography, clear active states

### Spacing
- Use 8px base unit for consistent spacing
- Generous whitespace for breathing room
- Consistent margins and padding

## Implementation Notes

### CSS Variables (Applied)
All brand colors are implemented as CSS custom properties in `src/app/globals.css`:
```css
--primary: 200 98% 45%; /* Electric Blue */
--secondary: 160 84% 39%; /* Modern Teal */
--accent: 0 79% 63%; /* Soft Coral */
```

### Font Loading (Applied)
Fonts are loaded via Google Fonts in layout.tsx:
```typescript
const poppins = Poppins({ weight: ['400', '500', '600', '700'] });
const nunito = Nunito({ weight: ['400', '500', '600', '700'] });
const inter = Inter({ weight: ['400', '500', '600'] });
```

### Tailwind Classes (Available)
- `font-logo` - Poppins for brand elements
- `font-heading` - Nunito for headings
- `font-sans` - Inter for body text (default)

## Brand Applications

### Digital Applications
- Website headers and navigation
- App interface elements
- Email signatures
- Social media profiles

### Marketing Materials
- Business cards using Electric Blue accents
- Presentations with Trackle color palette
- Documentation with consistent typography

## Accessibility

### Color Contrast
- All text meets WCAG AA standards (4.5:1 ratio minimum)
- Electric Blue provides excellent contrast on white backgrounds
- Alternative color options provided for colorblind users

### Typography
- Minimum 16px for body text
- Clear hierarchy with sufficient size differences
- High readability with Inter font family

## File Structure

```
assets/
├── trackle_logo.png (Primary logo)
└── trackle_logo_compressed.png (Optimized version)

src/app/
├── globals.css (Brand colors and fonts)
└── layout.tsx (Font loading and metadata)

docs/
└── TRACKLE_BRAND_GUIDELINES.md (This file)
```

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: ✅ Implemented