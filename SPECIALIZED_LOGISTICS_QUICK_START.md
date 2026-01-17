# 🚀 Quick Implementation Guide: Specialized Logistics

**Target:** Get specialized item booking flow live in 2 weeks

---

## Week 1: Backend Foundation

### Day 1-2: Database Setup
```bash
# 1. Add schema changes to packages/shared/prisma/schema.prisma
# Copy content from SPECIALIZED_LOGISTICS_SCHEMA.prisma

# 2. Format and migrate
cd packages/shared
npx prisma format
npx prisma migrate dev --name add_specialized_logistics
npx prisma generate

# 3. Seed specialized equipment
npx prisma db seed -- --specialized-equipment
```

### Day 3-4: API Routes

**Create:** `apps/web/src/app/api/specialized-items/route.ts`
```typescript
// GET - Fetch workflow config
// POST - Create specialized item
export async function POST(req: Request) {
  const { bookingItemId, category, technicalSpecs, declaredValue } = await req.json();
  
  const specializedItem = await prisma.specializedItem.create({
    data: {
      bookingItemId,
      category,
      technicalSpecs,
      declaredValue,
      insuranceTier: calculateTier(declaredValue),
      requiredEquipment: getRequiredEquipment(category)
    }
  });
  
  return NextResponse.json(specializedItem);
}
```

**Create:** `apps/web/src/app/api/specialized-items/workflows/route.ts`
```typescript
// GET - Fetch workflow by category
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  
  const workflow = await prisma.specializedWorkflow.findUnique({
    where: { itemCategory: category }
  });
  
  return NextResponse.json(workflow);
}
```

**Create:** `apps/web/src/app/api/insurance/quote/route.ts`
```typescript
// POST - Calculate insurance quote
export async function POST(req: Request) {
  const { category, declaredValue, tier } = await req.json();
  
  const quote = calculateInsuranceQuote({
    category,
    declaredValue,
    tier
  });
  
  return NextResponse.json(quote);
}
```

### Day 5: Helper Functions

**Create:** `apps/web/src/lib/specialized/calculator.ts`
```typescript
export function calculateRequiredEquipment(
  category: SpecializedItemCategory,
  specs: any
): string[] {
  const equipmentMap = {
    PIANO_UPRIGHT: ['PIANO_DOLLY', 'PIANO_BOARD', 'NON_MARKING_STRAPS'],
    PIANO_GRAND: ['PIANO_DOLLY', 'PIANO_BOARD', 'HYDRAULIC_LIFT'],
    FINE_ART_PAINTING: ['ART_CRATE', 'PROTECTIVE_BLANKETS'],
    // ... more categories
  };
  
  let equipment = equipmentMap[category] || [];
  
  // Dynamic additions based on specs
  if (specs.stairsRequired) {
    equipment.push('STAIR_CLIMBER');
  }
  
  return equipment;
}

export function calculateInsuranceTier(value: number): InsuranceTier {
  if (value <= 500000) return 'STANDARD';
  if (value <= 2500000) return 'PREMIUM';
  if (value <= 10000000) return 'PLATINUM';
  return 'BESPOKE';
}
```

---

## Week 2: Frontend Integration

### Day 1-2: Specialized Item Wizard

**Create:** `apps/web/src/app/booking-luxury/components/specialized/SpecializedItemWizard.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Box, VStack, Heading, FormControl, FormLabel, Input, Select, Button } from '@chakra-ui/react';

interface SpecializedItemWizardProps {
  bookingItemId: string;
  onComplete: (data: any) => void;
}

export function SpecializedItemWizard({ bookingItemId, onComplete }: SpecializedItemWizardProps) {
  const [category, setCategory] = useState<string>('');
  const [workflow, setWorkflow] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (category) {
      fetchWorkflow(category).then(setWorkflow);
    }
  }, [category]);

  const handleSubmit = async () => {
    const specializedItem = await fetch('/api/specialized-items', {
      method: 'POST',
      body: JSON.stringify({
        bookingItemId,
        category,
        technicalSpecs: formData,
        declaredValue: parseFloat(formData.declaredValue) * 100 // Convert to pence
      })
    }).then(r => r.json());

    onComplete(specializedItem);
  };

  return (
    <Box>
      <Heading size="md" mb={4}>Specialized Item Details</Heading>
      
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Item Category</FormLabel>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select category...</option>
            <option value="PIANO_UPRIGHT">Upright Piano</option>
            <option value="PIANO_GRAND">Grand Piano</option>
            <option value="FINE_ART_PAINTING">Fine Art Painting</option>
            <option value="ANTIQUE_FURNITURE">Antique Furniture</option>
            <option value="LUXURY_FURNITURE">Luxury Furniture</option>
          </Select>
        </FormControl>

        {workflow && workflow.requiredFields.map((field: any) => (
          <DynamicFormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
          />
        ))}

        <Button
          colorScheme="blue"
          size="lg"
          w="full"
          onClick={handleSubmit}
          isDisabled={!category || Object.keys(formData).length === 0}
        >
          Save Specialized Item
        </Button>
      </VStack>
    </Box>
  );
}

function DynamicFormField({ field, value, onChange }: any) {
  switch (field.type) {
    case 'text':
      return (
        <FormControl isRequired={field.required}>
          <FormLabel>{field.label}</FormLabel>
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </FormControl>
      );
    
    case 'number':
      return (
        <FormControl isRequired={field.required}>
          <FormLabel>{field.label}</FormLabel>
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            min={field.min}
            max={field.max}
          />
        </FormControl>
      );
    
    case 'select':
      return (
        <FormControl isRequired={field.required}>
          <FormLabel>{field.label}</FormLabel>
          <Select value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select...</option>
            {field.options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
        </FormControl>
      );
    
    case 'boolean':
      return (
        <FormControl>
          <FormLabel>{field.label}</FormLabel>
          <Select value={value ? 'yes' : 'no'} onChange={(e) => onChange(e.target.value === 'yes')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </FormControl>
      );
    
    default:
      return null;
  }
}
```

