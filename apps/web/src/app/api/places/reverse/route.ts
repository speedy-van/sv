import { NextResponse } from 'next/server';

const TIMEOUT_MS = 3500;

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([
    p,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('UPSTREAM_TIMEOUT')), ms)
    ),
  ]);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');

  // Validate coordinates
  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Missing lat/lng parameters' },
      { status: 400 }
    );
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const token =
    process.env.MAPBOX_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    '';

  // If no token, fail-soft with basic data
  if (!token) {
    console.warn('[PLACES] Missing MAPBOX_TOKEN for reverse geocoding');
    return NextResponse.json({
      label: `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
      address: {
        line1: `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
        city: '',
        postcode: '',
      },
      coords: { lat: latNum, lng: lngNum },
    });
  }

  try {
    // Mapbox reverse geocoding endpoint
    const mbUrl = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngNum},${latNum}.json`
    );
    mbUrl.searchParams.set('access_token', token);
    mbUrl.searchParams.set('limit', '1');
    mbUrl.searchParams.set('types', 'address,poi');
    mbUrl.searchParams.set('language', 'en');

    const upstream = await withTimeout(
      fetch(mbUrl.toString(), { cache: 'no-store' }),
      TIMEOUT_MS
    );

    // Handle upstream errors gracefully
    if (!upstream.ok) {
      console.warn(
        '[PLACES] Reverse geocoding upstream error',
        upstream.status
      );
      return NextResponse.json({
        label: `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
        address: {
          line1: `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
          city: '',
          postcode: '',
        },
        coords: { lat: latNum, lng: lngNum },
      });
    }

    const data = (await upstream.json()) as any;

    function mapboxFeatureToAddress(f: any) {
      const ctx = Array.isArray(f?.context) ? f.context : [];
      const get = (prefix: string) =>
        ctx.find(
          (c: any) => typeof c?.id === 'string' && c.id.startsWith(prefix)
        )?.text || '';

      const postcode = f?.properties?.postcode || get('postcode');
      const city =
        get('place') ||
        get('locality') ||
        get('district') ||
        f?.properties?.place ||
        '';
      const number = f?.address || '';
      const street = f?.text || '';

      return {
        label: f?.place_name || `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
        address: {
          line1:
            [number, street].filter(Boolean).join(' ') ||
            f?.place_name?.split(',')[0] ||
            `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
          city,
          postcode,
        },
        coords: { lat: latNum, lng: lngNum },
      };
    }

    const feature = data?.features?.[0];
    const result = feature
      ? mapboxFeatureToAddress(feature)
      : {
          label: `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
          address: {
            line1: `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
            city: '',
            postcode: '',
          },
          coords: { lat: latNum, lng: lngNum },
        };

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (err: any) {
    // Timeouts, network errors → return basic data
    console.warn('[PLACES] Reverse geocoding exception', err?.message || err);
    return NextResponse.json({
      label: `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
      address: {
        line1: `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`,
        city: '',
        postcode: '',
      },
      coords: { lat: latNum, lng: lngNum },
    });
  }
}
