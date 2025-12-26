# 📦 COMPREHENSIVE REPORT: STEP 2 ITEMS DISPLAY & SELECTION SYSTEM
## How Items Names and Images Display in Step 2 - Customer Selection Flow

**Generated:** 2025-01-27  
**System:** Speedy Van Professional Moving - Booking Luxury Platform  
**Component:** WhereAndWhatStep (Step 2)  
**Total Items:** 666 items across 18 categories

---

## 🎯 EXECUTIVE SUMMARY

Step 2 is the **item selection interface** where customers choose furniture and household items for their move. The system displays **666 items** with high-quality images, organized by categories, with advanced filtering, sorting, and search capabilities.

**Key Features:**
- **3 Selection Modes:** Smart Search, Category Browse, Packages
- **666 Items** from UK Removal Dataset
- **18 Categories** with subcategories
- **Advanced Filtering:** Weight range, subcategory, sorting
- **Image Display:** High-quality JPG images from `/UK_Removal_Dataset/Images_Only/`
- **Responsive Grid:** 2-5 columns based on screen size
- **Quantity Controls:** Plus/Minus buttons for each item

---

## 🏗️ SYSTEM ARCHITECTURE

### **Primary Component**
- **File:** `src/app/booking-luxury/components/WhereAndWhatStep.tsx`
- **Type:** React Functional Component
- **Lines:** ~1,734 lines
- **Purpose:** Main Step 2 interface for item selection

### **Data Source**
- **File:** `src/lib/uk-removal-items-data.ts`
- **Export:** `ALL_REMOVAL_ITEMS` array
- **Total Items:** 666 items
- **Auto-Generated:** Yes (from image files)

### **Image Storage**
- **Path:** `/public/UK_Removal_Dataset/Images_Only/`
- **Structure:** Organized by category folders
- **Format:** JPG files
- **Naming:** `{item_name}_{weight}kg.jpg`

---

## 📊 ITEM DATA STRUCTURE

### **RemovalItem Interface**
```typescript
interface RemovalItem {
  id: string;              // Unique identifier (e.g., "bed_double_king_85kg")
  name: string;            // Display name (e.g., "Bed Double King Jpg")
  category: string;        // Category name (e.g., "Bedroom Furniture")
  weight: number;          // Weight in kg (e.g., 85)
  image: string;           // Image path (e.g., "/UK_Removal_Dataset/Images_Only/Bedroom_Furniture/bed_double_king_jpg_85kg.jpg")
  folder: string;          // Category folder (e.g., "Bedroom_Furniture")
}
```

### **Example Item**
```typescript
{
  "id": "bed_double_king_85kg",
  "name": "Bed Double King Jpg",
  "weight": 85,
  "category": "Bedroom Furniture",
  "image": "/UK_Removal_Dataset/Images_Only/Bedroom_Furniture/bed_double_king_jpg_85kg.jpg",
  "folder": "Bedroom_Furniture"
}
```

---

## 🎨 ITEM DISPLAY SYSTEM

### **1. Display Grid Layout**

#### **Grid Configuration**
```typescript
<SimpleGrid 
  columns={[2, 2, 2, 4, 5]}  // 2 cols mobile, 2 tablet, 2 small desktop, 4 medium, 5 large
  spacing={{ base: 2, md: 3 }}
  w="full"
>
```

**Responsive Breakpoints:**
- **Mobile (< 768px):** 2 columns
- **Tablet (768px - 1024px):** 2 columns
- **Small Desktop (1024px - 1280px):** 2 columns
- **Medium Desktop (1280px - 1536px):** 4 columns
- **Large Desktop (> 1536px):** 5 columns

#### **Item Card Structure**
Each item is displayed in a `VStack` with:
1. **Image Container** (Box)
2. **Item Name** (Text)
3. **Weight Display** (Text)
4. **Quantity Controls** (Plus/Minus buttons)

---

### **2. Image Display**

#### **Image Container**
```typescript
<Box 
  w="100%" 
  h={{ base: "120px", sm: "140px", md: "160px" }}  // Responsive height
  borderRadius="lg" 
  overflow="hidden" 
  bg="rgba(17, 24, 39, 0.6)"  // Dark background
  display="flex" 
  alignItems="center" 
  justifyContent="center"
>
```

