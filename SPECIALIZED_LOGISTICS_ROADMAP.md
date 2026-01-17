# 🎯 Strategic Technical Roadmap: Dominating Specialized Local Logistics

**Version:** 1.0  
**Target Market:** UK Premium Local Moves (Pianos, Fine Art, Medical Equipment, Luxury Furniture)  
**Strategic Goal:** Become the de facto choice for high-value specialized local logistics

---

## 📊 Executive Summary

This roadmap transforms our platform from a general logistics provider to the UK's **premier specialized local logistics platform** by focusing on high-margin, high-trust services that generic competitors cannot replicate.

### Strategic Differentiators
- ✅ **Dynamic Specialized Workflows** - Item-specific data capture
- ✅ **Equipment-Based Driver Matching** - Verified specialized equipment
- ✅ **Visual Proof System** - White-glove condition reporting
- ✅ **Item-Specific Insurance** - Granular coverage options

### Market Opportunity
- **Target Segment:** £5k-£50k local moves
- **Profit Margin:** 35-45% (vs 15-20% standard)
- **Customer Lifetime Value:** 3.5x higher
- **Insurance Claims:** 70% reduction with proper documentation

---

## 🏗️ Phase 1: Database Schema & Data Models (Weeks 1-2)

### 1.1 Specialized Item Categories

Create new Prisma models for specialized item handling:

```prisma
// New specialized item categories
enum SpecializedItemCategory {
  PIANO_UPRIGHT
  PIANO_GRAND
  FINE_ART_PAINTING
  FINE_ART_SCULPTURE
  MEDICAL_EQUIPMENT
  ANTIQUE_FURNITURE
  LUXURY_FURNITURE
  FRAGILE_ELECTRONICS
  CUSTOM_SPECIALIZED
}

// Specialized item metadata
model SpecializedItem {
  id                    String                    @id @default(cuid())
  bookingItemId         String                    @unique
  category              SpecializedItemCategory
  
  // Technical specifications
  technicalSpecs        Json                      // Dynamic based on category
  handlingRequirements  String[]                  // Array of requirements
  requiredEquipment     String[]                  // Required equipment IDs
  
  // Risk & Value
  declaredValue         Int                       // Value in pence
  insuranceTier         InsuranceTier             @default(STANDARD)
  fragilityScore        Int                       @default(5) @db.SmallInt  // 1-10
  complexityScore       Int                       @default(5) @db.SmallInt  // 1-10
  
  // Environmental requirements
  temperatureControl    Boolean                   @default(false)
  humidityControl       Boolean                   @default(false)
  verticalTransport     Boolean                   @default(false)
  
  // Pre-move assessment
  requiresOnSiteVisit   Boolean                   @default(false)
  assessmentNotes       String?
  assessedBy            String?
  assessedAt            DateTime?
  
  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt
  
  BookingItem           BookingItem               @relation(fields: [bookingItemId], references: [id], onDelete: Cascade)
  ConditionReports      ConditionReport[]
  
  @@index([category, fragilityScore])
  @@index([insuranceTier, declaredValue])
}

// Insurance tiers
enum InsuranceTier {
  STANDARD      // Up to £5,000
  PREMIUM       // £5,000 - £25,000
  PLATINUM      // £25,000 - £100,000
  BESPOKE       // £100,000+
}

// Specialized equipment registry
model SpecializedEquipment {
  id                  String                   @id @default(cuid())
  name                String
  equipmentType       EquipmentType
  description         String?
  
  // Verification
  verificationRequired Boolean                  @default(true)
  certificationTypes   String[]                 // e.g., ["Piano Moving Cert", "Art Handler Cert"]
  
  // Capabilities
  maxWeight           Int?                      // kg
  suitableFor         SpecializedItemCategory[]
  
  // Cost implications
  dailyRentalCost     Int?                      // pence
  insurancePremium    Int?                      // pence
  
  createdAt           DateTime                  @default(now())
  updatedAt           DateTime                  @updatedAt
  
  DriverEquipment     DriverEquipment[]
  
  @@index([equipmentType])
}

enum EquipmentType {
  PIANO_DOLLY
  PIANO_BOARD
  TAIL_LIFT
  STAIR_CLIMBER
  ART_CRATE
  CLIMATE_CONTROLLED_VAN
  HYDRAULIC_LIFT
  NON_MARKING_STRAPS
  PROTECTIVE_BLANKETS
  SPECIALIZED_TROLLEY
}

// Driver equipment verification
model DriverEquipment {
  id                      String                @id @default(cuid())
  driverId                String
  equipmentId             String
  
  // Verification status
  verified                Boolean               @default(false)
  verifiedBy              String?               // Admin ID
  verifiedAt              DateTime?
  expiresAt               DateTime?             // For time-limited certifications
  
  // Evidence
  photoUrl                String?
  certificateUrl          String?
  serialNumber            String?
  
  // Operational
  isOperational           Boolean               @default(true)
  lastMaintenanceDate     DateTime?
  nextMaintenanceDate     DateTime?
  
  notes                   String?
  createdAt               DateTime              @default(now())
  updatedAt               DateTime              @updatedAt
  
  Driver                  Driver                @relation(fields: [driverId], references: [id], onDelete: Cascade)
  Equipment               SpecializedEquipment  @relation(fields: [equipmentId], references: [id])
  
  @@unique([driverId, equipmentId])
  @@index([driverId, verified, isOperational])
  @@index([equipmentId, verified])
}

// Pre-move condition reporting
model ConditionReport {
  id                    String              @id @default(cuid())
  specializedItemId     String
  bookingId             String
  reportType            ReportType          @default(PRE_MOVE)
  
  // Reporter information
  reportedBy            String              // Driver ID or Admin ID
  reportedAt            DateTime            @default(now())
  
  // Visual documentation
  photos                Json                // Array of {url, caption, timestamp, geoLocation}
  videoUrl              String?
  
  // Condition assessment
  overallCondition      ConditionGrade      @default(GOOD)
  damagePre             String[]            @default([])  // Pre-existing damage
  specialNotes          String?
  
  // Measurements (for high-value items)
  measurements          Json?               // {length, width, height, weight}
  
  // Customer acknowledgment
  customerSigned        Boolean             @default(false)
  customerSignature     String?             // Digital signature data
  customerSignedAt      DateTime?
  
  // Sync to customer dashboard
  syncedToCustomer      Boolean             @default(false)
  syncedAt              DateTime?
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  
  SpecializedItem       SpecializedItem     @relation(fields: [specializedItemId], references: [id], onDelete: Cascade)
  Booking               Booking             @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  
  @@index([bookingId, reportType])
  @@index([specializedItemId, reportType])
  @@index([reportedAt])
}

enum ReportType {
  PRE_MOVE
  POST_MOVE
  INCIDENT
}

enum ConditionGrade {
  EXCELLENT
  GOOD
  FAIR
  POOR
  DAMAGED
}

// Dynamic workflow configurations
model SpecializedWorkflow {
  id                    String                    @id @default(cuid())
  itemCategory          SpecializedItemCategory   @unique
  
  // Workflow definition
  workflowName          String
  requiredFields        Json                      // Dynamic form fields
  optionalFields        Json?
  
  // Business rules
  minInsuranceValue     Int                       // Minimum insurance in pence
  requiresPhotos        Boolean                   @default(true)
  requiresOnSiteVisit   Boolean                   @default(false)
  
  // Equipment requirements
  mandatoryEquipment    String[]                  // Equipment IDs
  recommendedEquipment  String[]                  
  
  // Pricing modifiers
  basePriceMultiplier   Float                     @default(1.0)
  insuranceMultiplier   Float                     @default(1.0)
  
  // Template content
  customerGuidance      String?                   // Guidance shown to customer
  driverInstructions    String?                   // Instructions for driver
  
  isActive              Boolean                   @default(true)
  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt
  
  @@index([itemCategory, isActive])
}
```