### Day 3-4: Insurance Selector

**Create:** `apps/web/src/app/booking-luxury/components/specialized/InsuranceTierSelector.tsx`

```typescript
'use client';

import { useState } from 'react';
import { SimpleGrid, Card, CardHeader, CardBody, Heading, Text, Badge, VStack, HStack, Icon, Button } from '@chakra-ui/react';
import { FaCheck } from 'react-icons/fa';

const INSURANCE_TIERS = [
  {
    id: 'STANDARD',
    name: 'Standard',
    coverage: 5000,
    premium: 2.5,
    features: ['Basic coverage', 'Standard claims']
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    coverage: 25000,
    premium: 3.5,
    features: ['Enhanced coverage', 'Photo docs', 'Priority claims'],
    recommended: true
  },
  {
    id: 'PLATINUM',
    name: 'Platinum',
    coverage: 100000,
    premium: 4.5,
    features: ['Full replacement', 'Zero excess', '24/7 support']
  }
];

export function InsuranceTierSelector({ declaredValue, onSelect }: any) {
  const [selected, setSelected] = useState<string>('PREMIUM');

  return (
    <Box>
      <Heading size="md" mb={4}>Choose Insurance Coverage</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {INSURANCE_TIERS.map((tier) => (
          <Card
            key={tier.id}
            borderWidth={2}
            borderColor={selected === tier.id ? 'blue.500' : 'gray.200'}
            cursor="pointer"
            onClick={() => {
              setSelected(tier.id);
              onSelect(tier);
            }}
          >
            {tier.recommended && (
              <Badge position="absolute" top={-2} right={4} colorScheme="green">
                Recommended
              </Badge>
            )}
            
            <CardHeader>
              <Heading size="sm">{tier.name}</Heading>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                £{((declaredValue * tier.premium) / 100 / 100).toFixed(2)}
              </Text>
              <Text fontSize="xs" color="gray.600">
                Up to £{tier.coverage.toLocaleString()}
              </Text>
            </CardHeader>
            
            <CardBody>
              <VStack align="start" spacing={2}>
                {tier.features.map((feature) => (
                  <HStack key={feature} spacing={2}>
                    <Icon as={FaCheck} color="green.500" fontSize="sm" />
                    <Text fontSize="sm">{feature}</Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}
```

### Day 5: Integration with Booking Flow

**Update:** `apps/web/src/app/booking-luxury/components/WhereAndWhatStep.tsx`

Add detection for specialized items:

```typescript
// After user selects an item, check if it's specialized
const checkIfSpecialized = (itemId: string) => {
  const specializedCategories = [
    'grand_piano',
    'upright_piano',
    'antique',
    'fine_art'
  ];
  
  return specializedCategories.some(cat => 
    itemId.toLowerCase().includes(cat)
  );
};

// When item is added:
const handleAddItem = (item: any) => {
  const isSpecialized = checkIfSpecialized(item.id);
  
  if (isSpecialized) {
    // Show specialized wizard modal
    setShowSpecializedWizard(true);
    setCurrentSpecializedItem(item);
  } else {
    // Normal flow
    addItemToCart(item);
  }
};
```

---

## Testing Checklist

### Backend Tests
- [ ] Create specialized item via API
- [ ] Fetch workflow configuration
- [ ] Calculate insurance quote
- [ ] Required equipment calculation

### Frontend Tests
- [ ] Detect specialized item selection
- [ ] Show specialized wizard
- [ ] Dynamic form field rendering
- [ ] Insurance tier selector
- [ ] Complete booking with specialized item

### Integration Tests
- [ ] End-to-end specialized booking flow
- [ ] Pricing calculation with specialized multipliers
- [ ] Database records created correctly

---

## Launch Checklist

### Pre-Launch
- [ ] Seed specialized equipment in production DB
- [ ] Create workflow configs for top 5 categories
- [ ] Test on staging environment
- [ ] Train customer support team

### Launch Day
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Track conversion rates
- [ ] Collect user feedback

### Post-Launch (Week 1)
- [ ] Analyze specialized booking metrics
- [ ] Optimize form fields based on feedback
- [ ] Add more specialized categories
- [ ] Refine insurance pricing

---

## Quick Wins

**Start with these 3 specialized categories:**
1. **Upright Piano** - High demand, clear requirements
2. **Antique Furniture** - High margins, existing customer base
3. **Fine Art** - Premium segment, insurance upsell opportunity

**Defer to Phase 2:**
- Driver equipment verification (can be manual initially)
- Condition reporting (add after booking flow is stable)
- Advanced matching algorithm (use basic matching first)

---

## Support & Documentation

- **Technical Docs:** `SPECIALIZED_LOGISTICS_ROADMAP.md`
- **API Reference:** `/api/specialized-items` endpoints
- **Schema:** `SPECIALIZED_LOGISTICS_SCHEMA.prisma`
- **Migration:** `prisma/migrations/add_specialized_logistics.sql`

---

**Next Step:** Run database migration and start building API routes! 🚀