**Image Properties:**
```typescript
<Image 
  src={item.image}                    // Full path from item data
  alt={item.name}                     // Accessibility text
  w="100%"                            // Full width
  h="100%"                            // Full height
  objectFit="cover"                   // Cover entire container
  loading="lazy"                      // Lazy loading for performance
/>
```

**Image Path Resolution:**
- **Source:** `item.image` from `ALL_REMOVAL_ITEMS`
- **Format:** `/UK_Removal_Dataset/Images_Only/{folder}/{filename}.jpg`
- **Example:** `/UK_Removal_Dataset/Images_Only/Bedroom_Furniture/bed_double_king_jpg_85kg.jpg`

**Image Dimensions:**
- **Mobile:** 120px height
- **Small Tablet:** 140px height
- **Desktop:** 160px height
- **Width:** 100% of grid column

---

### **3. Item Name Display**

#### **Name Text Component**
```typescript
<Text 
  fontSize={{ base: "xs", sm: "sm", md: "md" }}  // Responsive font size
  color="white" 
  fontWeight="medium" 
  lineHeight="1.2" 
  noOfLines={2}                                    // Max 2 lines, truncate with ellipsis
  minH={{ base: "32px", md: "40px" }}            // Minimum height for consistency
  textAlign="center"
>
  {item.name}
</Text>
```

**Name Formatting:**
- **Source:** `item.name` from dataset
- **Format:** Usually ends with "Jpg" (e.g., "Bed Double King Jpg")
- **Display:** Truncated to 2 lines if too long
- **Font Sizes:**
  - Mobile: `xs` (12px)
  - Tablet: `sm` (14px)
  - Desktop: `md` (16px)

---

### **4. Weight Display**

#### **Weight Text Component**
```typescript
<Text 
  fontSize={{ base: "2xs", sm: "xs" }}  // Very small on mobile
  color="gray.400"                        // Gray color
  textAlign="center"
>
  {item.weight}kg
</Text>
```

**Weight Format:**
- **Display:** `{weight}kg` (e.g., "85kg")
- **Color:** Gray for secondary information
- **Font Size:** Very small to not distract from main content

---

### **5. Quantity Controls**

#### **Control Layout**
```typescript
<Box
  display="flex"
  flexDirection="row"                    // Horizontal layout
  justifyContent="center"
  alignItems="center"
  width="100%"
  gap={{ base: "4px", sm: "8px" }}      // Responsive gap
>
  {/* Minus Button */}
  {/* Quantity Display */}
  {/* Plus Button */}
</Box>
```

#### **Minus Button**
```typescript
<Box
  as="button"
  cursor={quantity > 0 ? "pointer" : "not-allowed"}
  opacity={quantity > 0 ? 1 : 0.3}      // Disabled when quantity is 0
  onClick={(e) => {
    e.stopPropagation();
    if (quantity > 0) {
      updateQuantity(item.id, quantity - 1, item);
    }
  }}
>
  <Icon as={FaMinus} fontSize="lg" color="white" />
</Box>
```

#### **Quantity Display**
```typescript
<Text 
  fontSize={{ base: "xs", sm: "sm" }} 
  color="white" 
  fontWeight="bold"
  textAlign="center"
>
  {quantity}
</Text>
```

#### **Plus Button**
```typescript
<Box
  as="button"
  cursor="pointer"
  onClick={(e) => {
    e.stopPropagation();
    updateQuantity(item.id, quantity + 1, item);
  }}
>
  <Icon as={FaPlus} fontSize="lg" color="white" />
</Box>
```

**Quantity Logic:**
- **Initial:** 0 (not selected)
- **Increment:** Click plus → quantity + 1
- **Decrement:** Click minus → quantity - 1 (disabled at 0)
- **Display:** Shows current quantity for selected items

---

## 🔍 ITEM FILTERING & SORTING SYSTEM

### **1. Selection Modes**

#### **Mode 1: Smart Search** (`itemSelectionMode === 'smart'`)
```typescript
if (itemSelectionMode === 'smart' && searchQuery) {
  items = searchItems(searchQuery);
}
```

