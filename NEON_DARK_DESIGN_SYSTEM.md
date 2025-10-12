# Speedy Van Neon Dark Design Language System

## Overview

The Neon Dark Design Language is Speedy Van's premium design system featuring neon accents, dark surfaces, and high-end aesthetics. This system provides a consistent, accessible, and visually striking foundation for all Speedy Van applications.

## Design Principles

- **Dark-First**: Optimized for dark mode with carefully crafted surface hierarchy
- **Neon Accents**: Strategic use of neon blue (#00C2FF) and brand green (#00D18F) for interactive elements
- **Premium Feel**: High-quality shadows, gradients, and micro-interactions
- **Accessibility**: WCAG AA compliant with proper contrast ratios and focus states
- **Mobile-First**: Responsive design optimized for all screen sizes

## Color System

### Core Colors

#### Neon Colors

- `neon.50` - #E6F7FF (Lightest)
- `neon.100` - #B3E5FF
- `neon.200` - #80D4FF
- `neon.300` - #4DC2FF
- `neon.400` - #1AB0FF
- `neon.500` - #00C2FF (Primary neon blue)
- `neon.600` - #0099CC
- `neon.700` - #007099
- `neon.800` - #004766
- `neon.900` - #001E33 (Darkest)

#### Brand Colors

- `brand.50` - #E6FFF7 (Lightest)
- `brand.100` - #B3FFE5
- `brand.200` - #80FFD4
- `brand.300` - #4DFFC2
- `brand.400` - #1AFFB0
- `brand.500` - #00D18F (Speedy Van green)
- `brand.600` - #00B385
- `brand.700` - #009973
- `brand.800` - #007F61
- `brand.900` - #00654F (Darkest)

#### Dark Surface Colors

- `dark.50` - #F8F9FA (Lightest)
- `dark.100` - #E9ECEF
- `dark.200` - #DEE2E6
- `dark.300` - #CED4DA
- `dark.400` - #ADB5BD
- `dark.500` - #6C757D
- `dark.600` - #495057
- `dark.700` - #343A40
- `dark.800` - #212529
- `dark.900` - #0D0D0D (Primary dark background)
- `dark.950` - #000000 (Darkest)

### Semantic Colors

#### Status Colors

- `success.500` - #22C55E (Green)
- `warning.500` - #F59E0B (Yellow)
- `error.500` - #EF4444 (Red)
- `info.500` - #3B82F6 (Blue)

#### Background Tokens

- `bg.canvas` - #0D0D0D (Main background)
- `bg.surface` - #1A1A1A (Card surfaces)
- `bg.surface.elevated` - #262626 (Elevated surfaces)
- `bg.surface.hover` - #333333 (Hover states)
- `bg.header` - #0D0D0D (Header background)
- `bg.footer` - #0D0D0D (Footer background)
- `bg.modal` - #1A1A1A (Modal background)
- `bg.card` - #1A1A1A (Card background)
- `bg.input` - #262626 (Input background)

#### Text Tokens

- `text.primary` - #FFFFFF (Primary text)
- `text.secondary` - #E5E5E5 (Secondary text)
- `text.tertiary` - #A3A3A3 (Tertiary text)
- `text.disabled` - #737373 (Disabled text)
- `text.inverse` - #0D0D0D (Inverse text)

#### Border Tokens

- `border.primary` - #404040 (Primary borders)
- `border.secondary` - #262626 (Secondary borders)
- `border.neon` - #00C2FF (Neon borders)
- `border.brand` - #00D18F (Brand borders)

## Typography

### Font Family

- **Primary**: Inter (Google Fonts)
- **Fallback**: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif

### Font Weights

- `normal` - 400
- `medium` - 500
- `semibold` - 600
- `bold` - 700

### Font Sizes

- `xs` - 0.75rem (12px)
- `sm` - 0.875rem (14px)
- `base` - 1rem (16px)
- `lg` - 1.125rem (18px)
- `xl` - 1.25rem (20px)
- `2xl` - 1.5rem (24px)
- `3xl` - 1.875rem (30px)
- `4xl` - 2.25rem (36px)
- `5xl` - 3rem (48px)
- `6xl` - 3.75rem (60px)

### Line Heights

- `none` - 1
- `tight` - 1.25
- `snug` - 1.375
- `normal` - 1.5
- `relaxed` - 1.625
- `loose` - 2

## Spacing System

### Base Units

- `0.5` - 0.125rem (2px)
- `1` - 0.25rem (4px)
- `1.5` - 0.375rem (6px)
- `2` - 0.5rem (8px)
- `2.5` - 0.625rem (10px)
- `3` - 0.75rem (12px)
- `3.5` - 0.875rem (14px)
- `4` - 1rem (16px)
- `5` - 1.25rem (20px)
- `6` - 1.5rem (24px)
- `7` - 1.75rem (28px)
- `8` - 2rem (32px)
- `9` - 2.25rem (36px)
- `10` - 2.5rem (40px)
- `12` - 3rem (48px)
- `14` - 3.5rem (56px)
- `16` - 4rem (64px)
- `20` - 5rem (80px)
- `24` - 6rem (96px)
- `28` - 7rem (112px)
- `32` - 8rem (128px)
- `36` - 9rem (144px)
- `40` - 10rem (160px)
- `44` - 11rem (176px)
- `48` - 12rem (192px)
- `52` - 13rem (208px)
- `56` - 14rem (224px)
- `60` - 15rem (240px)
- `64` - 16rem (256px)
- `72` - 18rem (288px)
- `80` - 20rem (320px)
- `96` - 24rem (384px)

## Border Radius

- `none` - 0
- `sm` - 0.25rem (4px)
- `base` - 0.375rem (6px)
- `md` - 0.5rem (8px)
- `lg` - 0.75rem (12px)
- `xl` - 1rem (16px)
- `2xl` - 1.5rem (24px)
- `3xl` - 2rem (32px)
- `full` - 9999px

## Shadows

### Standard Shadows

- `xs` - 0 1px 2px rgba(0,0,0,0.3)
- `sm` - 0 2px 8px rgba(0,0,0,0.4)
- `md` - 0 6px 16px rgba(0,0,0,0.5)
- `lg` - 0 12px 24px rgba(0,0,0,0.6)
- `xl` - 0 24px 48px rgba(0,0,0,0.7)

### Special Effects

- `neon` - 0 0 20px rgba(0,194,255,0.3)
- `neon.glow` - 0 0 30px rgba(0,194,255,0.4)
- `brand.glow` - 0 0 20px rgba(0,209,143,0.3)
- `focus` - 0 0 0 3px rgba(0,194,255,0.5)

## Breakpoints

- `base` - 0px
- `sm` - 420px (Mobile single column)
- `md` - 700px (Tablet forms)
- `lg` - 1024px (Desktop)
- `xl` - 1280px (Desktop container)
- `2xl` - 1536px

## Component Variants

### Button Variants

#### Primary Button

- Background: `neon.500`
- Text: `dark.900`
- Hover: `neon.400` with `neon.glow` shadow
- Focus: `neon.400` with `focus` shadow

#### Secondary Button

- Background: `brand.500`
- Text: `dark.900`
- Hover: `brand.400` with `brand.glow` shadow
- Focus: `brand.400` with `focus` shadow

#### Outline Button

- Background: Transparent
- Border: 2px `neon.500`
- Text: `neon.500`
- Hover: `neon.500` background with `neon.500` text and `neon.glow` shadow

#### Ghost Button

- Background: Transparent
- Text: `text.primary`
- Hover: `bg.surface.hover` background with `neon.500` text

#### Destructive Button

- Background: `error.500`
- Text: White
- Hover: `error.600` with red glow shadow
- Focus: `error.600` with `focus` shadow

### Button Sizes

- `sm` - 36px height, 16px padding
- `md` - 44px height, 24px padding (default)
- `lg` - 52px height, 32px padding

### Input Variants

#### Filled Input (Default)

- Background: `bg.input`
- Border: 2px `border.primary`
- Focus: `neon.500` border with `neon.glow` shadow
- Hover: `border.neon` border
- Invalid: `error.500` border with red glow shadow

### Card Variants

#### Default Card

- Background: `bg.card`
- Border: 1px `border.primary`
- Neon gradient border effect
- Box shadow: `md`

#### Elevated Card

- Background: `bg.surface.elevated`
- Enhanced neon gradient border
- Box shadow: `lg`

#### Interactive Card

- Hover: `translateY(-4px)` with `xl` shadow
- Border color changes to `border.neon` on hover

### Modal Variants

#### Default Modal

- Background: `bg.modal`
- Border: 1px `border.neon`
- Neon gradient border effect
- Box shadow: `xl`

## Transitions

### Timing Functions

- `fast` - 150ms cubic-bezier(0.4, 0, 0.2, 1)
- `normal` - 200ms cubic-bezier(0.4, 0, 0.2, 1) (default)
- `slow` - 300ms cubic-bezier(0.4, 0, 0.2, 1)

### Common Transitions

- Button hover: `all 200ms cubic-bezier(0.4, 0, 0.2, 1)`
- Card hover: `all 200ms cubic-bezier(0.4, 0, 0.2, 1)`
- Input focus: `all 200ms cubic-bezier(0.4, 0, 0.2, 1)`

## Z-Index Scale

- `hide` - -1
- `auto` - auto
- `base` - 0
- `docked` - 10
- `dropdown` - 1000
- `sticky` - 1100
- `banner` - 1200
- `overlay` - 1300
- `modal` - 1400
- `popover` - 1500
- `skipLink` - 1600
- `toast` - 1700
- `tooltip` - 1800

## Accessibility Features

### Focus Management

- Visible focus indicators with neon blue outline
- Focus-visible only for keyboard navigation
- Mouse users don't see focus outlines
- Focus shadows with `focus` token

### Motion Reduction

- Respects `prefers-reduced-motion: reduce`
- Animations reduced to 0.01ms when motion is reduced
- Smooth scrolling disabled when motion is reduced

### High Contrast Support

- Enhanced borders in high contrast mode
- Increased border widths for better visibility
- Maintains color contrast ratios

### Screen Reader Support

- Proper ARIA labels and descriptions
- Semantic HTML structure
- Skip links for keyboard navigation

## Implementation

### Theme Configuration

The design system is implemented through Chakra UI's theme extension system in `src/theme.ts`.

### Global Styles

Global styles are defined in `src/styles/globals.css` including:

- Neon gradient background
- Inter font loading
- Motion reduction support
- Custom scrollbar styling

### Design Tokens

Portable design tokens are stored in `src/theme/tokens.json` for use across different platforms.

### Component Usage

#### Basic Button

```tsx
<Button variant="primary">Get Started</Button>
```

#### Form Input

```tsx
<Input placeholder="Enter your text..." />
```

#### Card Component

```tsx
<Card variant="elevated" p={6}>
  <Heading size="md">Card Title</Heading>
  <Text>Card content goes here</Text>
</Card>
```

#### Modal Component

```tsx
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    <ModalHeader>Modal Title</ModalHeader>
    <ModalBody>Modal content</ModalBody>
    <ModalFooter>
      <Button variant="ghost" mr={3}>
        Cancel
      </Button>
      <Button variant="primary">Confirm</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

## Testing

### Design System Showcase

Visit `/test-neon-dark-design` to see all components and variants in action.

### Responsive Testing

- **Mobile (≤420px)**: Single column layout, buttons ≥44px tall
- **Tablet (700px)**: Form layouts optimized for touch
- **Desktop (≥1280px)**: Full container width with optimal spacing

### Browser Compatibility

- Modern browsers with CSS Grid and Flexbox support
- Mobile browsers with touch event support
- iOS Safari with viewport fixes
- Android Chrome with gesture support

## Migration Guide

### From Old Theme

1. Replace `colorScheme="green"` with `variant="primary"`
2. Replace `colorScheme="blue"` with `variant="outline"`
3. Replace `colorScheme="red"` with `variant="destructive"`
4. Update color references to use semantic tokens
5. Replace old breakpoint references with new responsive values

### Color Mapping

- Old green → `brand.500` or `variant="primary"`
- Old blue → `neon.500` or `variant="outline"`
- Old gray → `text.secondary` or `bg.surface`
- Old white → `text.primary`

## Future Enhancements

### Planned Features

- Animation library with neon effects
- Advanced gradient generators
- Component playground
- Design token export for other platforms
- Storybook integration

### Accessibility Improvements

- Enhanced keyboard navigation
- Voice control support
- High contrast mode variations
- Reduced motion alternatives

## Support

For questions about the Neon Dark Design Language system:

1. Check the component showcase at `/test-neon-dark-design`
2. Review the theme configuration in `src/theme.ts`
3. Consult the design tokens in `src/theme/tokens.json`
4. Test responsive behavior across different screen sizes

---

_Speedy Van Neon Dark Design Language System v1.0_
_Last updated: January 2025_
