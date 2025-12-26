# Category Item Images

## Required Images for "Most Common Items to Move" Section

Place the following PNG images in this directory (`public/images/items/`):

### Image Requirements
- **Format**: PNG with transparent background (preferred) or white background
- **Size**: 96x96px minimum (will be displayed at 48x48px for retina displays)
- **Style**: Simple, clear icons/illustrations of furniture items
- **Color**: Match the dark theme (light-colored items on transparent/dark background)

### Required Files

1. **sofa.png** - Sofa/couch icon
2. **wardrobe.png** - Wardrobe/closet icon
3. **boxes.png** - Moving boxes icon
4. **bed.png** - Bed frame icon
5. **table.png** - Dining/coffee table icon
6. **tv.png** - Television/TV icon
7. **clothing.png** - Clothing/suitcase icon
8. **chair.png** - Chair icon
9. **power-chair.png** - Power recliner/wheelchair icon
10. **appliances.png** - Kitchen appliances (fridge/washing machine) icon
11. **decorations.png** - Home decorations (mirror/lamp) icon
12. **books.png** - Books/bookshelf icon
13. **custom.png** - Pencil/edit icon for custom items

### Fallback Behavior
If an image fails to load, the system will automatically fallback to emoji icons:
- Sofas: 🛋️
- Wardrobes: 👔
- Boxes: 📦
- Beds: 🛏️
- Tables: 🪑
- TVs: 📺
- Clothing: 👕
- Chairs: 🪑
- Power Chairs: ♿
- Kitchen Appliances: 🍳
- Decorations: 🖼️
- Books: 📚
- Custom: ✏️

### Image Sources (Suggested)
- **Flaticon.com** - Free icons with attribution
- **Icons8.com** - Free icons in various styles
- **Noun Project** - Professional icons
- **Custom design** - Commission designer for branded set

### Implementation Details
Images are referenced in: `apps/web/src/lib/popular-items-data.ts`

The CommonItemsGrid component automatically handles image loading and fallback to emoji if images are missing or fail to load.