**Functionality:**
- **Input:** Text search query
- **Search:** Searches item names, categories, and folders
- **Case-Insensitive:** Yes
- **Real-time:** Updates as user types

**Search Function:**
```typescript
export function searchItems(query: string): RemovalItem[] {
  const lowerQuery = query.toLowerCase().trim();
  return ALL_REMOVAL_ITEMS.filter(item => 
    item.name.toLowerCase().includes(lowerQuery) ||
    item.category.toLowerCase().includes(lowerQuery) ||
    item.folder.toLowerCase().includes(lowerQuery)
  );
}
```

#### **Mode 2: Category Browse** (`itemSelectionMode === 'choose'`)
```typescript
if (itemSelectionMode === 'choose' && selectedCategory) {
  items = filterItemsByCategory(selectedCategory);
  
  // Apply subcategory filter if selected
  if (selectedSubcategory && selectedSubcategory !== 'All') {
    items = items.filter(item => 
      item.name.toLowerCase().includes(subcategoryLower) ||
      item.name.toLowerCase().includes(subcategoryLower.slice(0, -1))
    );
  }
}
```

**Functionality:**
- **Category Selection:** User selects from 18 categories
- **Subcategory Filter:** Optional further filtering
- **Default Category:** "Bedroom" (on initial load)

**Filter Function:**
```typescript
export function filterItemsByCategory(category: string): RemovalItem[] {
  if (category === 'All') {
    return ALL_REMOVAL_ITEMS;
  }
  return ALL_REMOVAL_ITEMS.filter(item => item.category === category);
}
```

#### **Mode 3: Packages** (`itemSelectionMode === 'packages'`)
```typescript
if (itemSelectionMode === 'packages') {
  items = getPopularItems(50);
}
```

**Functionality:**
- **Shows:** Top 50 popular items
- **Purpose:** Quick selection for common moves
- **Items:** Pre-defined popular items (beds, sofas, tables, etc.)

---

### **2. Advanced Filtering**

#### **Weight Filter**
```typescript
if (minWeight !== undefined || maxWeight !== undefined) {
  items = filterItemsByWeight(items, minWeight, maxWeight);
}
```

**Filter Function:**
```typescript
export function filterItemsByWeight(
  items: RemovalItem[], 
  minWeight?: number, 
  maxWeight?: number
): RemovalItem[] {
  return items.filter(item => {
    if (minWeight !== undefined && item.weight < minWeight) return false;
    if (maxWeight !== undefined && item.weight > maxWeight) return false;
    return true;
  });
}
```

**UI Controls:**
- **Min Weight:** Number input (0-500kg)
- **Max Weight:** Number input (minWeight-500kg)
- **Reset:** Button to clear weight filters

#### **Subcategory Filter**
```typescript
if (selectedSubcategory && selectedSubcategory !== 'All') {
  const subcategoryLower = selectedSubcategory.toLowerCase();
  items = items.filter(item => 
    item.name.toLowerCase().includes(subcategoryLower) ||
    item.name.toLowerCase().includes(subcategoryLower.slice(0, -1))
  );
}
```

**Subcategory Extraction:**
- **Source:** Extracted from item names within selected category
- **Example:** "Bedroom" category → subcategories: "Bed", "Mattress", "Wardrobe", etc.

---

### **3. Sorting System**

#### **Sort Options**
```typescript
type SortOption = 
  | 'popular'      // Most commonly moved items first
  | 'weight-asc'   // Lightest to heaviest
  | 'weight-desc'  // Heaviest to lightest
  | 'name-asc'     // Alphabetical A-Z
  | 'name-desc'    // Alphabetical Z-A
```

#### **Sort Function**
```typescript
export function sortItems(
  items: RemovalItem[],
  sortBy: SortOption
): RemovalItem[] {
  const sorted = [...items];
  
  switch (sortBy) {
    case 'weight-asc':
      return sorted.sort((a, b) => a.weight - b.weight);
    case 'weight-desc':
      return sorted.sort((a, b) => b.weight - a.weight);
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'popular':
      // Popularity scoring algorithm
      return sorted.sort((a, b) => {
        const aScore = calculatePopularityScore(a);
        const bScore = calculatePopularityScore(b);
        if (aScore !== bScore) return bScore - aScore;
        return a.name.localeCompare(b.name);
      });
  }
}
```