### 1.2 Update Existing Models

Add to `BookingItem` model:
```prisma
model BookingItem {
  // ... existing fields
  isSpecialized         Boolean              @default(false)
  SpecializedItem       SpecializedItem?
}
```

Add to `Driver` model:
```prisma
model Driver {
  // ... existing fields
  DriverEquipment       DriverEquipment[]
  specializations       SpecializedItemCategory[]  @default([])
  certifications        Json?                      // Array of certifications
}
```

Add to `Booking` model:
```prisma
model Booking {
  // ... existing fields
  hasSpecializedItems   Boolean              @default(false)
  specializedInsurance  Int?                 // Additional insurance in pence
  ConditionReports      ConditionReport[]
}
```

---

## 🎨 Phase 2: Dynamic Specialized Workflows (Weeks 3-4)

### 2.1 Category-Specific Form Modules

Create modular form components that adapt based on item selection:

**File:** `apps/web/src/app/booking-luxury/components/specialized/SpecializedItemWizard.tsx`

```typescript
type SpecializedFormModule = {
  category: SpecializedItemCategory;
  fields: DynamicField[];
  validationRules: ValidationRule[];
  helpContent: HelpContent;
};

// Example: Piano Module
const PIANO_UPRIGHT_MODULE: SpecializedFormModule = {
  category: 'PIANO_UPRIGHT',
  fields: [
    {
      name: 'pianoMake',
      type: 'text',
      label: 'Piano Make/Brand',
      required: true,
      placeholder: 'e.g., Yamaha, Steinway, Kawai'
    },
    {
      name: 'pianoAge',
      type: 'select',
      label: 'Approximate Age',
      options: ['0-10 years', '10-30 years', '30-50 years', '50+ years (Antique)'],
      required: true
    },
    {
      name: 'pianoHeight',
      type: 'number',
      label: 'Height (inches)',
      required: true,
      min: 40,
      max: 60
    },
    {
      name: 'pianoWeight',
      type: 'number',
      label: 'Estimated Weight (kg)',
      required: true,
      min: 150,
      max: 350,
      helpText: 'Typical upright pianos: 180-250kg'
    },
    {
      name: 'stairsRequired',
      type: 'boolean',
      label: 'Requires Stair Navigation?',
      required: true
    },
    {
      name: 'stairType',
      type: 'select',
      label: 'Staircase Type',
      options: ['Straight', 'Curved', 'Spiral', 'Multiple Turns'],
      dependsOn: 'stairsRequired',
      showWhen: true
    },
    {
      name: 'humidityControl',
      type: 'boolean',
      label: 'Requires Climate Control?',
      required: false,
      helpText: 'Recommended for antique or valuable pianos'
    },
    {
      name: 'declaredValue',
      type: 'currency',
      label: 'Declared Value (£)',
      required: true,
      min: 500,
      max: 100000,
      helpText: 'This determines your insurance coverage'
    },
    {
      name: 'lastTuned',
      type: 'date',
      label: 'Last Tuned Date (Optional)',
      required: false
    },
    {
      name: 'specialConditions',
      type: 'textarea',
      label: 'Special Conditions or Concerns',
      required: false,
      placeholder: 'Any scratches, repairs, or special handling notes...'
    }
  ],
  validationRules: [
    {
      field: 'pianoWeight',
      rule: 'If > 280kg, require on-site assessment'
    },
    {
      field: 'stairType',
      rule: 'If spiral or multiple turns, add complexity surcharge'
    },
    {
      field: 'declaredValue',
      rule: 'If > £10,000, require photo documentation'
    }
  ],
  helpContent: {
    title: 'Piano Moving Specialist Service',
    description: 'Our certified piano movers use specialized equipment including piano boards, dollies, and protective padding.',
    estimatedTime: '2-4 hours',
    equipmentUsed: ['Piano Board', 'Piano Dolly', 'Protective Blankets', 'Non-Marking Straps'],
    insuranceInfo: 'Comprehensive insurance up to declared value. All movements photographed.'
  }
};
```

