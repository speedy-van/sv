#!/usr/bin/env ts-node
import fs from 'node:fs/promises';
import path from 'node:path';
import { UkPlace, PlacesIndex } from '@/data/places.schema';

/**
 * ONS/OS Data Ingest Script
 *
 * This script processes CSV data from Office for National Statistics (ONS)
 * and Ordnance Survey (OS) to create the places.json file.
 *
 * Features:
 * - CSV parsing and validation
 * - Population data integration
 * - Geographic coordinate validation
 * - Parent-child relationship detection
 * - Spatial indexing optimization
 */

interface RawPlaceData {
  name: string;
  type: string;
  county?: string;
  region: string;
  lat: number;
  lon: number;
  population?: number;
  postcode?: string;
  district?: string;
}

async function parseCSVData(filePath: string): Promise<RawPlaceData[]> {
  // TODO: Implement CSV parsing
  // - Read CSV file
  // - Parse headers and data
  // - Validate coordinates
  // - Clean and normalize names
  console.log(`Parsing CSV data from: ${filePath}`);

  // Placeholder return
  return [];
}

function detectParentChildRelationships(
  places: RawPlaceData[]
): Map<string, string> {
  const parentMap = new Map<string, string>();

  // TODO: Implement parent-child detection logic
  // - Use population thresholds
  // - Geographic proximity analysis
  // - Administrative boundaries
  // - Postcode analysis

  return parentMap;
}

function validateAndTransform(
  places: any[],
  parentMap: Map<string, string>
): UkPlace[] {
  const transformed: UkPlace[] = [];

  for (const place of places) {
    // Validate coordinates
    if (
      place.lat < -90 ||
      place.lat > 90 ||
      place.lon < -180 ||
      place.lon > 180
    ) {
      console.warn(
        `Invalid coordinates for ${place.name}: ${place.lat}, ${place.lon}`
      );
      continue;
    }

    // Validate place type
    const validTypes = [
      'city',
      'town',
      'village',
      'borough',
      'district',
      'neighbourhood',
    ];
    if (!validTypes.includes(place.type.toLowerCase())) {
      console.warn(`Invalid place type for ${place.name}: ${place.type}`);
      continue;
    }

    // Use existing slug if available, otherwise generate one
    const slug =
      place.slug ||
      place.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();

    if (slug.length === 0) {
      console.warn(`Could not generate slug for: ${place.name}`);
      continue;
    }

    const transformedPlace: UkPlace = {
      slug,
      name: place.name,
      type: place.type.toLowerCase() as any,
      county: place.county,
      region: place.region,
      lat: place.lat,
      lon: place.lon,
      population: place.population,
      parentSlug: place.parentSlug || parentMap.get(place.name),
    };

    transformed.push(transformedPlace);
  }

  return transformed;
}

async function main() {
  try {
    console.log('🚀 Starting places data generation...');

    // For now, use the sample data as the source
    const sampleDataPath = 'src/data/places.sample.json';
    const outputPath = 'src/data/places.json';

    // Read sample data
    const sampleData = JSON.parse(await fs.readFile(sampleDataPath, 'utf-8'));
    const rawPlaces = sampleData.places;

    console.log(`📊 Parsed ${rawPlaces.length} places`);

    // Transform and validate (using existing relationships from sample data)
    const transformedPlaces = validateAndTransform(rawPlaces, new Map());
    console.log(`✅ Transformed ${transformedPlaces.length} valid places`);

    // Create output structure
    const output: PlacesIndex = {
      updatedAt: new Date().toISOString(),
      total: transformedPlaces.length,
      places: transformedPlaces,
    };

    // Write to file
    await fs.writeFile(
      path.join(process.cwd(), outputPath),
      JSON.stringify(output, null, 2)
    );

    console.log(`💾 Data written to: ${outputPath}`);
    console.log(
      `🎯 Places generation complete! Generated ${transformedPlaces.length} place records`
    );

    // Summary statistics
    const typeCounts = transformedPlaces.reduce(
      (acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('\n📈 Place type distribution:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    const withPopulation = transformedPlaces.filter(p => p.population).length;
    console.log(
      `\n👥 Places with population data: ${withPopulation}/${transformedPlaces.length}`
    );
  } catch (error) {
    console.error('❌ Ingest failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { parseCSVData, detectParentChildRelationships, validateAndTransform };
