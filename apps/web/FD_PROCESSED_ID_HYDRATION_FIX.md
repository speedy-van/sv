# Fixing fdprocessedid Hydration Warning

## Problem

The `fdprocessedid` hydration warning occurs when there's a mismatch between server-side rendering (SSR) and client-side rendering (CSR). This typically happens when:

1. Form libraries inject attributes that don't exist on the server
2. Browser extensions add attributes to form elements
3. Components spread unknown props to button elements

## Symptoms

```
Warning: Extra attributes from the server: fdprocessedid
… at button … at IconButton …
```

## Solution

We've created several components and utilities to filter out problematic attributes:

### 1. SafeButton Component

Replace `Button` with `SafeButton` in components that might receive unknown props:

```tsx
import { SafeButton } from '@/components/common';

// Instead of:
<Button {...props}>Click me</Button>

// Use:
<SafeButton {...props}>Click me</SafeButton>
```

### 2. SafeIconButton Component

Replace `IconButton` with `SafeIconButton`:

```tsx
import { SafeIconButton } from '@/components/common';

// Instead of:
<IconButton {...props} />

// Use:
<SafeIconButton {...props} />
```

### 3. useSafeProps Hook

Use the hook to filter props before passing them to components:

```tsx
import { useSafeProps } from '@/hooks/useSafeProps';

function MyComponent(props) {
  const safeProps = useSafeProps(props);

  return <Button {...safeProps}>Click me</Button>;
}
```

### 4. withSafeProps HOC

Wrap components to automatically filter problematic attributes:

```tsx
import { withSafeProps } from '@/components/common';
import { Button } from '@chakra-ui/react';

const SafeButton = withSafeProps(Button);

// Use SafeButton instead of Button
<SafeButton {...props}>Click me</SafeButton>;
```

## Implementation Strategy

### Phase 1: Replace in High-Risk Areas

1. Forms using react-hook-form
2. Components that spread props
3. Components using `as="button"`

### Phase 2: Gradual Migration

1. Replace Button components in admin components
2. Update driver portal components
3. Update customer portal components

### Phase 3: Global Replacement

1. Create aliases for Button and IconButton
2. Update all imports
3. Remove old components

## Example Migration

```tsx
// Before
import { Button, IconButton } from '@chakra-ui/react';

export function MyForm({ ...props }) {
  return (
    <form>
      <Button {...props}>Submit</Button>
      <IconButton {...props} />
    </form>
  );
}

// After
import { SafeButton, SafeIconButton } from '@/components/common';

export function MyForm({ ...props }) {
  return (
    <form>
      <SafeButton {...props}>Submit</SafeButton>
      <SafeIconButton {...props} />
    </form>
  );
}
```

## Testing

After implementing the fix:

1. Check browser console for hydration warnings
2. Verify forms still work correctly
3. Test in different browsers (some may inject different attributes)
4. Test with browser extensions enabled/disabled

## Notes

- The `fdprocessedid` attribute is commonly injected by form libraries
- This fix doesn't affect functionality, only prevents warnings
- All Chakra UI Button props are still supported
- The solution is backward compatible
