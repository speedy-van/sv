import { PrismaClient, EquipmentType, SpecializedItemCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSpecializedLogistics() {
  console.log('🌱 Seeding Specialized Logistics data...');

  // Seed Specialized Equipment
  const equipmentData = [
    {
      name: 'Professional Piano Dolly',
      equipmentType: 'PIANO_DOLLY' as EquipmentType,
      description: 'Heavy-duty dolly designed specifically for piano transportation',
      verificationRequired: true,
      certificationTypes: ['Piano Moving Certification'],
      maxWeight: 500,
      suitableFor: ['PIANO_UPRIGHT', 'PIANO_GRAND'] as SpecializedItemCategory[],
      dailyRentalCost: 2500, // £25 in pence
      insurancePremium: 500 // £5 in pence
    },
    {
      name: 'Piano Board',
      equipmentType: 'PIANO_BOARD' as EquipmentType,
      description: 'Padded board for securing pianos during transport',
      verificationRequired: true,
      certificationTypes: ['Piano Moving Certification'],
      maxWeight: 600,
      suitableFor: ['PIANO_UPRIGHT', 'PIANO_GRAND'] as SpecializedItemCategory[],
      dailyRentalCost: 1500, // £15 in pence
      insurancePremium: 300
    },
    {
      name: 'Hydraulic Tail Lift',
      equipmentType: 'TAIL_LIFT' as EquipmentType,
      description: 'Hydraulic lift for loading/unloading heavy items',
      verificationRequired: true,
      certificationTypes: ['Tail Lift Operation License'],
      maxWeight: 1000,
      suitableFor: ['PIANO_GRAND', 'MEDICAL_EQUIPMENT', 'ANTIQUE_FURNITURE'] as SpecializedItemCategory[],
      dailyRentalCost: 5000, // £50 in pence
      insurancePremium: 1000
    },
    {
      name: 'Motorized Stair Climber',
      equipmentType: 'STAIR_CLIMBER' as EquipmentType,
      description: 'Powered device for moving heavy items up/down stairs',
      verificationRequired: true,
      certificationTypes: ['Stair Climber Certification'],
      maxWeight: 400,
      suitableFor: ['PIANO_UPRIGHT', 'MEDICAL_EQUIPMENT', 'ANTIQUE_FURNITURE'] as SpecializedItemCategory[],
      dailyRentalCost: 4000,
      insurancePremium: 800
    },
    {
      name: 'Custom Art Crate',
      equipmentType: 'ART_CRATE' as EquipmentType,
      description: 'Museum-grade protective crating for fine art',
      verificationRequired: true,
      certificationTypes: ['Art Handler Certification'],
      maxWeight: 300,
      suitableFor: ['FINE_ART_PAINTING', 'FINE_ART_SCULPTURE'] as SpecializedItemCategory[],
      dailyRentalCost: 6000,
      insurancePremium: 1500
    },
    {
      name: 'Climate-Controlled Van',
      equipmentType: 'CLIMATE_CONTROLLED_VAN' as EquipmentType,
      description: 'Temperature and humidity controlled vehicle',
      verificationRequired: true,
      certificationTypes: ['Specialized Transport License'],
      maxWeight: 2000,
      suitableFor: ['FINE_ART_PAINTING', 'FINE_ART_SCULPTURE', 'ANTIQUE_FURNITURE'] as SpecializedItemCategory[],
      dailyRentalCost: 15000, // £150
      insurancePremium: 3000
    },
    {
      name: 'Industrial Hydraulic Lift',
      equipmentType: 'HYDRAULIC_LIFT' as EquipmentType,
      description: 'Heavy-duty hydraulic lift system',
      verificationRequired: true,
      certificationTypes: ['Hydraulic Equipment License'],
      maxWeight: 1500,
      suitableFor: ['PIANO_GRAND', 'MEDICAL_EQUIPMENT'] as SpecializedItemCategory[],
      dailyRentalCost: 7500,
      insurancePremium: 1500
    },
    {
      name: 'Non-Marking Straps',
      equipmentType: 'NON_MARKING_STRAPS' as EquipmentType,
      description: 'Professional straps that won\'t damage finishes',
      verificationRequired: false,
      certificationTypes: [],
      maxWeight: 500,
      suitableFor: [
        'PIANO_UPRIGHT',
        'PIANO_GRAND',
        'LUXURY_FURNITURE',
        'ANTIQUE_FURNITURE'
      ] as SpecializedItemCategory[],
      dailyRentalCost: 500,
      insurancePremium: 100
    },
    {
      name: 'Protective Moving Blankets',
      equipmentType: 'PROTECTIVE_BLANKETS' as EquipmentType,
      description: 'Heavy-duty padded blankets for protection',
      verificationRequired: false,
      certificationTypes: [],
      maxWeight: null,
      suitableFor: [
        'PIANO_UPRIGHT',
        'PIANO_GRAND',
        'ANTIQUE_FURNITURE',
        'LUXURY_FURNITURE'
      ] as SpecializedItemCategory[],
      dailyRentalCost: 300,
      insurancePremium: 50
    },
    {
      name: 'Specialized Furniture Trolley',
      equipmentType: 'SPECIALIZED_TROLLEY' as EquipmentType,
      description: 'Multi-purpose heavy-duty trolley',
      verificationRequired: true,
      certificationTypes: ['Heavy Load Handling'],
      maxWeight: 800,
      suitableFor: [
        'ANTIQUE_FURNITURE',
        'LUXURY_FURNITURE',
        'MEDICAL_EQUIPMENT'
      ] as SpecializedItemCategory[],
      dailyRentalCost: 2000,
      insurancePremium: 400
    }
  ];

  console.log('Creating specialized equipment...');
  let equipmentCount = 0;
  for (const equipment of equipmentData) {
    const existing = await prisma.specializedEquipment.findFirst({
      where: { name: equipment.name }
    });

    if (!existing) {
      await prisma.specializedEquipment.create({
        data: equipment
      });
      equipmentCount++;
    }
  }
  console.log(`✅ Created ${equipmentCount} specialized equipment items`);

  // Seed Specialized Workflows
  const workflowData = [
    {
      itemCategory: 'PIANO_UPRIGHT' as SpecializedItemCategory,
      workflowName: 'Upright Piano Moving Service',
      requiredFields: JSON.stringify([
        { name: 'pianoMake', type: 'text', label: 'Piano Make/Brand', required: true },
        { name: 'pianoAge', type: 'select', label: 'Approximate Age', required: true, options: ['0-10 years', '10-30 years', '30-50 years', '50+ years (Antique)'] },
        { name: 'pianoHeight', type: 'number', label: 'Height (inches)', required: true, min: 40, max: 60 },
        { name: 'pianoWeight', type: 'number', label: 'Weight (kg)', required: true, min: 150, max: 350 },
        { name: 'stairsRequired', type: 'boolean', label: 'Requires Stairs?', required: true },
        { name: 'declaredValue', type: 'currency', label: 'Declared Value (£)', required: true, min: 500, max: 100000 }
      ]),
      minInsuranceValue: 50000, // £500 in pence
      requiresPhotos: true,
      requiresOnSiteVisit: false,
      mandatoryEquipment: ['PIANO_DOLLY', 'PIANO_BOARD', 'NON_MARKING_STRAPS'],
      recommendedEquipment: ['PROTECTIVE_BLANKETS'],
      basePriceMultiplier: 1.75,
      insuranceMultiplier: 1.2,
      customerGuidance: 'Our certified piano movers use specialized equipment to ensure your instrument is transported safely. All movements are documented with photos.',
      driverInstructions: 'Use piano board and dolly. Secure with non-marking straps. Take pre-move photos from all angles. Document serial number.',
      isActive: true
    },
    {
      itemCategory: 'PIANO_GRAND' as SpecializedItemCategory,
      workflowName: 'Grand Piano Moving Service',
      requiredFields: JSON.stringify([
        { name: 'pianoMake', type: 'text', label: 'Piano Make/Brand', required: true },
        { name: 'pianoLength', type: 'number', label: 'Length (feet)', required: true, min: 4, max: 9 },
        { name: 'pianoWeight', type: 'number', label: 'Weight (kg)', required: true, min: 200, max: 600 },
        { name: 'legRemoval', type: 'boolean', label: 'Leg Removal Required?', required: true },
        { name: 'declaredValue', type: 'currency', label: 'Declared Value (£)', required: true, min: 1000, max: 500000 }
      ]),
      minInsuranceValue: 100000, // £1000 in pence
      requiresPhotos: true,
      requiresOnSiteVisit: true,
      mandatoryEquipment: ['PIANO_DOLLY', 'PIANO_BOARD', 'HYDRAULIC_LIFT', 'NON_MARKING_STRAPS'],
      recommendedEquipment: ['PROTECTIVE_BLANKETS', 'TAIL_LIFT'],
      basePriceMultiplier: 2.5,
      insuranceMultiplier: 1.5,
      customerGuidance: 'Grand piano moves require 3+ crew members and specialized equipment. Legs will be carefully removed and padded. On-site assessment required.',
      driverInstructions: 'Minimum 3-person crew. Remove legs carefully and pad each one. Document serial number. Use hydraulic lift for loading. Take extensive photos.',
      isActive: true
    },
    {
      itemCategory: 'FINE_ART_PAINTING' as SpecializedItemCategory,
      workflowName: 'Fine Art Painting Transport',
      requiredFields: JSON.stringify([
        { name: 'artist', type: 'text', label: 'Artist Name (if known)', required: false },
        { name: 'dimensions', type: 'text', label: 'Dimensions (cm)', required: true },
        { name: 'framed', type: 'boolean', label: 'Is it framed?', required: true },
        { name: 'glassProtection', type: 'boolean', label: 'Glass front?', required: false },
        { name: 'declaredValue', type: 'currency', label: 'Declared Value (£)', required: true, min: 500, max: 1000000 }
      ]),
      minInsuranceValue: 50000,
      requiresPhotos: true,
      requiresOnSiteVisit: false,
      mandatoryEquipment: ['ART_CRATE', 'PROTECTIVE_BLANKETS'],
      recommendedEquipment: ['CLIMATE_CONTROLLED_VAN'],
      basePriceMultiplier: 2.0,
      insuranceMultiplier: 1.8,
      customerGuidance: 'Your artwork will be transported in museum-grade protective crating with climate control if needed. White-glove service included.',
      driverInstructions: 'Handle with white gloves only. Photograph from multiple angles including signature/marks. Use art crate. Avoid direct sunlight. Maintain stable temperature.',
      isActive: true
    },
    {
      itemCategory: 'ANTIQUE_FURNITURE' as SpecializedItemCategory,
      workflowName: 'Antique Furniture Transport',
      requiredFields: JSON.stringify([
        { name: 'furnitureType', type: 'text', label: 'Type of Furniture', required: true },
        { name: 'age', type: 'select', label: 'Approximate Age', required: true, options: ['Victorian (1837-1901)', 'Edwardian (1901-1910)', 'Art Deco (1920s-30s)', 'Mid-Century (1940s-60s)', 'Other (specify in notes)'] },
        { name: 'material', type: 'text', label: 'Primary Material', required: true },
        { name: 'dimensions', type: 'text', label: 'Dimensions (L x W x H cm)', required: true },
        { name: 'estimatedWeight', type: 'number', label: 'Estimated Weight (kg)', required: true },
        { name: 'declaredValue', type: 'currency', label: 'Declared Value (£)', required: true, min: 300, max: 500000 }
      ]),
      minInsuranceValue: 30000,
      requiresPhotos: true,
      requiresOnSiteVisit: false,
      mandatoryEquipment: ['PROTECTIVE_BLANKETS', 'NON_MARKING_STRAPS'],
      recommendedEquipment: ['SPECIALIZED_TROLLEY'],
      basePriceMultiplier: 1.6,
      insuranceMultiplier: 1.4,
      customerGuidance: 'Specialist antique furniture handlers will ensure your valuable piece is protected throughout transit.',
      driverInstructions: 'Document all existing wear, patina, and damage. Use soft blankets and non-marking straps. Avoid placing anything on top. No stacking.',
      isActive: true
    },
    {
      itemCategory: 'LUXURY_FURNITURE' as SpecializedItemCategory,
      workflowName: 'Luxury Furniture Transport',
      requiredFields: JSON.stringify([
        { name: 'brand', type: 'text', label: 'Brand/Designer', required: true },
        { name: 'furnitureType', type: 'text', label: 'Type of Furniture', required: true },
        { name: 'material', type: 'text', label: 'Primary Material', required: true },
        { name: 'finishType', type: 'select', label: 'Finish Type', required: true, options: ['High Gloss', 'Matte', 'Leather', 'Velvet', 'Fabric', 'Other'] },
        { name: 'declaredValue', type: 'currency', label: 'Declared Value (£)', required: true, min: 500, max: 100000 }
      ]),
      minInsuranceValue: 50000,
      requiresPhotos: true,
      requiresOnSiteVisit: false,
      mandatoryEquipment: ['PROTECTIVE_BLANKETS', 'NON_MARKING_STRAPS'],
      recommendedEquipment: ['SPECIALIZED_TROLLEY'],
      basePriceMultiplier: 1.5,
      insuranceMultiplier: 1.3,
      customerGuidance: 'Premium white-glove service for your designer furniture. Professional wrapping and protection included.',
      driverInstructions: 'Use premium protective blankets. Document finish condition carefully. Avoid scratches on high-gloss surfaces. Handle with extreme care.',
      isActive: true
    }
  ];

  console.log('Creating specialized workflows...');
  let workflowCount = 0;
  for (const workflow of workflowData) {
    const existing = await prisma.specializedWorkflow.findUnique({
      where: { itemCategory: workflow.itemCategory }
    });

    if (!existing) {
      await prisma.specializedWorkflow.create({
        data: workflow
      });
      workflowCount++;
    }
  }
  console.log(`✅ Created ${workflowCount} specialized workflows`);

  console.log('✨ Specialized Logistics seeding completed!');
}

async function main() {
  try {
    await seedSpecializedLogistics();
  } catch (error) {
    console.error('❌ Error seeding specialized logistics:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