#### **Popularity Scoring**
```typescript
const popularKeywords = [
  { keyword: 'bed', score: 100 },
  { keyword: 'sofa', score: 95 },
  { keyword: 'table', score: 90 },
  { keyword: 'wardrobe', score: 85 },
  { keyword: 'chair', score: 80 },
  { keyword: 'tv', score: 75 },
  { keyword: 'washing machine', score: 70 },
  { keyword: 'fridge', score: 70 },
  { keyword: 'mattress', score: 90 },
  { keyword: 'desk', score: 65 },
  // ... more keywords
];
```

**Scoring Logic:**
- Items matching popular keywords get higher scores
- Items sorted by score (highest first)
- Ties broken by alphabetical order

---

## 📋 CATEGORIES & SUBCATEGORIES

### **18 Main Categories**

1. **Antiques & Collectibles** (23 items)
2. **Bathroom Furniture** (18 items)
3. **Carpets & Rugs** (19 items)
4. **Children & Baby Items** (24 items)
5. **Dining Room Furniture** (18 items)
6. **Electrical & Electronic** (31 items)
7. **Garden & Outdoor** (15 items)
8. **Gym & Fitness Equipment** (10 items)
9. **Kitchen Appliances** (10 items)
10. **Living Room Furniture** (10 items)
11. **Bedroom Furniture** (10 items)
12. **Miscellaneous Household** (15 items)
13. **Musical Instruments** (15 items)
14. **Office Furniture** (10 items)
15. **Wardrobes/Closets** (10 items)
16. **Pet Items** (13 items)
17. **Special/Awkward Items** (13 items)
18. **Bags, Luggage & Boxes** (11 items)

**Total: 666 unique items**

### **Subcategory Extraction**

Subcategories are dynamically extracted from item names within each category:

```typescript
const subcategories = useMemo(() => {
  const categoryItems = filterItemsByCategory(selectedCategory);
  const subcats = new Set<string>();
  
  categoryItems.forEach(item => {
    // Extract first word or common terms
    const words = item.name.toLowerCase().split(' ');
    // Add logic to extract subcategories
  });
  
  return ['All', ...Array.from(subcats).sort()];
}, [selectedCategory]);
```

---

## 🎯 ITEM SELECTION FLOW

### **1. Customer Selection Process**

```
┌─────────────────────────────────────────┐
│         STEP 2: ITEM SELECTION          │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    SELECTION MODE                       │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │  Smart  │ │ Choose  │ │Packages │  │
│  │ Search  │ │Category │ │         │  │
│  └─────────┘ └─────────┘ └──────────┘  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    FILTER & SORT                        │
│  - Category/Subcategory                 │
│  - Weight Range                         │
│  - Sort By (Popular/Weight/Name)        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    ITEMS GRID DISPLAY                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ IMG │ │ IMG │ │ IMG │ │ IMG │      │
│  │Name │ │Name │ │Name │ │Name │      │
│  │Weight│ │Weight│ │Weight│ │Weight│      │
│  │ - 0 +│ │ - 1 +│ │ - 2 +│ │ - 0 +│      │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    QUANTITY UPDATE                       │
│  - Click Plus: quantity + 1             │
│  - Click Minus: quantity - 1            │
│  - Quantity = 0: Item removed           │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    STATE UPDATE                         │
│  - Single-leg: Update global items      │
│  - Multi-leg: Update all segments       │
└─────────────────────────────────────────┘
```

### **2. Add Item Function**

```typescript
const addItem = useCallback((item: any) => {
  // Save scroll position (mobile only)
  const isMobile = window.innerWidth < 768;
  const scrollY = isMobile ? window.scrollY : undefined;
  
  updateItemsInAllSegments((items) => {
    const existingItem = items.find((i: any) => i.id === item.id);
    if (existingItem) {
      // Increment quantity if item exists
      return items.map((i: any) => 
        i.id === item.id ? { ...i, quantity: (i.quantity || 0) + 1 } : i
      );
    } else {
      // Add new item with quantity 1
      return [...items, { ...item, quantity: 1 }];
    }
  });
  
  // Restore scroll position (mobile only)
  if (isMobile && scrollY !== undefined) {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  }
}, [updateItemsInAllSegments]);
```

