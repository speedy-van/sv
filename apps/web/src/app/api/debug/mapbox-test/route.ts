import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get('q') || 'London';

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg';

  if (!token) {
    return NextResponse.json({
      error: 'No Mapbox token found',
      token: 'NOT SET',
    });
  }

  try {
    // Test Mapbox API directly
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=GB&limit=3&types=address,poi&autocomplete=true&language=en`;

    console.log(
      `[MAPBOX TEST] Testing URL: ${mapboxUrl.replace(token, 'TOKEN_HIDDEN')}`
    );

    const response = await fetch(mapboxUrl);
    const data = await response.json();

    return NextResponse.json({
      success: true,
      query,
      token: token.substring(0, 10) + '...',
      responseStatus: response.status,
      responseOk: response.ok,
      mapboxData: data,
      featuresCount: data?.features?.length || 0,
      error: data?.message || null,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      token: token.substring(0, 10) + '...',
      query,
    });
  }
}
