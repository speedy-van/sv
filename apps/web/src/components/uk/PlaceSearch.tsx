'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import places from '@/data/places.json';

interface Place {
  name: string;
  slug: string;
  type?: string;
  region: string;
  population?: number;
}

export default function PlaceSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredPlaces = useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    return (places.places as unknown as Place[])
      .filter(place => 
        place.name.toLowerCase().includes(lowerQuery) ||
        place.region.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => {
        // Prioritize exact matches at the start
        const aStartsWith = a.name.toLowerCase().startsWith(lowerQuery);
        const bStartsWith = b.name.toLowerCase().startsWith(lowerQuery);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Then by population
        return (b.population || 0) - (a.population || 0);
      })
      .slice(0, 10);
  }, [query]);

  const handleSelect = useCallback((slug: string) => {
    setQuery('');
    setIsOpen(false);
    router.push(`/uk/${slug}`);
  }, [router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, slug: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(slug);
    }
  }, [handleSelect]);

  return (
    <div className="uk-search-wrapper">
      <div className="uk-search-input-container">
        <svg 
          className="uk-search-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search for your city, town or village..."
          className="uk-search-input"
          aria-label="Search UK locations"
          autoComplete="off"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="uk-search-clear"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && filteredPlaces.length > 0 && (
        <ul className="uk-search-results" role="listbox">
          {filteredPlaces.map((place) => (
            <li 
              key={place.slug}
              role="option"
              tabIndex={0}
              onClick={() => handleSelect(place.slug)}
              onKeyDown={(e) => handleKeyDown(e, place.slug)}
              className="uk-search-result-item"
            >
              <div className="uk-search-result-main">
                <span className="uk-search-result-name">{place.name}</span>
                <span className="uk-search-result-type">{place.type}</span>
              </div>
              <span className="uk-search-result-region">{place.region}</span>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.length >= 2 && filteredPlaces.length === 0 && (
        <div className="uk-search-no-results">
          No locations found for "{query}"
        </div>
      )}

      <p className="uk-search-stats">
        🇬🇧 Covering {places.places.length.toLocaleString()} locations across the UK
      </p>
    </div>
  );
}