### 2.2 Real-time Equipment Requirement Calculator

**File:** `apps/web/src/lib/specialized/equipment-calculator.ts`

```typescript
export function calculateRequiredEquipment(
  category: SpecializedItemCategory,
  specs: Record<string, any>
): RequiredEquipmentResult {
  const required: string[] = [];
  const recommended: string[] = [];
  const warnings: string[] = [];

  switch (category) {
    case 'PIANO_UPRIGHT':
      required.push('PIANO_DOLLY', 'PIANO_BOARD', 'NON_MARKING_STRAPS');
      
      if (specs.stairsRequired) {
        required.push('STAIR_CLIMBER');
      }
      
      if (specs.pianoWeight > 280) {
        required.push('HYDRAULIC_LIFT');
        warnings.push('Heavy piano requires 3-person crew');
      }
      
      if (specs.humidityControl) {
        recommended.push('CLIMATE_CONTROLLED_VAN');
      }
      
      if (specs.declaredValue > 10000) {
        recommended.push('PROTECTIVE_BLANKETS');
        warnings.push('High-value item - photo documentation mandatory');
      }
      break;

    case 'FINE_ART_PAINTING':
      required.push('ART_CRATE', 'PROTECTIVE_BLANKETS');
      recommended.push('CLIMATE_CONTROLLED_VAN');
      
      if (specs.dimensions?.diagonal > 200) {
        warnings.push('Large artwork may require specialized vehicle');
      }
      break;

    // ... other categories
  }

  return { required, recommended, warnings };
}
```

---

## 🎯 Phase 3: Equipment-Based Matching Algorithm (Weeks 5-6)

### 3.1 Enhanced Driver Matching

**File:** `apps/web/src/lib/matching/specialized-matcher.ts`