**Key Features:**
- **Increment Logic:** If item exists, increment quantity
- **Add Logic:** If item doesn't exist, add with quantity 1
- **Scroll Preservation:** Maintains scroll position on mobile
- **Multi-leg Support:** Updates all segments simultaneously

### **3. Update Quantity Function**

```typescript
const updateQuantity = useCallback((itemId: any, quantity: number, item?: any) => {
  const isMobile = window.innerWidth < 768;
  const scrollY = isMobile ? window.scrollY : undefined;
  
  if (quantity === 0) {
    removeItem(itemId);
    return;
  }
  
  updateItemsInAllSegments((items) => {
    const existingItem = items.find((i: any) => i.id === itemId);
    if (existingItem) {
      return items.map((i: any) =>
        i.id === itemId ? { ...i, quantity } : i
      );
    } else if (item) {
      return [...items, { ...item, quantity }];
    } else {
      console.warn(`Item ${itemId} not found`);
      return items;
    }
  });
  
  // Restore scroll position
  if (isMobile && scrollY !== undefined) {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  }
}, [updateItemsInAllSegments, removeItem]);
```

---

## 🔄 STATE MANAGEMENT

### **Single-Leg vs Multi-Leg**

#### **Single-Leg Booking**
```typescript
// Update global items
const globalItems = (step1.items && Array.isArray(step1.items)) ? step1.items : [];
const updatedItems = updater([...globalItems]);
updateFormData('step1', { items: updatedItems.map(item => ({ ...item })) });
```

**Storage:**
- Items stored in `formData.step1.items`
- Single array of selected items

#### **Multi-Leg Booking**
```typescript
// Update items in ALL segments
segments.forEach((segment, index) => {
  const segmentItems = (segment.items && Array.isArray(segment.items)) ? segment.items : [];
  const updatedItems = updater([...segmentItems]);
  updateSegment(index, { items: updatedItems.map(item => ({ ...item })) });
});

// Also update global items for consistency
const firstSegmentItems = (segments[0]?.items && Array.isArray(segments[0].items)) ? segments[0].items : [];
const updatedGlobalItems = updater([...firstSegmentItems]);
updateFormData('step1', { items: updatedGlobalItems.map(item => ({ ...item })) });
```

**Storage:**
- Items stored in each segment's `items` array
- All segments synchronized (same items)
- Global items mirror first segment

---

## 🎨 UI/UX FEATURES

### **1. Performance Optimizations**

#### **Lazy Loading**
```typescript
<Image 
  loading="lazy"  // Images load only when visible
/>
```

#### **Item Limit**
```typescript
{displayedItems.slice(0, 100).map((item) => {
  // Only render first 100 items
})}
```

**Rationale:**
- Prevents performance issues with large lists
- Shows message if more items available
- Encourages filtering to narrow results

#### **Memoization**
```typescript
const displayedItems = useMemo(() => {
  // Filtering and sorting logic
  return items;
}, [itemSelectionMode, searchQuery, selectedCategory, selectedSubcategory, sortBy, minWeight, maxWeight]);
```

**Benefits:**
- Recalculates only when dependencies change
- Prevents unnecessary re-renders
- Improves performance

---

### **2. Responsive Design**

#### **Grid Columns**
- **Mobile:** 2 columns (optimized for small screens)
- **Tablet:** 2 columns (maintains readability)
- **Desktop:** 4-5 columns (maximizes screen space)

#### **Image Sizes**
- **Mobile:** 120px height
- **Tablet:** 140px height
- **Desktop:** 160px height

#### **Font Sizes**
- **Item Name:**
  - Mobile: `xs` (12px)
  - Tablet: `sm` (14px)
  - Desktop: `md` (16px)
- **Weight:**
  - Mobile: `2xs` (10px)
  - Tablet: `xs` (12px)

---

### **3. Visual Feedback**

#### **Selected Items Indicator**
- **Quantity Display:** Shows current quantity (0 if not selected)
- **Button States:** Minus button disabled when quantity is 0
- **Opacity:** Disabled buttons at 30% opacity

