// POST /api/admin/orders/[code]/fix-coordinates - Fix invalid coordinates for a booking
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg';

async function geocodeAddress(address: string, postcode: string): Promise<{lat: number, lng: number} | null> {
  try {
    const query = `${address}, ${postcode}, UK`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=GB&limit=1`;
    
    console.log(`🔍 Geocoding: ${query}`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      console.log(`✅ Found coordinates: ${lat}, ${lng}`);
      return { lat, lng };
    } else {
      console.log(`❌ No coordinates found for: ${query}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Geocoding error for ${address}:`, error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    console.log(`🔧 Fixing coordinates for booking: ${code}`);

    // Find the booking with its addresses
    const booking = await prisma.booking.findUnique({
      where: { reference: code },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const results = [];

    // Fix pickup address coordinates if invalid
    if (booking.pickupAddress && 
        (booking.pickupAddress.lat === 0 || booking.pickupAddress.lng === 0)) {
      
      console.log('🔧 Fixing pickup address coordinates...');
      const pickupCoords = await geocodeAddress(
        booking.pickupAddress.label,
        booking.pickupAddress.postcode || ''
      );
      
      if (pickupCoords) {
        await prisma.bookingAddress.update({
          where: { id: booking.pickupAddress.id },
          data: {
            lat: pickupCoords.lat,
            lng: pickupCoords.lng,
          }
        });
        
        results.push({
          type: 'pickup',
          address: booking.pickupAddress.label,
          oldCoords: { lat: booking.pickupAddress.lat, lng: booking.pickupAddress.lng },
          newCoords: pickupCoords,
          status: 'updated'
        });
      }
    } else {
      results.push({
        type: 'pickup',
        status: 'already_valid',
        coords: { lat: booking.pickupAddress?.lat, lng: booking.pickupAddress?.lng }
      });
    }

    // Fix dropoff address coordinates if invalid
    if (booking.dropoffAddress && 
        (booking.dropoffAddress.lat === 0 || booking.dropoffAddress.lng === 0)) {
      
      console.log('🔧 Fixing dropoff address coordinates...');
      const dropoffCoords = await geocodeAddress(
        booking.dropoffAddress.label,
        booking.dropoffAddress.postcode || ''
      );
      
      if (dropoffCoords) {
        await prisma.bookingAddress.update({
          where: { id: booking.dropoffAddress.id },
          data: {
            lat: dropoffCoords.lat,
            lng: dropoffCoords.lng,
          }
        });
        
        results.push({
          type: 'dropoff',
          address: booking.dropoffAddress.label,
          oldCoords: { lat: booking.dropoffAddress.lat, lng: booking.dropoffAddress.lng },
          newCoords: dropoffCoords,
          status: 'updated'
        });
      }
    } else {
      results.push({
        type: 'dropoff',
        status: 'already_valid',
        coords: { lat: booking.dropoffAddress?.lat, lng: booking.dropoffAddress?.lng }
      });
    }

    return NextResponse.json({
      success: true,
      booking: code,
      results
    });

  } catch (error) {
    console.error('❌ Error fixing coordinates:', error);
    return NextResponse.json(
      { error: 'Failed to fix coordinates' },
      { status: 500 }
    );
  }
}