```typescript
interface SpecializedMatchingCriteria {
  requiredEquipment: string[];
  specializedCategory: SpecializedItemCategory;
  declaredValue: number;
  complexityScore: number;
  locationRadius: number;
}

export async function findSpecializedDrivers(
  criteria: SpecializedMatchingCriteria,
  availableDrivers: Driver[]
): Promise<ScoredDriver[]> {
  
  const scoredDrivers = await Promise.all(
    availableDrivers.map(async (driver) => {
      let score = 100; // Base score

      // Equipment verification (Critical - 40 points)
      const hasAllEquipment = await verifyDriverEquipment(
        driver.id,
        criteria.requiredEquipment
      );
      
      if (!hasAllEquipment.verified) {
        return null; // Exclude driver if missing critical equipment
      }
      
      score += hasAllEquipment.equipmentQuality * 20;

      // Specialization match (30 points)
      const hasSpecialization = driver.specializations?.includes(
        criteria.specializedCategory
      );
      
      if (hasSpecialization) {
        score += 30;
      } else {
        score -= 10; // Penalty for no specialization
      }

      // Experience with high-value items (15 points)
      const valueExperience = await getDriverValueExperience(driver.id);
      if (valueExperience.maxHandled >= criteria.declaredValue) {
        score += 15;
      }

      // Historical success rate (15 points)
      const successRate = await getSpecializedJobSuccessRate(
        driver.id,
        criteria.specializedCategory
      );
      score += successRate * 15;

      // Proximity (bonus, not critical)
      const distance = calculateDistance(driver.location, criteria.location);
      if (distance < criteria.locationRadius) {
        score += Math.max(0, 10 - distance);
      }

      return {
        driver,
        score,
        matchDetails: {
          equipment: hasAllEquipment,
          specialization: hasSpecialization,
          experience: valueExperience,
          successRate
        }
      };
    })
  );

  return scoredDrivers
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score)
    .slice(0, 5); // Top 5 matches
}

async function verifyDriverEquipment(
  driverId: string,
  requiredEquipment: string[]
): Promise<EquipmentVerification> {
  const driverEquipment = await prisma.driverEquipment.findMany({
    where: {
      driverId,
      equipmentId: { in: requiredEquipment },
      verified: true,
      isOperational: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    },
    include: {
      Equipment: true
    }
  });

  const hasAll = requiredEquipment.length === driverEquipment.length;
  
  // Quality score based on maintenance
  const avgQuality = driverEquipment.reduce((sum, eq) => {
    const daysSinceMaintenance = eq.lastMaintenanceDate
      ? differenceInDays(new Date(), eq.lastMaintenanceDate)
      : 365;
    
    return sum + Math.max(0, 1 - daysSinceMaintenance / 180);
  }, 0) / driverEquipment.length;

  return {
    verified: hasAll,
    equipmentQuality: avgQuality,
    missingEquipment: requiredEquipment.filter(
      id => !driverEquipment.find(eq => eq.equipmentId === id)
    )
  };
}
```

### 3.2 Admin Equipment Verification Flow

**API Route:** `apps/web/src/app/api/admin/driver-equipment/verify/route.ts`

```typescript
export async function POST(req: Request) {
  const session = await getServerSession();
  
  if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { driverId, equipmentId, photoUrl, certificateUrl, notes } = await req.json();

  // Verify equipment
  const verification = await prisma.driverEquipment.update({
    where: {
      driverId_equipmentId: {
        driverId,
        equipmentId
      }
    },
    data: {
      verified: true,
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
      photoUrl,
      certificateUrl,
      notes,
      // Set expiry based on equipment type
      expiresAt: calculateExpiryDate(equipmentId)
    }
  });

  // Log audit trail
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role,
      action: 'VERIFY_EQUIPMENT',
      targetType: 'DriverEquipment',
      targetId: verification.id,
      after: verification
    }
  });

  // Notify driver
  await sendDriverNotification(driverId, {
    type: 'EQUIPMENT_VERIFIED',
    title: 'Equipment Verified',
    message: `Your ${equipmentId} has been verified and you can now accept specialized jobs.`,
    priority: 'high'
  });

  return NextResponse.json({ success: true, verification });
}
```

---

## 📸 Phase 4: Visual Proof & Condition Reporting (Weeks 7-8)

### 4.1 Driver App - Pre-Move Condition Report

**Component:** `apps/driver-app/src/components/ConditionReportCapture.tsx`

