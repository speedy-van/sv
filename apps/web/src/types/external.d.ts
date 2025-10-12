/**
 * External module type definitions
 */

declare module 'react-helmet' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface HelmetProps {
    children?: ReactNode;
    title?: string;
    meta?: Array<{
      name?: string;
      property?: string;
      content?: string;
    }>;
    link?: Array<{
      rel?: string;
      href?: string;
    }>;
  }
  
  export const Helmet: ComponentType<HelmetProps>;
}

declare module '@/data/places.json' {
  const places: {
    places: Array<{
      slug: string;
      name: string;
      region: string;
      lat: number;
      lon: number;
    }>;
    updatedAt: string;
  };
  export default places;
}

declare module '@/data/places.sample.json' {
  const places: {
    places: Array<{
      slug: string;
      name: string;
      region: string;
      lat: number;
      lon: number;
    }>;
    updatedAt: string;
  };
  export default places;
}

declare module '@/data/places.schema' {
  export interface UkPlace {
    slug: string;
    name: string;
    type: string;
    county?: string;
    region: string;
    lat: number;
    lon: number;
    population?: number;
    parentSlug?: string;
  }
  
  export interface PlacesIndex {
    places: UkPlace[];
    updatedAt: string;
    total: number;
  }
  
  export const PlacesIndexSchema: any;
}
