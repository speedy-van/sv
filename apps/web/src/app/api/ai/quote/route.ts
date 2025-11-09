import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const quoteSchema = z.object({
  pickupAddress: z.string().min(3).optional().default('Not specified'),
  pickupPostcode: z.string().optional(),
  dropoffAddress: z.string().min(3).optional().default('Not specified'),
  dropoffPostcode: z.string().optional(),
  numberOfRooms: z.number().min(0).max(20).default(1),
  specialItems: z.array(z.string()).optional().default([]),
  movingDate: z.string().optional(),
  vehicleType: z.enum(['small', 'medium', 'large', 'luton']).optional(),
  distance: z.number().optional(),
});

// Simplified pricing calculator for AI bot
function calculateQuote(data: z.infer<typeof quoteSchema>) {
  // Determine vehicle type based on rooms if not specified
  let vehicleType = data.vehicleType;
  if (!vehicleType) {
    if (data.numberOfRooms <= 2) vehicleType = 'small';
    else if (data.numberOfRooms <= 3) vehicleType = 'medium';
    else if (data.numberOfRooms <= 4) vehicleType = 'large';
    else vehicleType = 'luton';
  }

  // Vehicle base rates per hour
  const vehicleRates: Record<string, number> = {
    small: 35,
    medium: 45,
    large: 55,
    luton: 65,
  };

  const baseRate = vehicleRates[vehicleType];
  
  // Estimate distance (default 15 miles if not provided)
  const estimatedDistance = data.distance || 15;
  
  // Calculate estimated time (room loading + travel)
  const loadingTime = data.numberOfRooms * 0.75; // 45 min per room
  const travelTime = estimatedDistance / 25; // Average 25 mph in city
  const totalHours = Math.max(2, loadingTime + travelTime); // Minimum 2 hours
  
  // Calculate base cost
  let baseCost = baseRate * totalHours;
  
  // Add distance charge (£1.5 per mile after 10 miles)
  if (estimatedDistance > 10) {
    baseCost += (estimatedDistance - 10) * 1.5;
  }
  
  // Determine if helpers are needed
  const needsHelpers = data.numberOfRooms >= 2 || 
                      data.specialItems.some(item => 
                        item.toLowerCase().includes('piano') || 
                        item.toLowerCase().includes('heavy') ||
                        item.toLowerCase().includes('furniture')
                      );
  
  const helpers = needsHelpers ? 2 : 0;
  const helpersCost = helpers * 15 * totalHours; // £15 per helper per hour
  
  // Calculate special items cost
  let specialItemsCost = 0;
  if (data.specialItems && data.specialItems.length > 0) {
    data.specialItems.forEach(item => {
      const itemLower = item.toLowerCase();
      if (itemLower.includes('piano')) specialItemsCost += 75;
      else if (itemLower.includes('antique')) specialItemsCost += 40;
      else if (itemLower.includes('heavy')) specialItemsCost += 25;
      else specialItemsCost += 15;
    });
  }
  
  // Calculate subtotal
  const subtotal = baseCost + helpersCost + specialItemsCost;
  
  // Add VAT (20%)
  const vat = subtotal * 0.2;
  const total = subtotal + vat;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(total * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    basePrice: Math.round(baseCost * 100) / 100,
    helpersCost: Math.round(helpersCost * 100) / 100,
    specialItemsCost: Math.round(specialItemsCost * 100) / 100,
    vehicleType,
    estimatedDuration: `${Math.ceil(totalHours)} - ${Math.ceil(totalHours + 0.5)} hours`,
    helpers,
    distance: estimatedDistance,
    needsHelpers,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = quoteSchema.parse(body);

    // Calculate quote
    const quote = calculateQuote(validated);
    
    // Vehicle type mapping for display
    const vehicleMapping: Record<string, string> = {
      small: 'Small Van',
      medium: 'Medium Van',
      large: 'Large Van',
      luton: 'Luton Van',
    };

    // Format response for AI bot
    return NextResponse.json({
      success: true,
      quote: {
        ...quote,
        vehicleType: vehicleMapping[quote.vehicleType],
        currency: 'GBP',
      },
      details: {
        pickupAddress: validated.pickupAddress,
        dropoffAddress: validated.dropoffAddress,
        numberOfRooms: validated.numberOfRooms,
        specialItems: validated.specialItems,
        movingDate: validated.movingDate,
      },
      recommendations: {
        vehicleType: vehicleMapping[quote.vehicleType],
        helpersRecommended: quote.needsHelpers ? 'Yes - recommended for smooth moving' : 'No - van driver can handle',
        estimatedTime: quote.estimatedDuration,
      },
    });

  } catch (error: any) {
    console.error('❌ AI Quote calculation error:', error);
    
    if (error instanceof z.ZodError) {
      const missingFields = error.errors.map(e => e.path.join('.')).join(', ');
      console.error('Missing/invalid fields:', missingFields);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid quote data', 
          message: `Please provide valid data. Missing or invalid: ${missingFields}`,
          details: error.errors,
          hint: 'Required: numberOfRooms (number). Optional: pickupAddress, dropoffAddress, specialItems, vehicleType, distance'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate quote',
        message: 'Unable to calculate quote. Please ensure all required information is provided.',
        hint: 'Send: { numberOfRooms: 2, pickupAddress: "London", dropoffAddress: "Manchester" }'
      },
      { status: 500 }
    );
  }
}

// Add GET endpoint for documentation
export async function GET() {
  return NextResponse.json({
    service: 'AI Quote Calculator',
    version: '1.0',
    endpoint: 'POST /api/ai/quote',
    requiredFields: {
      numberOfRooms: 'number (0-20)',
    },
    optionalFields: {
      pickupAddress: 'string (min 3 chars)',
      dropoffAddress: 'string (min 3 chars)',
      pickupPostcode: 'string',
      dropoffPostcode: 'string',
      specialItems: 'array of strings',
      movingDate: 'string (ISO date)',
      vehicleType: 'small | medium | large | luton',
      distance: 'number (miles)',
    },
    example: {
      numberOfRooms: 2,
      pickupAddress: 'London',
      dropoffAddress: 'Manchester',
      specialItems: ['Piano', 'Large Sofa'],
      vehicleType: 'medium'
    }
  });
}