```typescript
export function ConditionReportCapture({ specializedItemId, bookingId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [overallCondition, setOverallCondition] = useState<ConditionGrade>('GOOD');
  const [preExistingDamage, setPreExistingDamage] = useState<string[]>([]);

  const capturePhoto = async (type: PhotoType) => {
    // Use native camera API
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });

    // Get geolocation
    const position = await Geolocation.getCurrentPosition();

    const photoData: Photo = {
      id: generateId(),
      url: photo.webPath!,
      type,
      timestamp: new Date().toISOString(),
      location: {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      },
      caption: ''
    };

    setPhotos(prev => [...prev, photoData]);
  };

  const submitReport = async () => {
    // Upload photos to cloud storage
    const uploadedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const url = await uploadPhoto(photo.url, {
          folder: `condition-reports/${bookingId}`,
          metadata: {
            itemId: specializedItemId,
            timestamp: photo.timestamp,
            location: photo.location
          }
        });
        return { ...photo, url };
      })
    );

    // Create condition report
    const report = await fetch('/api/condition-reports', {
      method: 'POST',
      body: JSON.stringify({
        specializedItemId,
        bookingId,
        reportType: 'PRE_MOVE',
        photos: uploadedPhotos,
        overallCondition,
        damagePre: preExistingDamage,
        specialNotes: notes
      })
    });

    // Real-time sync to customer dashboard
    await syncToCustomerDashboard(bookingId, report.id);

    showToast('Condition report submitted successfully');
  };

  return (
    <Box>
      <Heading>Pre-Move Condition Report</Heading>
      
      {/* Guided photo capture */}
      <VStack spacing={4}>
        <PhotoCaptureButton
          label="Overall View"
          required
          onCapture={() => capturePhoto('OVERALL')}
        />
        <PhotoCaptureButton
          label="Close-up (Condition Details)"
          required
          onCapture={() => capturePhoto('DETAIL')}
        />
        <PhotoCaptureButton
          label="Serial/Model Number"
          onCapture={() => capturePhoto('SERIAL')}
        />
        <PhotoCaptureButton
          label="Pre-existing Damage (if any)"
          onCapture={() => capturePhoto('DAMAGE')}
        />
      </VStack>

      {/* Condition assessment */}
      <FormControl mt={6}>
        <FormLabel>Overall Condition</FormLabel>
        <Select
          value={overallCondition}
          onChange={(e) => setOverallCondition(e.target.value as ConditionGrade)}
        >
          <option value="EXCELLENT">Excellent - Like new</option>
          <option value="GOOD">Good - Normal wear</option>
          <option value="FAIR">Fair - Visible wear</option>
          <option value="POOR">Poor - Significant wear</option>
          <option value="DAMAGED">Damaged - Existing damage</option>
        </Select>
      </FormControl>

      {/* Pre-existing damage checklist */}
      <FormControl mt={4}>
        <FormLabel>Pre-existing Damage (Check all that apply)</FormLabel>
        <CheckboxGroup value={preExistingDamage} onChange={setPreExistingDamage}>
          <VStack align="start">
            <Checkbox value="SCRATCHES">Scratches</Checkbox>
            <Checkbox value="DENTS">Dents</Checkbox>
            <Checkbox value="CHIPS">Chips/Cracks</Checkbox>
            <Checkbox value="DISCOLORATION">Discoloration</Checkbox>
            <Checkbox value="STRUCTURAL">Structural Issues</Checkbox>
            <Checkbox value="MISSING_PARTS">Missing Parts</Checkbox>
          </VStack>
        </CheckboxGroup>
      </FormControl>

      <Button
        mt={6}
        colorScheme="blue"
        size="lg"
        onClick={submitReport}
        isDisabled={photos.length < 2}
      >
        Submit Condition Report
      </Button>
    </Box>
  );
}
```

### 4.2 Customer Dashboard - Real-time Report View

**Component:** `apps/web/src/components/customer/ConditionReportViewer.tsx`

```typescript
export function ConditionReportViewer({ bookingId }: Props) {
  const { data: reports, isLoading } = useQuery(
    ['condition-reports', bookingId],
    () => fetchConditionReports(bookingId),
    {
      refetchInterval: 10000 // Poll every 10 seconds
    }
  );

  return (
    <Card>
      <CardHeader>
        <Heading size="md">
          <Icon as={FaCamera} mr={2} />
          Item Condition Reports
        </Heading>
        <Text color="gray.600" mt={1}>
          Our White-Glove Service - Every step documented
        </Text>
      </CardHeader>

      <CardBody>
        {reports?.map((report) => (
          <Box key={report.id} mb={6} p={4} borderWidth={1} borderRadius="md">
            <HStack justify="space-between" mb={3}>
              <Badge colorScheme={getConditionColor(report.overallCondition)}>
                {report.overallCondition}
              </Badge>
              <Text fontSize="sm" color="gray.600">
                {formatDistanceToNow(new Date(report.reportedAt))} ago
              </Text>
            </HStack>

            {/* Photo gallery */}
            <SimpleGrid columns={2} spacing={2} mb={4}>
              {report.photos.map((photo) => (
                <Image
                  key={photo.id}
                  src={photo.url}
                  alt={photo.caption}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => openLightbox(photo)}
                />
              ))}
            </SimpleGrid>

            {/* Damage report */}
            {report.damagePre.length > 0 && (
              <Alert status="warning" mb={3}>
                <AlertIcon />
                <Box>
                  <AlertTitle>Pre-existing Conditions Noted:</AlertTitle>
                  <AlertDescription>
                    {report.damagePre.join(', ')}
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Special notes */}
            {report.specialNotes && (
              <Text fontSize="sm" color="gray.700">
                <strong>Driver Notes:</strong> {report.specialNotes}
              </Text>
            )}

            {/* Customer acknowledgment */}
            {!report.customerSigned && (
              <Button
                mt={4}
                colorScheme="green"
                onClick={() => signReport(report.id)}
              >
                Acknowledge & Sign Report
              </Button>
            )}
          </Box>
        ))}

        {reports?.length === 0 && (
          <EmptyState
            icon={FaCamera}
            title="No Reports Yet"
            description="Your driver will create a detailed condition report before moving your items."
          />
        )}
      </CardBody>
    </Card>
  );
}
```

