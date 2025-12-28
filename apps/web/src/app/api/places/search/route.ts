import { NextRequest, NextResponse } from 'next/server';
import places from '@/data/places.json';

interface Place {
  name: string;
  slug: string;
  type?: string;
  region: string;
  population?: number;
}

const allPlaces: Place[] = places.places as unknown as Place[];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ places: [], total: allPlaces.length });
  }

  const results = allPlaces
    .filter(place =>
      place.name.toLowerCase().includes(query) ||
      place.region.toLowerCase().includes(query)
    )
    .sort((a, b) => {
      // Prioritize exact matches at the start
      const aStartsWith = a.name.toLowerCase().startsWith(query);
      const bStartsWith = b.name.toLowerCase().startsWith(query);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Then by population
      return (b.population || 0) - (a.population || 0);
    })
    .slice(0, 10);

  return NextResponse.json({ places: results, total: allPlaces.length });
}