#### **Hover Effects**
- **Plus/Minus Buttons:** Scale to 1.2x on hover
- **Smooth Transitions:** 0.2s transition for all interactions

---

## 📊 DISPLAYED ITEMS CALCULATION

### **Complete Flow**

```typescript
const displayedItems = useMemo(() => {
  let items: any[] = [];
  
  // STEP 1: Get base items based on mode
  if (itemSelectionMode === 'smart' && searchQuery) {
    items = searchItems(searchQuery);
  } else if (itemSelectionMode === 'choose' && selectedCategory) {
    items = filterItemsByCategory(selectedCategory);
    
    // Apply subcategory filter if selected
    if (selectedSubcategory && selectedSubcategory !== 'All') {
      const subcategoryLower = selectedSubcategory.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(subcategoryLower) ||
        item.name.toLowerCase().includes(subcategoryLower.slice(0, -1))
      );
    }
  } else if (itemSelectionMode === 'packages') {
    items = getPopularItems(50);
  } else {
    items = ALL_REMOVAL_ITEMS;
  }
  
  // STEP 2: Apply weight filter if set
  if (minWeight !== undefined || maxWeight !== undefined) {
    items = filterItemsByWeight(items, minWeight, maxWeight);
  }
  
  // STEP 3: Apply sorting
  items = sortItems(items, sortBy);
  
  return items;
}, [itemSelectionMode, searchQuery, selectedCategory, selectedSubcategory, sortBy, minWeight, maxWeight]);
```

**Dependencies:**
- `itemSelectionMode`: Current selection mode
- `searchQuery`: Search text (smart mode)
- `selectedCategory`: Selected category (choose mode)
- `selectedSubcategory`: Selected subcategory filter
- `sortBy`: Sort option
- `minWeight`: Minimum weight filter
- `maxWeight`: Maximum weight filter

---

## 🔧 ITEM QUANTITY TRACKING

### **Get Item Quantity Function**

```typescript
const getItemQuantity = useCallback((itemId: any) => {
  // Multi-leg: Get quantity from first segment
  if (isMultiLeg && segments.length > 0) {
    const firstSegment = segments[0];
    if (firstSegment?.items && Array.isArray(firstSegment.items)) {
      const segmentItem = firstSegment.items.find((i: any) => i.id === itemId);
      if (segmentItem) {
        return segmentItem.quantity || 0;
      }
    }
    
    // Fallback: Check other segments
    for (const segment of segments) {
      if (segment?.items && Array.isArray(segment.items)) {
        const segmentItem = segment.items.find((i: any) => i.id === itemId);
        if (segmentItem) {
          return segmentItem.quantity || 0;
        }
      }
    }
    
    return 0;
  }
  
  // Single-leg: Get from global items
  const item = (step1.items && Array.isArray(step1.items)) 
    ? step1.items.find((i: any) => i.id === itemId)
    : undefined;
  return item ? item.quantity : 0;
}, [isMultiLeg, segments, step1.items]);
```

**Logic:**
- **Multi-leg:** Checks first segment (all segments have same items)
- **Single-leg:** Checks global items array
- **Default:** Returns 0 if item not found

---

## 📸 IMAGE SYSTEM DETAILS

### **Image Path Structure**

```
/public/UK_Removal_Dataset/Images_Only/
  ├── Antiques_Collectibles/
  │   ├── antique_jewelry_box_wooden_jpg_6kg.jpg
  │   ├── armoire_oak_tudor_jpg_145kg.jpg
  │   └── ...
  ├── Bedroom_Furniture/
  │   ├── bed_double_king_jpg_85kg.jpg
  │   └── ...
  ├── Living_Room_Furniture/
  └── ...
```

### **Image Naming Convention**

**Format:** `{item_name}_{weight}kg.jpg`

**Examples:**
- `bed_double_king_jpg_85kg.jpg`
- `sofa_3_seater_jpg_120kg.jpg`
- `wardrobe_double_door_jpg_145kg.jpg`

### **Image Loading**