---

## 🛡️ Phase 5: Specialized Insurance Integration (Weeks 9-10)

### 5.1 Insurance Tier Selector

**Component:** `apps/web/src/app/booking-luxury/components/specialized/InsuranceTierSelector.tsx`

```typescript
interface InsuranceTier {
  id: InsuranceTierEnum;
  name: string;
  coverage: number;
  premium: number; // % of declared value
  features: string[];
  recommended: boolean;
}

const INSURANCE_TIERS: InsuranceTier[] = [
  {
    id: 'STANDARD',
    name: 'Standard Coverage',
    coverage: 5000,
    premium: 2.5,
    features: [
      'Goods-in-transit insurance',
      'Basic damage protection',
      'Standard claims process'
    ],
    recommended: false
  },
  {
    id: 'PREMIUM',
    name: 'Premium Protection',
    coverage: 25000,
    premium: 3.5,
    features: [
      'Enhanced item-specific coverage',
      'Photo documentation included',
      'Priority claims processing',
      'Repair/restoration coverage'
    ],
    recommended: true
  },
  {
    id: 'PLATINUM',
    name: 'Platinum Care',
    coverage: 100000,
    premium: 4.5,
    features: [
      'Comprehensive specialist coverage',
      'Full replacement guarantee',
      'Expert restoration network',
      'Zero-excess claims',
      '24/7 dedicated claims line'
    ],
    recommended: false
  },
  {
    id: 'BESPOKE',
    name: 'Bespoke Coverage',
    coverage: Infinity,
    premium: 0, // Custom quote
    features: [
      'Tailored for unique items',
      'Fine art specialist underwriting',
      'Museum-grade handling',
      'Custom terms available'
    ],
    recommended: false
  }
];

export function InsuranceTierSelector({ declaredValue, onSelect }: Props) {
  const [selectedTier, setSelectedTier] = useState<InsuranceTierEnum | null>(null);

  const calculatePremium = (tier: InsuranceTier) => {
    if (tier.id === 'BESPOKE') return 'Custom Quote';
    const premium = (declaredValue * tier.premium) / 100;
    return `£${premium.toFixed(2)}`;
  };

  return (
    <Box>
      <Heading size="md" mb={4}>
        Choose Your Insurance Coverage
      </Heading>
      
      <Alert status="info" mb={6}>
        <AlertIcon />
        <Box>
          <AlertTitle>Item Declared Value: £{declaredValue.toLocaleString()}</AlertTitle>
          <AlertDescription>
            Select coverage that matches or exceeds your item's value
          </AlertDescription>
        </Box>
      </Alert>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        {INSURANCE_TIERS.map((tier) => (
          <Card
            key={tier.id}
            borderWidth={2}
            borderColor={selectedTier === tier.id ? 'blue.500' : 'gray.200'}
            cursor="pointer"
            onClick={() => {
              setSelectedTier(tier.id);
              onSelect(tier);
            }}
            position="relative"
            _hover={{ borderColor: 'blue.300', transform: 'translateY(-2px)' }}
            transition="all 0.2s"
          >
            {tier.recommended && (
              <Badge
                position="absolute"
                top={-2}
                right={4}
                colorScheme="green"
              >
                Recommended
              </Badge>
            )}

            <CardHeader>
              <Heading size="sm">{tier.name}</Heading>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600" mt={2}>
                {calculatePremium(tier)}
              </Text>
              <Text fontSize="xs" color="gray.600">
                Coverage up to £{tier.coverage.toLocaleString()}
              </Text>
            </CardHeader>

            <CardBody>
              <VStack align="start" spacing={2}>
                {tier.features.map((feature, idx) => (
                  <HStack key={idx} spacing={2}>
                    <Icon as={FaCheck} color="green.500" fontSize="sm" />
                    <Text fontSize="sm">{feature}</Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>

            {tier.id === 'BESPOKE' && (
              <CardFooter>
                <Text fontSize="xs" color="gray.600">
                  Contact us for a personalized quote
                </Text>
              </CardFooter>
            )}
          </Card>
        ))}
      </SimpleGrid>

      <Alert status="success" mt={6}>
        <AlertIcon />
        All insurance tiers include zero-excess damage protection when using our specialized equipment and following proper procedures.
      </Alert>
    </Box>
  );
}
```

### 5.2 Insurance API Integration

**API Route:** `apps/web/src/app/api/insurance/quote/route.ts`

