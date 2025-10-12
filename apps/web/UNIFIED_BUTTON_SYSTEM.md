# Unified Button System

## Overview

The Speedy Van project now features a unified button system that ensures consistent styling, sizing, and behavior across all components. This system follows the design system requirements and provides a standardized approach to button implementation.

## Design System Requirements

### ✅ Implemented Features

#### 1. **Consistent Button Heights**

- **Mobile**: 48px (`md` size)
- **Desktop**: 56px (`lg` size)
- **Small**: 36px (`sm` size)
- **Extra Large**: 64px (`xl` size)

#### 2. **Consistent Padding**

- **Standard**: `px-6 py-3` (24px horizontal, 12px vertical)
- **Small**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Large**: `px-6 py-3` (24px horizontal, 12px vertical)
- **Extra Large**: `px-8 py-4` (32px horizontal, 16px vertical)

#### 3. **Typography**

- **Font Family**: Inter, system-ui, sans-serif
- **Font Size**: 16px (standard), 14px (small), 18px (large)
- **Font Weight**: 600 (semibold)

#### 4. **Button Variants**

##### **Primary CTA Buttons**

- **Use Case**: "Continue to Items", "Continue to Payment", "Book Now"
- **Styling**: Neon Blue background, rounded pill, hover glow
- **Responsive**: Full width on mobile, auto-width on desktop
- **Implementation**: `variant="primary" isCTA={true}`

##### **Secondary Buttons**

- **Use Case**: "Back", "Cancel", "Previous"
- **Styling**: Transparent background with neon border
- **Responsive**: Auto-width (compact)
- **Implementation**: `variant="secondary"`

##### **Outline Buttons**

- **Use Case**: "Edit", "View Details", "More Options"
- **Styling**: Transparent background with subtle border
- **Responsive**: Auto-width
- **Implementation**: `variant="outline"`

##### **Ghost Buttons**

- **Use Case**: "Learn More", "Help", "Settings"
- **Styling**: Subtle transparent background
- **Responsive**: Auto-width
- **Implementation**: `variant="ghost"`

##### **Destructive Buttons**

- **Use Case**: "Delete", "Remove", "Cancel Order"
- **Styling**: Red border + text, glow on hover
- **Responsive**: Auto-width
- **Implementation**: `variant="destructive"`

#### 5. **Interaction Patterns**

- **Hover**: `translateY(-2px)` with glow effects
- **Active**: `translateY(0)` (return to original position)
- **Focus**: Neon glow outline with `focus` shadow
- **Disabled**: 50% opacity, no interactions

## Technical Implementation

### **Theme Configuration**

The button system is implemented in `src/theme.ts` with the following structure:

```typescript
Button: {
  baseStyle: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    borderRadius: 'full', // Pill shape
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    // ... focus and disabled styles
  },

  variants: {
    primary: { /* Neon blue with glow */ },
    secondary: { /* Transparent with neon border */ },
    outline: { /* Subtle border */ },
    ghost: { /* Transparent */ },
    destructive: { /* Red border + glow */ },
    headerCta: { /* Special header variant */ }
  },

  sizes: {
    sm: { minH: '36px', px: 4, py: 2, fontSize: '14px' },
    md: { minH: '48px', px: 6, py: 3, fontSize: '16px' },
    lg: { minH: '56px', px: 6, py: 3, fontSize: '16px' },
    xl: { minH: '64px', px: 8, py: 4, fontSize: '18px' }
  }
}
```

### **Custom Button Component**

The `src/components/common/Button.tsx` component provides:

- **Responsive Width Logic**: Automatic width handling for CTA vs secondary buttons
- **Variant Mapping**: Clean interface for button variants
- **Size Consistency**: Enforces consistent sizing across the app
- **CTA Support**: Special handling for primary call-to-action buttons

### **Usage Examples**

#### **Primary CTA Button**

```tsx
<Button variant="primary" size="lg" isCTA={true}>
  Continue to Items
</Button>
```

#### **Secondary Button**

```tsx
<Button variant="secondary" size="lg">
  Back
</Button>
```

#### **Form Navigation**

```tsx
<HStack spacing={4} justify="space-between">
  <Button variant="secondary" size="lg">
    ← Back
  </Button>
  <Button variant="primary" size="lg" isCTA={true}>
    Continue →
  </Button>
</HStack>
```

## Migration Guide

### **Before (Old System)**

```tsx
// Inconsistent sizing and variants
<Button variant="outline" size="lg">Back</Button>
<Button colorScheme="blue" size="lg">Continue</Button>
<Button variant="ghost">Cancel</Button>
```

### **After (Unified System)**

```tsx
// Consistent sizing and variants
<Button variant="secondary" size="lg">Back</Button>
<Button variant="primary" size="lg" isCTA={true}>Continue</Button>
<Button variant="ghost" size="lg">Cancel</Button>
```

### **Variant Mapping**

- `variant="outline"` → `variant="secondary"` (for navigation buttons)
- `colorScheme="blue"` → `variant="primary"` (for CTA buttons)
- `variant="ghost"` → `variant="ghost"` (unchanged, for subtle actions)

## Testing

### **Test Page**

Visit `/test-unified-buttons` to see all button variants in action.

### **Test Checklist**

- [ ] All button sizes render with correct heights
- [ ] CTA buttons are full width on mobile, auto on desktop
- [ ] Secondary buttons maintain auto-width
- [ ] Hover effects work consistently
- [ ] Focus states are accessible
- [ ] Typography matches design system
- [ ] Responsive behavior works correctly

## Best Practices

### **When to Use Each Variant**

1. **Primary (`variant="primary" isCTA={true}`)**
   - Main call-to-action buttons
   - Form submission buttons
   - "Continue", "Book Now", "Submit"

2. **Secondary (`variant="secondary"`)**
   - Navigation buttons (Back, Cancel)
   - Alternative actions
   - Secondary CTAs

3. **Outline (`variant="outline"`)**
   - Edit actions
   - View details
   - Secondary information actions

4. **Ghost (`variant="ghost"`)**
   - Subtle actions
   - Help, settings, learn more
   - Non-critical actions

5. **Destructive (`variant="destructive"`)**
   - Delete, remove actions
   - Cancellations
   - Destructive operations

### **Size Guidelines**

- **`sm`**: Inline actions, compact spaces
- **`md`**: Header buttons, compact forms
- **`lg`**: Standard form buttons, main actions
- **`xl`**: Hero CTAs, prominent actions

### **Responsive Considerations**

- **Mobile**: CTA buttons should be full width for better touch targets
- **Desktop**: CTA buttons can be auto-width for better visual balance
- **Secondary buttons**: Always auto-width for consistent spacing

## Future Enhancements

### **Potential Improvements**

- Button loading states with consistent styling
- Icon button variants
- Button group components
- Advanced responsive behaviors
- Animation customization options

### **Accessibility Improvements**

- Screen reader announcements for button states
- Keyboard navigation enhancements
- High contrast mode support
- Reduced motion preferences

## Support

For questions or issues with the unified button system:

1. **Check the test page** at `/test-unified-buttons`
2. **Review theme configuration** in `src/theme.ts`
3. **Examine button component** in `src/components/common/Button.tsx`
4. **Check variant usage** in existing components
5. **Test responsive behavior** on different screen sizes

The unified button system ensures consistency, accessibility, and maintainability across the entire Speedy Van application.
