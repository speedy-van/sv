import { NextResponse } from 'next/server';
import { ukAddressDatabase, ukAddressUtils } from '@/lib/uk-address-database';
import { royalMailPAFService, pafUtils } from '@/lib/royal-mail-paf-service';

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
  const q = (url.searchParams.get('q') || '').trim();
  const country = url.searchParams.get('country') || 'GB';
  const limit = Number(url.searchParams.get('limit') || '7');

  // Allow shorter queries for postcodes and specific searches
  if (q.length < 2) {
    return NextResponse.json([], { status: 200, headers: nocache() });
  }

  const token =
    process.env.MAPBOX_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    '';

  // If no token, fail-soft with empty data (200)
  if (!token) {
    console.warn('[PLACES] Missing MAPBOX_TOKEN');
    return NextResponse.json([], { status: 200, headers: nocache() });
  }

  // Check if query looks like a postcode and adjust search parameters
  const isPostcodeQuery = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(q);
  const isPartialPostcode = /^[A-Z]{1,2}[0-9]/i.test(q) && q.length >= 3;
  const isPostcodeLike = /^[A-Z]{1,2}[0-9]/i.test(q) || /^[0-9][A-Z]{2}$/i.test(q);

  // Try Royal Mail PAF first for UK postcodes (like Confused.com)
  if (isPostcodeQuery || isPartialPostcode || isPostcodeLike) {
    try {
      console.log('[PLACES] Using Royal Mail PAF for postcode:', q);
      
      const pafResults = await royalMailPAFService.searchAddresses(q, {
        limit: Math.max(1, Math.min(10, limit)),
        includeSubBuildings: true
      });

      if (pafResults.length > 0) {
        console.log(`[PLACES] PAF found ${pafResults.length} results for postcode ${q}`);
        
        // Convert PAF results to expected format
        const suggestions = pafResults.map(result => ({
          id: result.id,
          text: result.text,
          place_name: result.description,
          center: [result.coordinates.lng, result.coordinates.lat],
          context: [],
          properties: {
            accuracy: 'high',
            address: result.text
          },
          icon: result.address.buildingType === 'house' ? '🏠' : 
                result.address.buildingType === 'flat' ? '🏢' : '🏬',
          type: 'address',
          formatted_address: result.description,
          postcode: result.postcode,
          provider: result.source,
          address: {
            line1: result.address.line1,
            line2: result.address.line2,
            line3: result.address.line3,
            city: result.address.city,
            postcode: result.address.postcode,
            county: result.address.county,
            country: 'GB',
            full_address: result.description,
            building_type: result.address.buildingType,
            sub_building: result.address.subBuilding
          },
          coords: result.coordinates,
          priority: 10, // Highest priority for PAF results
          isPostcodeMatch: true,
          hasCompleteAddress: true,
          confidence: result.confidence,
          source: 'paf'
        }));

        return NextResponse.json(suggestions, {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=600',
            'X-PAF-Provider': 'paf',
            'X-PAF-Results-Count': suggestions.length.toString()
          }
        });
      }
    } catch (error) {
      console.warn('[PLACES] PAF search failed, falling back to Mapbox:', error);
    }
  }

  try {
    // Classic, stable Mapbox endpoint (fallback)
    const mbUrl = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
    );
    mbUrl.searchParams.set('access_token', token);
    mbUrl.searchParams.set('limit', String(Math.max(1, Math.min(10, limit))));
    mbUrl.searchParams.set('country', country);

    console.log('[PLACES] Postcode detection:', {
      q,
      isPostcodeQuery,
      isPartialPostcode,
      isPostcodeLike,
    });

    if (isPostcodeQuery || isPartialPostcode || isPostcodeLike) {
      // For postcode searches, prioritize actual building addresses with full details
      mbUrl.searchParams.set('types', 'address,poi,place');
      mbUrl.searchParams.set('autocomplete', 'true'); // Keep autocomplete for partial postcodes

      // For postcode searches, we want to get more results and be more flexible
      mbUrl.searchParams.set('limit', '25'); // Increase limit for postcode searches

      // Add proximity bias for UK if it's a postcode search
      if (country === 'GB') {
        // Use London as default center for UK searches
        mbUrl.searchParams.set('proximity', '-0.1276,51.5074');
      }
    } else {
      // For general address searches, focus on specific building addresses
      mbUrl.searchParams.set('types', 'address,poi');
      mbUrl.searchParams.set('autocomplete', 'true');
    }

    mbUrl.searchParams.set('language', 'en');

    // Optional proximity bias (lng,lat)
    const prox = url.searchParams.get('proximity');
    if (prox && /-?\d+\.?\d*,\s*-?\d+\.?\d*/.test(prox)) {
      mbUrl.searchParams.set('proximity', prox);
    }

    const upstream = await withTimeout(
      fetch(mbUrl.toString(), { cache: 'no-store' }),
      TIMEOUT_MS
    );

    // Handle upstream errors & rate limits gracefully
    const ok = (upstream as Response).ok;
    const status = (upstream as Response).status;

    if (!ok) {
      // 429 or 5xx → return empty suggestions with 200 so UI doesn’t explode
      console.warn('[PLACES] Upstream error', status);
      return NextResponse.json([], { status: 200, headers: softCache() });
    }

    const data = (await (upstream as Response).json()) as any;

    // Debug logging
    console.log('[PLACES] Query:', q);
    console.log(
      '[PLACES] Is postcode search:',
      isPostcodeQuery || isPartialPostcode || isPostcodeLike
    );
    console.log('[PLACES] Raw Mapbox response:', JSON.stringify(data, null, 2));

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

      // Enhanced address building logic for complete addresses
      let line1 = '';
      let line2 = '';

      // For postcode searches, prioritize building-specific information
      if (isPostcodeQuery || isPartialPostcode || isPostcodeLike) {
        // Try to get building name from properties first
        const buildingName =
          f?.properties?.name ||
          f?.properties?.building ||
          f?.properties?.amenity ||
          f?.properties?.category;

        // Build complete address with house number and street
        if (number && street) {
          line1 = `${number} ${street}`.trim();
          if (buildingName && buildingName !== city && buildingName !== postcode) {
            line2 = buildingName;
          }
        } else if (buildingName && buildingName !== city && buildingName !== postcode) {
          line1 = buildingName;
          if (number && street) {
            line2 = `${number} ${street}`.trim();
          }
        } else if (street) {
          line1 = street;
          if (number) {
            line1 = `${number} ${street}`.trim();
          }
        } else {
          // Fallback to place_name parsing
          const parts = f?.place_name?.split(',') || [];
          if (parts.length > 0) {
            line1 = parts[0].trim();
          }
        }
      } else {
        // For general address searches, use standard logic
        if (number && street) {
          line1 = `${number} ${street}`.trim();
        } else if (street) {
          line1 = street;
        } else {
          // Extract from place_name
          const parts = f?.place_name?.split(',') || [];
          if (parts.length > 0) {
            line1 = parts[0].trim();
          }
        }
      }

      // Final fallback for incomplete addresses
      if (!line1 || line1.length < 3) {
        line1 = f?.place_name || '';
      }

      // Clean up the address
      line1 = line1.trim();
      line2 = line2.trim();

      // For postcode searches, prioritize results that actually contain the postcode
      const queryLower = q.toLowerCase();
      const postcodeLower = postcode?.toLowerCase() || '';
      const cityLower = city?.toLowerCase() || '';
      const line1Lower = line1?.toLowerCase() || '';

      // Enhanced priority system for better address accuracy
      let priority = 0;
      let isPostcodeMatch = false;
      let hasCompleteAddress = false;

      // Check if we have a complete address (house number + street)
      hasCompleteAddress = !!(number && street && line1.length > 5);

      if (isPostcodeQuery || isPartialPostcode || isPostcodeLike) {
        // Check if postcode contains the query or vice versa
        isPostcodeMatch =
          postcodeLower.includes(queryLower) ||
          queryLower.includes(postcodeLower);

        if (isPostcodeMatch) {
          // For exact postcode matches, prioritize complete addresses
          if (postcodeLower === queryLower) {
            if (hasCompleteAddress) {
              priority = 10; // Highest priority for complete addresses with exact postcode
            } else if (line1Lower.length > 3 && !line1Lower.match(/^[a-z]{1,2}[0-9]/i)) {
              priority = 8; // High priority for real addresses with exact postcode
            } else {
              priority = 6; // Medium-high priority for exact postcode matches
            }
          } else {
            if (hasCompleteAddress) {
              priority = 7; // High priority for complete addresses with partial postcode match
            } else {
              priority = 4; // Medium priority for partial postcode matches
            }
          }
        } else if (postcodeLower && postcodeLower.length > 0) {
          if (hasCompleteAddress) {
            priority = 5; // Medium-high priority for complete addresses with any postcode
          } else {
            priority = 2; // Medium priority for results with any postcode
          }
        } else if (
          cityLower.includes(queryLower) ||
          queryLower.includes(cityLower)
        ) {
          priority = 1; // Lower priority for city matches
        }
      } else {
        // For non-postcode searches, prioritize by relevance and completeness
        if (line1Lower.includes(queryLower)) {
          if (hasCompleteAddress) {
            priority = 6; // High priority for complete addresses matching query
          } else {
            priority = 3; // Medium priority for partial matches
          }
        } else if (cityLower.includes(queryLower)) {
          priority = 2; // Lower priority for city matches
        }
      }

      // Bonus points for specific building types
      if (f?.properties?.category === 'building' || f?.properties?.type === 'address') {
        priority += 1;
      }

      return {
        id: f?.id,
        label: f?.place_name,
        text: line1, // Main address line for display
        address: {
          line1,
          line2: line2 || undefined, // Additional address line if available
          city,
          postcode,
          country: 'GB',
          full_address: f?.place_name, // Complete formatted address
        },
        coords: f?.center ? { lat: f.center[1], lng: f.center[0] } : null,
        priority,
        isPostcodeMatch,
        hasCompleteAddress,
        type: f?.place_type?.[0] || 'address',
        provider: 'mapbox',
        icon: hasCompleteAddress ? '🏠' : '📍',
      };
    }

    let suggestions = ((data?.features || []) as any[])
      .slice(0, limit)
      .map(mapboxFeatureToAddress);

    // Enhanced sorting algorithm for better address accuracy
    suggestions.sort((a, b) => {
      // First by priority (highest priority first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // Then by complete address status
      if (a.hasCompleteAddress !== b.hasCompleteAddress) {
        return b.hasCompleteAddress ? 1 : -1;
      }

      // Then by postcode match status
      if (a.isPostcodeMatch !== b.isPostcodeMatch) {
        return b.isPostcodeMatch ? 1 : -1;
      }

      // Then by address completeness (longer, more detailed addresses first)
      const aAddressLength = (a.address?.line1?.length || 0) + (a.address?.line2?.length || 0);
      const bAddressLength = (b.address?.line1?.length || 0) + (b.address?.line2?.length || 0);
      if (aAddressLength !== bAddressLength) {
        return bAddressLength - aAddressLength;
      }

      // Finally by label length (shorter labels for exact matches)
      return a.label.length - b.label.length;
    });

    // Enhanced filtering for better address relevance
    if (isPostcodeQuery || isPartialPostcode || isPostcodeLike) {
      suggestions = suggestions.filter(s => {
        // Remove generic postcode area results that don't have actual building information
        const isGenericPostcodeArea = 
          s.address?.line1 === q.toUpperCase() ||
          s.address?.line1?.includes(`${q.toUpperCase()}, Glasgow, Glasgow City, Scotland, United Kingdom`) ||
          s.address?.line1?.includes(`${q.toUpperCase()}, London, Greater London, England, United Kingdom`) ||
          s.address?.line1?.includes(`${q.toUpperCase()}, Manchester, Greater Manchester, England, United Kingdom`) ||
          s.address?.line1?.includes(`${q.toUpperCase()}, Birmingham, West Midlands, England, United Kingdom`) ||
          s.address?.line1?.includes(`${q.toUpperCase()}, Edinburgh, City of Edinburgh, Scotland, United Kingdom`);

        if (isGenericPostcodeArea) {
          return false; // Remove generic postcode area results
        }

        // For full postcode searches, prioritize results with actual building addresses
        if (isPostcodeQuery && q.length >= 7) {
          const hasCorrectPostcode = s.address?.postcode === q.toUpperCase();
          const hasBuildingInfo = s.hasCompleteAddress || (s.address?.line1 && s.address.line1.length > 5);
          
          // Only allow results that have the correct postcode AND building information
          if (!hasCorrectPostcode || !hasBuildingInfo) {
            return false; // Filter out incomplete or unrelated results
          }
        }

        // For partial postcode searches, be more lenient but still filter low-quality results
        if (isPartialPostcode || isPostcodeLike) {
          // Remove results with very low priority or incomplete addresses
          if (s.priority < 2 && !s.hasCompleteAddress) {
            return false;
          }
        }

        return s.priority > 0;
      });
    }

    // If we don't have good postcode results, try a broader search
    if (
      (isPostcodeQuery || isPartialPostcode || isPostcodeLike) &&
      suggestions.length < 3
    ) {
      console.log('[PLACES] Trying broader search for postcode:', q);

      try {
        // Try a specific postcode search first
        const postcodeUrl = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
        );
        postcodeUrl.searchParams.set('access_token', token);
        postcodeUrl.searchParams.set('limit', '15');
        postcodeUrl.searchParams.set('country', country);
        postcodeUrl.searchParams.set('types', 'postcode,place,address');
        postcodeUrl.searchParams.set('autocomplete', 'false');

        const postcodeResponse = await fetch(postcodeUrl.toString(), {
          cache: 'no-store',
        });
        if (postcodeResponse.ok) {
          const postcodeData = await postcodeResponse.json();
          const postcodeSuggestions = (
            (postcodeData?.features || []) as any[]
          ).map(mapboxFeatureToAddress);

          // Merge and deduplicate suggestions
          const allSuggestions = [...suggestions, ...postcodeSuggestions];
          const uniqueSuggestions = allSuggestions.filter(
            (s, index, self) => index === self.findIndex(t => t.id === s.id)
          );

          suggestions = uniqueSuggestions.slice(0, limit);

          // Re-sort the merged suggestions
          suggestions.sort((a, b) => b.priority - a.priority);
        }

        // Now try to get actual building addresses within the postcode area
        if (suggestions.length < 5) {
          console.log('[PLACES] Getting building addresses for postcode:', q);

          // Search for addresses within the postcode area
          const buildingUrl = new URL(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
          );
          buildingUrl.searchParams.set('access_token', token);
          buildingUrl.searchParams.set('limit', '20');
          buildingUrl.searchParams.set('country', country);
          buildingUrl.searchParams.set('types', 'address');
          buildingUrl.searchParams.set('autocomplete', 'false');

          // Add proximity bias to the postcode area
          if (suggestions.length > 0 && suggestions[0].coords) {
            const { lat, lng } = suggestions[0].coords;
            buildingUrl.searchParams.set('proximity', `${lng},${lat}`);
          }

          const buildingResponse = await fetch(buildingUrl.toString(), {
            cache: 'no-store',
          });
          if (buildingResponse.ok) {
            const buildingData = await buildingResponse.json();
            const buildingSuggestions = (
              (buildingData?.features || []) as any[]
            ).map(mapboxFeatureToAddress);

            // Filter to only include actual building addresses (not just postcode areas)
            const actualBuildings = buildingSuggestions.filter(
              s =>
                s.address?.line1 &&
                s.address.line1.length > 3 &&
                !s.address.line1.match(/^[A-Z]{1,2}[0-9]/i) // Not just a postcode
            );

            // Merge building suggestions
            const allSuggestions = [...suggestions, ...actualBuildings];
            const uniqueSuggestions = allSuggestions.filter(
              (s, index, self) => index === self.findIndex(t => t.id === s.id)
            );

            suggestions = uniqueSuggestions.slice(0, limit);

            // Re-sort with buildings first
            suggestions.sort((a, b) => {
              // Buildings with actual addresses get higher priority
              const aIsBuilding =
                a.address?.line1 &&
                a.address.line1.length > 3 &&
                !a.address.line1.match(/^[A-Z]{1,2}[0-9]/i);
              const bIsBuilding =
                b.address?.line1 &&
                b.address.line1.length > 3 &&
                !b.address.line1.match(/^[A-Z]{1,2}[0-9]/i);

              if (aIsBuilding !== bIsBuilding) {
                return bIsBuilding ? 1 : -1;
              }

              return b.priority - a.priority;
            });
          }
        }

        // For full postcodes, try to get specific building addresses
        if (isPostcodeQuery && q.length >= 7) {
          console.log(
            '[PLACES] Getting specific building addresses for full postcode:',
            q
          );

          // Try multiple approaches to get buildings
          const searchQueries = [
            // Try the full postcode
            q,
            // Try with "Street" suffix to get more building results
            `${q} Street`,
            // Try with "Road" suffix
            `${q} Road`,
            // Try with "Avenue" suffix
            `${q} Avenue`,
          ];

          const allBuildingSuggestions: any[] = [];

          for (const searchQuery of searchQueries) {
            try {
              const specificBuildingUrl = new URL(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`
              );
              specificBuildingUrl.searchParams.set('access_token', token);
              specificBuildingUrl.searchParams.set('limit', '10');
              specificBuildingUrl.searchParams.set('country', country);
              specificBuildingUrl.searchParams.set('types', 'address,poi');
              specificBuildingUrl.searchParams.set('autocomplete', 'false');

              const specificBuildingResponse = await fetch(
                specificBuildingUrl.toString(),
                { cache: 'no-store' }
              );
              if (specificBuildingResponse.ok) {
                const specificBuildingData =
                  await specificBuildingResponse.json();
                const specificBuildingSuggestions = (
                  (specificBuildingData?.features || []) as any[]
                ).map(mapboxFeatureToAddress);

                // Filter for actual buildings (not just postcode areas)
                const actualBuildings = specificBuildingSuggestions.filter(
                  s =>
                    s.address?.line1 &&
                    s.address?.line1.length > 3 &&
                    !s.address.line1.match(/^[A-Z]{1,2}[0-9]/i) && // Not just a postcode
                    s.address?.line1 !== q.toUpperCase() && // Not the postcode itself
                    s.address?.line1 !==
                      `${q.toUpperCase()}, Glasgow, Glasgow City, Scotland, United Kingdom` // Not the full area description
                );

                allBuildingSuggestions.push(...actualBuildings);
              }
            } catch (error) {
              console.log(
                '[PLACES] Building search failed for:',
                searchQuery,
                error
              );
            }
          }

          // Remove duplicates and add to suggestions
          const uniqueBuildings = allBuildingSuggestions.filter(
            (s, index, self) => index === self.findIndex(t => t.id === s.id)
          );

          if (uniqueBuildings.length > 0) {
            // Add buildings to the beginning and remove postcode area results
            suggestions = [
              ...uniqueBuildings,
              ...suggestions.filter(s => {
                // Remove postcode area results when we have actual buildings
                const isPostcodeArea =
                  s.address?.line1 === q.toUpperCase() ||
                  s.address?.line1?.includes(
                    `${q.toUpperCase()}, Glasgow, Glasgow City, Scotland, United Kingdom`
                  ) ||
                  s.address?.line1?.includes(
                    `${q.toUpperCase()}, London, Greater London, England, United Kingdom`
                  ) ||
                  s.address?.line1?.includes(
                    `${q.toUpperCase()}, Manchester, Greater Manchester, England, United Kingdom`
                  ) ||
                  s.address?.line1?.includes(
                    `${q.toUpperCase()}, Birmingham, West Midlands, England, United Kingdom`
                  );

                return !isPostcodeArea && s.address?.line1?.length > 3;
              }),
            ];
            suggestions = suggestions.slice(0, limit);
          }
        }
      } catch (error) {
        console.log('[PLACES] Postcode search failed:', error);
      }
    }

    // Debug logging
    console.log(
      '[PLACES] Final suggestions:',
      JSON.stringify(suggestions, null, 2)
    );

    // Final fallback to UK address database if we don't have good results
    if (
      (isPostcodeQuery || isPartialPostcode || isPostcodeLike) &&
      suggestions.length < 3
    ) {
      console.log('[PLACES] Using UK address database fallback for:', q);

      try {
        let databaseResults: any[] = [];
        
        if (isPostcodeQuery || isPartialPostcode || isPostcodeLike) {
          // Search by postcode
          if (ukAddressUtils.isValidUKPostcode(q)) {
            databaseResults = ukAddressDatabase.searchByPostcode(q, limit);
          }
          
          // If no exact matches, try partial postcode search
          if (databaseResults.length === 0) {
            databaseResults = ukAddressDatabase.searchByPartialPostcode(q, limit);
          }
        } else {
          // Search by street name
          databaseResults = ukAddressDatabase.searchByStreet(q, limit);
          
          // If no street matches, try city search
          if (databaseResults.length === 0) {
            databaseResults = ukAddressDatabase.searchByCity(q, limit);
          }
        }
        
        if (databaseResults.length > 0) {
          // Convert database results to expected format
          const dbSuggestions = databaseResults.map(record => 
            ukAddressDatabase.convertToAddressSuggestion(record)
          );
          
          // Merge with existing suggestions and remove duplicates
          const allSuggestions = [...suggestions, ...dbSuggestions];
          const uniqueSuggestions = allSuggestions.filter(
            (s, index, self) => index === self.findIndex(t => t.id === s.id)
          );
          
          suggestions = uniqueSuggestions.slice(0, limit);
          console.log(`[PLACES] Added ${dbSuggestions.length} database results`);
        } else {
          console.log('[PLACES] No database results found');
        }
      } catch (error) {
        console.error('[PLACES] Database fallback failed:', error);
      }
    }

    // Enhanced Google Places API integration for accurate postcode results
    if (isPostcodeQuery && q.length >= 7) {
      console.log('[PLACES] Using Google Places API for postcode:', q);

      try {
        const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS || process.env.GOOGLE_PLACES_API_KEY;
        
        if (googleApiKey) {
          // Use Google Geocoding API for accurate postcode lookup
          const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${googleApiKey}&components=country:GB&region=gb`;
          
          const googleResponse = await fetch(googleUrl);
          if (googleResponse.ok) {
            const googleData = await googleResponse.json();
            
            if (googleData.status === 'OK' && googleData.results.length > 0) {
              console.log(`✅ Google Places found ${googleData.results.length} results for postcode ${q}`);
              
              // Convert Google results to expected format with enhanced address parsing
              const googleSuggestions = googleData.results
                .filter((result: any) => {
                  // Only include results that match the exact postcode
                  const resultPostcode = extractPostcodeFromGoogle(result.formatted_address);
                  return resultPostcode === q.toUpperCase();
                })
                .map((result: any) => {
                  const components = result.address_components || [];
                  const streetNumber = components.find((c: any) => c.types.includes('street_number'))?.long_name || '';
                  const route = components.find((c: any) => c.types.includes('route'))?.long_name || '';
                  const subpremise = components.find((c: any) => c.types.includes('subpremise'))?.long_name || '';
                  const premise = components.find((c: any) => c.types.includes('premise'))?.long_name || '';
                  const locality = components.find((c: any) => c.types.includes('locality'))?.long_name || '';
                  const postalTown = components.find((c: any) => c.types.includes('postal_town'))?.long_name || '';
                  const postcode = components.find((c: any) => c.types.includes('postal_code'))?.long_name || '';
                  
                  // Build complete address
                  let line1 = '';
                  let line2 = '';
                  
                  if (streetNumber && route) {
                    line1 = `${streetNumber} ${route}`.trim();
                    if (subpremise) {
                      line2 = `Flat ${subpremise}`;
                    } else if (premise) {
                      line2 = premise;
                    }
                  } else if (route) {
                    line1 = route;
                    if (streetNumber) {
                      line1 = `${streetNumber} ${route}`.trim();
                    }
                  } else if (premise) {
                    line1 = premise;
                  }
                  
                  const city = postalTown || locality || '';
                  const hasCompleteAddress = !!(streetNumber && route && line1.length > 5);
                  
                  return {
                    id: result.place_id,
                    text: line1,
                    place_name: result.formatted_address,
                    center: [result.geometry.location.lng, result.geometry.location.lat],
                    address: {
                      line1: line1.trim(),
                      line2: line2.trim() || undefined,
                      city: city.trim(),
                      postcode: postcode.trim(),
                      country: 'GB',
                      full_address: result.formatted_address,
                    },
                    coords: {
                      lat: result.geometry.location.lat,
                      lng: result.geometry.location.lng,
                    },
                    priority: hasCompleteAddress ? 10 : 8,
                    isPostcodeMatch: true,
                    hasCompleteAddress,
                    type: 'address',
                    provider: 'google',
                    icon: hasCompleteAddress ? '🏠' : '📍',
                    confidence: result.geometry.location_type === 'ROOFTOP' ? 0.9 : 0.7,
                  };
                })
                .filter((suggestion: any) => suggestion.address.line1 && suggestion.address.line1.length > 3);
              
              if (googleSuggestions.length > 0) {
                // Sort by building number and completeness
                googleSuggestions.sort((a: any, b: any) => {
                  // First by completeness
                  if (a.hasCompleteAddress !== b.hasCompleteAddress) {
                    return b.hasCompleteAddress ? 1 : -1;
                  }
                  
                  // Then by building number
                  const aNum = parseInt(a.address?.line1?.match(/^(\d+)/)?.[1] || '999');
                  const bNum = parseInt(b.address?.line1?.match(/^(\d+)/)?.[1] || '999');
                  return aNum - bNum;
                });
                
                suggestions = googleSuggestions;
                console.log(`✅ Using ${googleSuggestions.length} Google Places results for postcode ${q}`);
              } else {
                console.log(`⚠️ No valid Google Places addresses found for postcode ${q}`);
                suggestions = [];
              }
            } else {
              console.log(`⚠️ Google Places API returned no results for postcode ${q}`);
              suggestions = [];
            }
          } else {
            console.error('❌ Google Places API request failed');
            suggestions = [];
          }
        } else {
          console.log('⚠️ Google Places API key not available, using Mapbox results only');
        }
      } catch (error) {
        console.error('❌ Error in Google Places lookup:', error);
        suggestions = [];
      }

      suggestions = suggestions.slice(0, limit);
    }

    // Helper function to extract postcode from Google formatted address
    function extractPostcodeFromGoogle(formattedAddress: string): string {
      const match = formattedAddress.match(/\b[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}\b/);
      return match ? match[0].replace(/\s/g, '').toUpperCase() : '';
    }

    return NextResponse.json(suggestions, {
      status: 200,
      headers: softCache(),
    });
  } catch (err: any) {
    // Timeouts, network errors → return [] with 200
    console.warn('[PLACES] Exception', err?.message || err);
    return NextResponse.json([], { status: 200, headers: nocache() });
  }
}

function softCache() {
  return {
    'Cache-Control':
      'public, max-age=5, s-maxage=60, stale-while-revalidate=120',
  } as Record<string, string>;
}
function nocache() {
  return { 'Cache-Control': 'no-store' } as Record<string, string>;
}

