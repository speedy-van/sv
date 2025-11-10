import {
  PlacesIndex,
  PlacesIndexSchema,
  UkPlace,
} from '@/data/places.schema';
import { APP_BASE_URL } from '@/lib/seo/constants';

export type UkPlaceType = 'city' | 'town' | 'village' | 'borough' | 'district' | 'neighbourhood';

// Edge runtime compatible data loading
let raw: any = null;
let dataPromise: Promise<any> | null = null;

async function loadData(): Promise<any> {
  if (raw) return raw;
  if (dataPromise) return dataPromise;

  dataPromise = (async () => {
    try {
      // Dynamic import for edge runtime compatibility
      const placesModule = await import('@/data/places.json');
      raw = placesModule.default;
      return raw;
    } catch {
      try {
        const sampleModule = await import('@/data/places.sample.json');
        raw = sampleModule.default;
        return raw;
      } catch (error) {
        console.error('Error loading places data:', error);
        // Fallback to empty data structure
        raw = { places: [], updatedAt: new Date().toISOString() };
        return raw;
      }
    }
  })();

  return dataPromise;
}

type DBShape = {
  all: UkPlace[];
  bySlug: Map<string, UkPlace>;
  buckets: Map<string, UkPlace[]>;
  updatedAt: string;
};

const BUCKET_SIZE = 0.5; // degrees; balance between accuracy and performance

function bucketKey(lat: number, lon: number) {
  const by = (x: number, size: number) => Math.floor(x / size) * size;
  return `${by(lat, BUCKET_SIZE).toFixed(1)}_${by(lon, BUCKET_SIZE).toFixed(1)}`;
}

function haversine(a: UkPlace, b: UkPlace) {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat),
    lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const _load = async (): Promise<DBShape> => {
  let data: any = null;
  
  try {
    data = await loadData();
    
    // Validate data structure before parsing
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data structure received');
    }
    
    const parsed = PlacesIndexSchema.parse(data as unknown as PlacesIndex);
    const all = parsed.places || [];
    const bySlug = new Map(all.map((p: any) => [p.slug, p]));
    const buckets = new Map<string, UkPlace[]>();
    
    for (const p of all) {
      if (p && typeof p.lat === 'number' && typeof p.lon === 'number') {
        const key = bucketKey(p.lat, p.lon);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(p);
      }
    }
    
    return { 
      all, 
      bySlug: bySlug as Map<string, UkPlace>, 
      buckets, 
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading places data:', error);
    console.error('Data received:', typeof data, Array.isArray(data) ? data.length : 'not array');
    
    // Fallback to empty data structure
    return {
      all: [],
      bySlug: new Map(),
      buckets: new Map(),
      updatedAt: new Date().toISOString(),
    };
  }
};

// Edge runtime compatible caching
let _cachedDB: DBShape | null = null;
let _cachePromise: Promise<DBShape> | null = null;

async function _getCachedDB(): Promise<DBShape> {
  if (_cachedDB) return _cachedDB;
  if (_cachePromise) return _cachePromise;

  _cachePromise = _load();
  _cachedDB = await _cachePromise;
  return _cachedDB;
}

// Edge runtime compatible async wrapper
export const getDB = async (): Promise<DBShape> => {
  return _getCachedDB();
};

export async function getAllPlaces(): Promise<UkPlace[]> {
  try {
    const db = await getDB();
    if (db && db.all && Array.isArray(db.all)) {
      return db.all;
    }
    // Fallback to synchronous loading
    return (await _getCachedDB()).all;
  } catch (error) {
    console.error('Error getting all places:', error);
    // Return empty array as final fallback to prevent build failures
    try {
      return (await _getCachedDB()).all;
    } catch (fallbackError) {
      console.error('Fallback loading also failed:', fallbackError);
      return [];
    }
  }
}

