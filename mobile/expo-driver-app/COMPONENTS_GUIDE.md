# 🎨 Mobile App Components Guide

## NeonButton Component

### Usage Examples

```tsx
import { NeonButton } from '../components/ui/NeonButton';

// Primary Button (Gradient + Glow)
<NeonButton
  title="Sign In"
  onPress={handleLogin}
  variant="primary"
  size="large"
  loading={isLoading}
/>

// Secondary Button (Brand Color)
<NeonButton
  title="Become a Driver"
  onPress={handleBecomeDriver}
  variant="secondary"
  size="medium"
  icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
/>

// Outline Button
<NeonButton
  title="Cancel"
  onPress={handleCancel}
  variant="outline"
  size="medium"
/>

// Ghost Button
<NeonButton
  title="Skip"
  onPress={handleSkip}
  variant="ghost"
  size="small"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Button text |
| onPress | function | required | Click handler |
| variant | 'primary' \| 'secondary' \| 'outline' \| 'ghost' | 'primary' | Visual style |
| size | 'small' \| 'medium' \| 'large' | 'medium' | Button size |
| disabled | boolean | false | Disable button |
| loading | boolean | false | Show loading spinner |
| icon | ReactNode | - | Optional icon |
| style | ViewStyle | - | Custom styles |
| textStyle | TextStyle | - | Custom text styles |

---

## NeonCard Component

### Usage Examples

```tsx
import { NeonCard } from '../components/ui/NeonCard';

// Default Card
<NeonCard variant="default" padding="medium">
  <Text>Card Content</Text>
</NeonCard>

// Neon Card with Glow
<NeonCard variant="neon" padding="large" glow>
  <Text>Important Content</Text>
</NeonCard>

// Brand Card
<NeonCard variant="brand" padding="medium">
  <Text>Success Message</Text>
</NeonCard>

// Dark Card (Best for content)
<NeonCard variant="dark" padding="large">
  <Text>Main Content</Text>
</NeonCard>

// Pressable Card
<NeonCard 
  variant="dark" 
  padding="large" 
  onPress={() => navigate('Details')}
>
  <Text>Tap to view details</Text>
</NeonCard>

// Animated Card
<NeonCard variant="neon" padding="medium" animated>
  <Text>Animated Content</Text>
</NeonCard>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | required | Card content |
| variant | 'default' \| 'neon' \| 'brand' \| 'dark' | 'default' | Visual style |
| padding | 'none' \| 'small' \| 'medium' \| 'large' | 'medium' | Internal padding |
| margin | 'none' \| 'small' \| 'medium' \| 'large' | 'small' | External margin |
| onPress | function | - | Makes card pressable |
| glow | boolean | false | Add glow effect |
| animated | boolean | false | Enable animations |
| style | ViewStyle | - | Custom styles |

---

## Design System Usage

### Colors

```tsx
import { Colors, SemanticColors } from '../styles/colors';

// Neon Colors
<View style={{ backgroundColor: Colors.neon[500] }} />
<Text style={{ color: Colors.neon[500] }}>Neon Text</Text>

// Brand Colors
<View style={{ backgroundColor: Colors.brand[500] }} />

// Semantic Colors
<View style={{ backgroundColor: SemanticColors.background.canvas }} />
<Text style={{ color: SemanticColors.text.primary }}>Primary Text</Text>
<Text style={{ color: SemanticColors.text.secondary }}>Secondary Text</Text>
```

### Typography

```tsx
import { TextStyles } from '../styles/typography';

<Text style={TextStyles.h1}>Heading 1</Text>
<Text style={TextStyles.h2}>Heading 2</Text>
<Text style={TextStyles.body}>Body Text</Text>
<Text style={TextStyles.caption}>Caption Text</Text>
<Text style={TextStyles.button}>Button Text</Text>
```

### Spacing

```tsx
import { Spacing, BorderRadius } from '../styles/spacing';

<View style={{ 
  padding: Spacing.lg,
  margin: Spacing.md,
  borderRadius: BorderRadius.lg,
}} />
```

---

## Screen Layouts

### Login Screen Pattern

```tsx
<KeyboardAvoidingView style={styles.container}>
  <View style={styles.content}>
    {/* Logo */}
    <View style={styles.logoContainer}>
      <Ionicons name="car-sport" size={80} color="#1E40AF" />
      <Text style={styles.title}>Speedy Van</Text>
      <Text style={styles.subtitle}>Driver Portal</Text>
    </View>

    {/* Form */}
    <View style={styles.form}>
      {/* Inputs */}
    </View>

    {/* Links */}
    <View style={styles.becomeDriver}>
      <Text>Not a driver yet?</Text>
      <TouchableOpacity onPress={handleBecomeDriver}>
        <Text style={styles.link}>Become a Driver →</Text>
      </TouchableOpacity>
    </View>

    {/* Support */}
    <View style={styles.support}>
      <Text>Need help?</Text>
      <Text>support@speedy-van.co.uk</Text>
      <Text>07901846297</Text>
    </View>
  </View>
</KeyboardAvoidingView>
```

### Dashboard Screen Pattern