```typescript
export async function POST(req: Request) {
  const { itemCategory, declaredValue, insuranceTier, additionalInfo } = await req.json();

  // Calculate base premium
  const basePremium = calculateBasePremium(declaredValue, insuranceTier);

  // Risk modifiers
  let riskModifier = 1.0;
  
  if (additionalInfo.stairsRequired) {
    riskModifier *= 1.15;
  }
  
  if (additionalInfo.complexityScore > 7) {
    riskModifier *= 1.25;
  }

  if (itemCategory === 'PIANO_GRAND' || itemCategory === 'FINE_ART_PAINTING') {
    riskModifier *= 1.3;
  }

  // Apply equipment discount (specialized equipment reduces risk)
  if (additionalInfo.useSpecializedEquipment) {
    riskModifier *= 0.85; // 15% discount
  }

  // Photo documentation discount
  if (additionalInfo.includePhotoDocumentation) {
    riskModifier *= 0.90; // 10% discount
  }

  const finalPremium = Math.round(basePremium * riskModifier);

  // Store quote for later reference
  const quote = await prisma.insuranceQuote.create({
    data: {
      itemCategory,
      declaredValue,
      insuranceTier,
      basePremium,
      riskModifier,
      finalPremium,
      validUntil: addDays(new Date(), 30),
      quoteData: additionalInfo
    }
  });

  return NextResponse.json({
    quoteId: quote.id,
    premium: finalPremium,
    coverage: getCoverageAmount(insuranceTier),
    breakdown: {
      base: basePremium,
      riskAdjustment: (riskModifier - 1) * 100,
      final: finalPremium
    },
    discountsApplied: {
      specializedEquipment: additionalInfo.useSpecializedEquipment,
      photoDocumentation: additionalInfo.includePhotoDocumentation
    }
  });
}
```

---

## 📱 Phase 6: Driver App Enhancements (Weeks 11-12)

### 6.1 Specialized Job Acceptance Flow

**Screen:** Driver app specialized job details with equipment checklist

```typescript
export function SpecializedJobDetailsScreen({ jobId }: Props) {
  const { data: job } = useQuery(['specialized-job', jobId], () => 
    fetchSpecializedJob(jobId)
  );

  const [equipmentChecklist, setEquipmentChecklist] = useState<Record<string, boolean>>({});

  const confirmEquipment = async () => {
    const allChecked = Object.values(equipmentChecklist).every(Boolean);
    
    if (!allChecked) {
      Alert.alert(
        'Missing Equipment',
        'You must have all required equipment to accept this specialized job.'
      );
      return;
    }

    await acceptJob(jobId, { equipmentConfirmed: true });
    navigation.navigate('ActiveJob', { jobId });
  };

  return (
    <ScrollView>
      <Card>
        <CardHeader>
          <Badge colorScheme="purple">SPECIALIZED JOB</Badge>
          <Heading size="lg" mt={2}>
            {job.specializedCategory.replace('_', ' ')}
          </Heading>
          <Text fontSize="xl" fontWeight="bold" color="green.600" mt={2}>
            £{job.earnings.toFixed(2)} (Premium Rate)
          </Text>
        </CardHeader>

        <CardBody>
          {/* Item details */}
          <Box mb={6}>
            <Heading size="sm" mb={3}>Item Details</Heading>
            <VStack align="start" spacing={2}>
              <DetailRow label="Category" value={job.itemName} />
              <DetailRow label="Declared Value" value={`£${job.declaredValue}`} />
              <DetailRow label="Complexity" value={`${job.complexityScore}/10`} />
            </VStack>
          </Box>

          {/* Required equipment checklist */}
          <Box mb={6} p={4} bg="blue.50" borderRadius="md">
            <Heading size="sm" mb={3}>
              <Icon as={FaCheckCircle} mr={2} />
              Required Equipment Checklist
            </Heading>
            <VStack align="start" spacing={3}>
              {job.requiredEquipment.map((equipment) => (
                <Checkbox
                  key={equipment.id}
                  isChecked={equipmentChecklist[equipment.id]}
                  onChange={(e) =>
                    setEquipmentChecklist(prev => ({
                      ...prev,
                      [equipment.id]: e.target.checked
                    }))
                  }
                >
                  <Text fontWeight="medium">{equipment.name}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {equipment.description}
                  </Text>
                </Checkbox>
              ))}
            </VStack>
          </Box>

          {/* Special instructions */}
          <Alert status="warning" mb={4}>
            <AlertIcon />
            <Box>
              <AlertTitle>Special Handling Required</AlertTitle>
              <AlertDescription>
                {job.specialInstructions}
              </AlertDescription>
            </Box>
          </Alert>

          {/* Insurance requirements */}
          <Box mb={6}>
            <Heading size="sm" mb={2}>Insurance Coverage</Heading>
            <Text>
              This job includes {job.insuranceTier} insurance coverage up to £{job.insuranceCoverage}.
              Photo documentation is mandatory.
            </Text>
          </Box>

          {/* Accept button */}
          <Button
            size="lg"
            colorScheme="green"
            w="full"
            onClick={confirmEquipment}
            isDisabled={!Object.values(equipmentChecklist).every(Boolean)}
          >
            Accept Specialized Job
          </Button>

          {!Object.values(equipmentChecklist).every(Boolean) && (
            <Text fontSize="sm" color="red.600" mt={2} textAlign="center">
              Please confirm you have all required equipment
            </Text>
          )}
        </CardBody>
      </Card>
    </ScrollView>
  );
}
```