#### **Next.js Image Optimization**
- **Component:** Chakra UI `Image` component
- **Lazy Loading:** Enabled by default
- **Object Fit:** `cover` (fills container, maintains aspect ratio)
- **Background:** Dark gray (`rgba(17, 24, 39, 0.6)`) while loading

#### **Error Handling**
- **Fallback:** Dark background if image fails to load
- **Alt Text:** Item name for accessibility

---

## 🎯 RECOMMENDATIONS FOR IMPROVEMENT

### **1. Image Optimization**
- **Current:** Full-size JPG images
- **Recommendation:** 
  - Implement Next.js Image optimization
  - Add WebP format support
  - Generate thumbnails for grid view
  - Lazy load images below fold

### **2. Search Enhancement**
- **Current:** Simple text matching
- **Recommendation:**
  - Add fuzzy search (typos tolerance)
  - Implement search suggestions
  - Add search history
  - Category-based search filters

### **3. Filtering Improvements**
- **Current:** Basic weight and category filters
- **Recommendation:**
  - Add volume filter
  - Add fragility filter
  - Add price range filter
  - Save filter preferences

### **4. Sorting Enhancements**
- **Current:** 5 sort options
- **Recommendation:**
  - Add "Recently Added" sort
  - Add "Most Selected" sort
  - Add custom sort (drag & drop)
  - Remember user's preferred sort

### **5. Display Improvements**
- **Current:** Grid with 2-5 columns
- **Recommendation:**
  - Add list view option
  - Add compact view option
  - Add item preview modal
  - Add item details tooltip

### **6. Performance Optimizations**
- **Current:** 100 item limit, lazy loading
- **Recommendation:**
  - Implement virtual scrolling
  - Add pagination
  - Cache filtered results
  - Preload popular items

### **7. User Experience**
- **Current:** Basic quantity controls
- **Recommendation:**
  - Add "Add to Cart" animation
  - Add item selection sound
  - Add bulk selection mode
  - Add "Select All in Category"

### **8. Accessibility**
- **Current:** Basic alt text
- **Recommendation:**
  - Add keyboard navigation
  - Add screen reader support
  - Add focus indicators
  - Add ARIA labels

---

## 📝 KEY CODE LOCATIONS

### **Main Component**
- **File:** `src/app/booking-luxury/components/WhereAndWhatStep.tsx`
- **Lines:** 1-1734
- **Key Functions:**
  - `displayedItems` (line 192): Filtering/sorting logic
  - `addItem` (line 261): Add item handler
  - `updateQuantity` (line 302): Quantity update handler
  - `getItemQuantity` (line 334): Get current quantity

### **Data Source**
- **File:** `src/lib/uk-removal-items-data.ts`
- **Lines:** 1-5782
- **Key Exports:**
  - `ALL_REMOVAL_ITEMS`: 666 items array
  - `filterItemsByCategory`: Category filter
  - `searchItems`: Search function
  - `sortItems`: Sort function
  - `getPopularItems`: Popular items

### **Image Storage**
- **Path:** `/public/UK_Removal_Dataset/Images_Only/`
- **Structure:** 18 category folders
- **Total Images:** 666 JPG files

---

## 🎯 SUMMARY

### **Current System Strengths**
✅ **666 items** with high-quality images  
✅ **18 categories** with subcategories  
✅ **3 selection modes** (Smart, Choose, Packages)  
✅ **Advanced filtering** (weight, subcategory)  
✅ **5 sort options** (popular, weight, name)  
✅ **Responsive design** (2-5 columns)  
✅ **Multi-leg support** (synchronized segments)  
✅ **Performance optimized** (lazy loading, memoization)  

### **Areas for Enhancement**
⚠️ **Image optimization** (WebP, thumbnails)  
⚠️ **Search improvements** (fuzzy search, suggestions)  
⚠️ **Additional filters** (volume, fragility, price)  
⚠️ **View options** (list, compact, preview)  
⚠️ **Virtual scrolling** (for large lists)  
⚠️ **Accessibility** (keyboard nav, screen readers)  

---

**END OF REPORT**

*For technical questions or system updates, refer to:*
- `src/app/booking-luxury/components/WhereAndWhatStep.tsx`
- `src/lib/uk-removal-items-data.ts`
- `/public/UK_Removal_Dataset/Images_Only/`