```tsx
<View style={styles.container}>
  <LinearGradient colors={Gradients.darkSurface} style={styles.background}>
    <ScrollView 
      refreshControl={<RefreshControl />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back!</Text>
      </View>

      {/* Status Card */}
      <NeonCard variant="neon" padding="large" glow>
        {/* Status content */}
      </NeonCard>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <NeonCard variant="brand">{/* Stat 1 */}</NeonCard>
        <NeonCard variant="neon">{/* Stat 2 */}</NeonCard>
        <NeonCard variant="dark">{/* Stat 3 */}</NeonCard>
        <NeonCard variant="dark">{/* Stat 4 */}</NeonCard>
      </View>

      {/* Actions */}
      <NeonCard variant="dark" padding="large">
        {/* Action buttons */}
      </NeonCard>
    </ScrollView>
  </LinearGradient>
</View>
```

### Jobs List Pattern

```tsx
<View style={styles.container}>
  <LinearGradient colors={Gradients.darkSurface} style={styles.background}>
    {/* Header */}
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Available Jobs</Text>
      <Text style={styles.headerSubtitle}>{count} jobs found</Text>
    </View>

    {/* Filters */}
    <View style={styles.filters}>
      {filters.map(filter => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            active && styles.filterButtonActive
          ]}
        >
          <Text>{filter}</Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* List */}
    <FlatList
      data={jobs}
      renderItem={({ item }) => (
        <NeonCard variant="dark" padding="large" onPress={...}>
          {/* Job card content */}
        </NeonCard>
      )}
      ListEmptyComponent={<EmptyState />}
      refreshControl={<RefreshControl />}
    />
  </LinearGradient>
</View>
```

---

## Common Patterns

### Status Badge

```tsx
const getStatusColor = (status: string) => {
  const colors = {
    available: Colors.neon[500],
    assigned: Colors.success[500],
    active: Colors.warning[500],
    completed: Colors.dark[500],
  };
  return colors[status] || Colors.dark[500];
};

<View style={[
  styles.badge,
  { backgroundColor: getStatusColor(status) }
]}>
  <Text style={styles.badgeText}>
    {status.toUpperCase()}
  </Text>
</View>
```

### Icon with Text

```tsx
<View style={styles.infoItem}>
  <Ionicons name="calendar-outline" size={16} color={Colors.neon[500]} />
  <Text style={styles.infoText}>
    {date} {time}
  </Text>
</View>
```

### Location Display

```tsx
<View style={styles.locationRow}>
  <View style={styles.locationDivider} />
  <View style={styles.locationDetails}>
    <View style={styles.locationItem}>
      <View style={[styles.dot, { backgroundColor: Colors.success[500] }]} />
      <Text>{from}</Text>
    </View>
    <View style={styles.locationItem}>
      <View style={[styles.dot, { backgroundColor: Colors.error[500] }]} />
      <Text>{to}</Text>
    </View>
  </View>
</View>
```

### Empty State

```tsx
<View style={styles.emptyContainer}>
  <View style={styles.emptyIconContainer}>
    <Ionicons name="briefcase-outline" size={80} color={Colors.dark[600]} />
  </View>
  <Text style={styles.emptyTitle}>No Jobs Found</Text>
  <Text style={styles.emptyText}>Check back later</Text>
</View>
```

---

## Best Practices

### 1. Always Use Design System
```tsx
// ✅ Good
<Text style={[TextStyles.h3, { color: Colors.neon[500] }]}>

// ❌ Bad
<Text style={{ fontSize: 30, color: '#00C2FF' }}>
```

### 2. Consistent Spacing
```tsx
// ✅ Good
<View style={{ padding: Spacing.lg, margin: Spacing.md }}>

// ❌ Bad
<View style={{ padding: 24, margin: 16 }}>
```

### 3. Use Semantic Colors
```tsx
// ✅ Good
<Text style={{ color: SemanticColors.text.primary }}>

// ❌ Bad
<Text style={{ color: '#FFFFFF' }}>
```

### 4. Neon Effects for Important Elements
```tsx
// Primary actions
<NeonButton variant="primary" /> // Auto glow

// Important cards
<NeonCard variant="neon" glow />

// Status indicators
<View style={{ shadowColor: Colors.neon[500] }} />
```

### 5. Dark Theme Consistency
```tsx
// All screens should use:
<LinearGradient colors={Gradients.darkSurface}>
<StatusBar barStyle="light-content" />
```

---

## Accessibility

### Touch Targets
- Minimum 44x44 pixels
- Use `Spacing.touchTarget` constant
- Add `accessibilityLabel` to buttons

### Color Contrast
- Text on dark: Use `.text.primary` (white)
- Secondary text: Use `.text.secondary`
- Ensure 4.5:1 contrast ratio

### Screen Readers
```tsx
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Become a driver"
  accessibilityRole="button"
  accessibilityHint="Opens driver application form"
>
```

---

## Performance Tips

1. **Memoize Styles**: Use `useMemo` for dynamic styles
2. **Optimize Lists**: Use `FlatList` with `keyExtractor`
3. **Image Optimization**: Use appropriate sizes
4. **Avoid Inline Functions**: Extract to constants
5. **Use PureComponent**: For static components

---

## Testing

### Component Testing
```tsx
import { render, fireEvent } from '@testing-library/react-native';

test('NeonButton calls onPress', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <NeonButton title="Test" onPress={onPress} />
  );
  
  fireEvent.press(getByText('Test'));
  expect(onPress).toHaveBeenCalled();
});
```

---

**Happy Coding! 🚀**