---

## 📊 Phase 7: Analytics & Optimization (Ongoing)

### 7.1 Key Metrics to Track

```typescript
// Specialized job performance metrics
interface SpecializedMetrics {
  // Conversion rates
  quoteToBookingRate: number;          // Target: >35%
  specializedJobAcceptanceRate: number; // Target: >80%
  
  // Quality metrics
  averageConditionReportCompleteness: number; // Target: >95%
  customerSatisfactionScore: number;          // Target: >4.7/5
  insuranceClaimRate: number;                 // Target: <2%
  
  // Financial metrics
  averageJobValue: number;                    // Target: >£350
  profitMargin: number;                       // Target: >40%
  
  // Operational metrics
  averageJobDuration: number;
  equipmentUtilization: number;
  driverSpecializationCoverage: number;       // % of drivers with specializations
}
```

### 7.2 Continuous Improvement Loop

1. **Weekly Reviews**
   - Equipment verification turnaround time
   - Driver specialization adoption rate
   - Customer feedback on specialized services

2. **Monthly Analysis**
   - Insurance claim patterns by category
   - Pricing optimization for each specialized category
   - Equipment ROI analysis

3. **Quarterly Strategy**
   - Expand to new specialized categories
   - Partner with industry associations (Piano Movers UK, Fine Art Transporters)
   - Develop certification programs for drivers

---

## 🚀 Implementation Timeline

### Sprint 1-2 (Weeks 1-2): Foundation
- [ ] Database schema migrations
- [ ] API routes for specialized items
- [ ] Basic specialized workflow structure

### Sprint 3-4 (Weeks 3-4): Dynamic Workflows
- [ ] Category-specific form modules
- [ ] Equipment requirement calculator
- [ ] Customer-facing specialized booking flow

### Sprint 5-6 (Weeks 5-6): Driver Matching
- [ ] Enhanced matching algorithm
- [ ] Equipment verification system
- [ ] Admin verification interface

### Sprint 7-8 (Weeks 7-8): Visual Documentation
- [ ] Driver app condition reporting
- [ ] Customer dashboard real-time sync
- [ ] Photo storage and management

### Sprint 9-10 (Weeks 9-10): Insurance
- [ ] Insurance tier selector
- [ ] Quote calculation API
- [ ] Integration with payment flow

### Sprint 11-12 (Weeks 11-12): Driver App
- [ ] Specialized job acceptance flow
- [ ] Equipment checklist
- [ ] In-app guidance and instructions

### Sprint 13+ (Ongoing): Optimization
- [ ] Analytics dashboard
- [ ] A/B testing on pricing
- [ ] Continuous workflow refinement

---

## 💰 Expected ROI

### Investment
- **Development Time:** 12 weeks (1 senior dev + 1 mid-level dev)
- **Infrastructure:** Minimal (leverage existing)
- **Marketing:** £5k for specialized service launch

### Returns (Year 1 Projections)
- **Specialized Jobs:** 500/year @ £400 avg = £200k revenue
- **Profit Margin:** 40% = £80k gross profit
- **Insurance Upsells:** £25k additional revenue
- **Customer LTV Increase:** 3.5x multiplier on repeat bookings

**Break-even:** Month 4  
**Year 1 ROI:** 320%

---

## 🎯 Success Metrics (6-Month Targets)

1. **Market Penetration**
   - 25% of bookings include specialized items
   - 50% of drivers have at least one verified specialization
   - 15% premium on specialized job pricing accepted by market

2. **Quality Metrics**
   - <1% insurance claim rate
   - >4.8/5 customer satisfaction for specialized moves
   - >95% condition report completion rate

3. **Financial Metrics**
   - £150k+ revenue from specialized services
   - 42%+ profit margin on specialized jobs
   - 30% higher repeat booking rate for specialized customers

---

## 🛠️ Technical Debt & Considerations

### Must Address
- Photo storage costs (optimize compression, CDN)
- Real-time sync scalability (consider WebSocket alternative)
- Equipment verification workflow automation

### Future Enhancements
- AI-powered damage detection in photos
- Blockchain-based immutable condition records
- Partnerships with specialist insurance providers
- Augmented reality for pre-move measurements

---

## 📞 Next Steps

1. **Immediate:** Review and approve database schema changes
2. **Week 1:** Begin Sprint 1 with Prisma migrations
3. **Week 2:** Stakeholder demo of specialized workflow prototype
4. **Month 1:** Soft launch with pilot driver group (10 drivers)
5. **Month 2:** Full public launch with marketing campaign

---

**Document Owner:** Technical Team  
**Last Updated:** January 17, 2026  
**Status:** ✅ Ready for Implementation

