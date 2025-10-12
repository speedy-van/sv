import { z } from 'zod';

export type UkPlaceType =
  | 'city'
  | 'town'
  | 'village'
  | 'borough'
  | 'district'
  | 'neighbourhood';

export const UkPlaceSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  type: z.enum([
    'city',
    'town',
    'village',
    'borough',
    'district',
    'neighbourhood',
  ]),
  county: z.string().optional(),
  region: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  population: z.number().int().positive().optional(),
  parentSlug: z.string().optional(),
});

export type UkPlace = z.infer<typeof UkPlaceSchema>;

export const PlacesIndexSchema = z.object({
  updatedAt: z.string(),
  total: z.number().int().nonnegative(),
  places: z.array(UkPlaceSchema),
});
export type PlacesIndex = z.infer<typeof PlacesIndexSchema>;