export async function getPlaceBySlug(slug: string): Promise<UkPlace | null> {
  try {
    const db = await getDB();
    if (db && db.bySlug && typeof db.bySlug.get === 'function') {
      return db.bySlug.get(slug) || null;
    }
    // Fallback to synchronous loading
    const fallbackDb = await _getCachedDB();
    return fallbackDb.bySlug.get(slug) || null;
  } catch (error) {
    console.error('Error getting place by slug:', error);
    // Fallback to synchronous loading
    const fallbackDb = await _getCachedDB();
    return fallbackDb.bySlug.get(slug) || null;
  }
}

export async function getNearbyPlaces(
  place: UkPlace,
  limit = 12
): Promise<UkPlace[]> {
  try {
    const db = await getDB();
    if (db && db.buckets && typeof db.buckets.get === 'function') {
      return _getNearbyPlacesFromDB(db, place, limit);
    }
    // Fallback to synchronous loading
    const fallbackDb = await _getCachedDB();
    return _getNearbyPlacesFromDB(fallbackDb, place, limit);
  } catch (error) {
    console.error('Error getting nearby places:', error);
    // Fallback to synchronous loading
    const fallbackDb = await _getCachedDB();
    return _getNearbyPlacesFromDB(fallbackDb, place, limit);
  }
}

function _getNearbyPlacesFromDB(
  db: DBShape,
  place: UkPlace,
  limit: number
): UkPlace[] {
  // collect neighbors from 9 buckets (cell + surrounding)
  const latSteps = [-1, 0, 1],
    lonSteps = [-1, 0, 1];
  const candidates: UkPlace[] = [];
  for (const i of latSteps)
    for (const j of lonSteps) {
      const key = bucketKey(
        place.lat + i * BUCKET_SIZE,
        place.lon + j * BUCKET_SIZE
      );
      const arr = db.buckets.get(key);
      if (arr) candidates.push(...arr);
    }
  const scored = candidates
    .filter(p => p.slug !== place.slug)
    .map(p => {
      const dKm = haversine(place, p);
      const pop = (p as any).population ?? 1000;
      // simple weighting: closer + more popular
      const score = dKm + 500000 / pop; // smaller is better
      return { p, dKm, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit * 2); // buffer
  // directional variety (north/south/east/west)
  const bucketsDir = { N: [], S: [], E: [], W: [] } as Record<
    string,
    { p: UkPlace; dKm: number }[]
  >;
  for (const s of scored) {
    const dir = s.p.lat >= place.lat ? 'N' : 'S';
    const dir2 = s.p.lon >= place.lon ? 'E' : 'W';
    bucketsDir[dir].push(s);
    bucketsDir[dir2].push(s);
  }
  const mixed: UkPlace[] = [];
  const pool = [...scored];
  while (mixed.length < limit && pool.length) {
    mixed.push(pool.shift()!.p);
  }
  // light shuffle to prevent fingerprinting
  for (let i = mixed.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
  }
  return mixed.slice(0, limit);
}

export function canonicalFor(place: UkPlace): string {
  if ((place as any).population && (place as any).population < 10000 && (place as any).parentSlug) {
    return `${APP_BASE_URL}/uk/${(place as any).parentSlug}`;
  }
  return `${APP_BASE_URL}/uk/${place.slug}`;
}

export function routeSlug(from: UkPlace, to: UkPlace) {
  return `/routes/${from.slug}-to-${to.slug}`;
}

// Additional utility functions for enhanced functionality
export async function getPlacesByRegion(region: string): Promise<UkPlace[]> {
  const all = await getAllPlaces();
  return all.filter(p => p.region === region);
}

export async function getPlacesByType(type: UkPlaceType): Promise<UkPlace[]> {
  const all = await getAllPlaces();
  return all.filter(p => (p as any).type === type);
}

export async function searchPlaces(query: string): Promise<UkPlace[]> {
  const all = await getAllPlaces();
  const q = query.toLowerCase();
  return all.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      (p as any).county?.toLowerCase().includes(q) ||
      p.region?.toLowerCase().includes(q)
  );
}
