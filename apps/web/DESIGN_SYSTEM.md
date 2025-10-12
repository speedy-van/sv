# Design System & Motion

This document outlines the design system and motion patterns implemented for the Speedy Van admin dashboard.

## Motion Tokens

### Easing Functions

- `--ease-enter`: `cubic-bezier(.2,.8,.2,1)` - Smooth entrance animations
- `--ease-exit`: `cubic-bezier(.4,0,1,1)` - Quick exit animations
- `--ease-bounce`: `cubic-bezier(.68,-.55,.265,1.55)` - Bouncy interactions
- `--ease-smooth`: `cubic-bezier(.25,.46,.45,.94)` - Smooth transitions

### Duration Tokens

- `--dur-fast`: `120ms` - Quick micro-interactions
- `--dur-normal`: `200ms` - Standard transitions
- `--dur-slow`: `280ms` - Complex animations
- `--dur-slower`: `400ms` - Page transitions
- `--dur-180`: `180ms` - Drawer animations

## Status Colors

### Semantic Status System

- **New**: `#FEF3C7` (amber) - New items, pending review
- **Active**: `#DBEAFE` (blue) - In progress, currently active
- **Success**: `#D1FAE5` (green) - Completed, successful
- **Error**: `#FEE2E2` (red) - Failed, errors, issues
- **Warning**: `#FEF3C7` (amber) - Warnings, attention needed
- **Info**: `#DBEAFE` (blue) - Informational messages
- **Pending**: `#F3E8FF` (purple) - Waiting, queued
- **Completed**: `#D1FAE5` (green) - Finished tasks
- **Cancelled**: `#F3F4F6` (gray) - Cancelled, inactive

## Motion Patterns

### Page Transitions

- **Fade**: Subtle opacity transition (200ms)
- **Slide**: Horizontal slide with fade (300ms)
- **Scale**: Scale with fade for modals (200ms)

### Component Animations

- **Status Chips**: Scale in with bounce (120ms)
- **Cards**: Hover lift (-4px Y), press scale (0.98)
- **Buttons**: Hover lift (-1px Y), press scale (0.98)
- **Lists**: Staggered fade-in (50ms delay between items)

### Micro-interactions

- **Hover**: Subtle lift and scale changes
- **Press**: Scale down feedback
- **Focus**: Consistent focus ring with brand color
- **Loading**: Smooth spinner rotation

## Components

### StatusChip

```tsx
<StatusChip status="success" size="md" animated showIcon>
  Completed
</StatusChip>
```

### PageTransition

```tsx
<PageTransition variant="fade" duration={200}>
  <PageContent />
</PageTransition>
```

### MotionCard

```tsx
<MotionCard hover press variant="fade" delay={100}>
  <CardContent />
</MotionCard>
```

## Accessibility

### Reduced Motion Support

- Automatically detects `prefers-reduced-motion: reduce`
- Disables animations for users who prefer reduced motion
- Maintains functionality without motion

### Focus Management

- Consistent focus indicators with brand color
- Keyboard navigation support
- Screen reader friendly

## Implementation Guidelines

### When to Use Motion

1. **State Changes**: Status updates, loading states
2. **Navigation**: Page transitions, drawer opens
3. **Feedback**: Button presses, form submissions
4. **Attention**: New items, notifications

### Performance Considerations

- Use `transform` and `opacity` for smooth animations
- Avoid animating layout properties
- Keep animations under 400ms for responsiveness
- Use `will-change` sparingly

### Best Practices

- Consistent timing across similar interactions
- Respect user motion preferences
- Provide fallbacks for reduced motion
- Test on various devices and connection speeds

## File Structure

```
src/
├── lib/
│   └── motion.ts              # Motion utilities and variants
├── components/
│   ├── StatusChip.tsx         # Status indicator component
│   ├── PageTransition.tsx     # Page transition wrapper
│   ├── MotionCard.tsx         # Animated card component
│   └── MotionProvider.tsx     # Motion context provider
├── styles/
│   └── globals.css            # CSS motion tokens
└── theme.ts                   # Chakra UI theme with motion
```

## Usage Examples

### Admin Dashboard

```tsx
import { StatusChip, PageTransition, MotionCard } from '@/components';

export default function AdminDashboard() {
  return (
    <PageTransition variant="fade">
      <MotionCard hover>
        <StatusChip status="active" showIcon>
          System Online
        </StatusChip>
      </MotionCard>
    </PageTransition>
  );
}
```

### Real-time Updates

```tsx
import { motionVariants, getMotionVariants } from '@/lib/motion';

const MotionBox = motion(Box);

<MotionBox
  variants={getMotionVariants(motionVariants.fadeInUp)}
  initial="initial"
  animate="animate"
>
  {content}
</MotionBox>;
```

This design system ensures consistent, accessible, and performant motion throughout the application while respecting user preferences and maintaining a professional admin interface.
