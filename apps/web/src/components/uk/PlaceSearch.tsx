'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [totalPlaces, setTotalPlaces] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Search places via API
  useEffect(() => {
    if (!query || query.length < 2) {
      setFilteredPlaces([]);
      return;
    }

    const searchPlaces = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setFilteredPlaces(data.places || []);
        setTotalPlaces(data.total || 0);
      } catch (error) {
        console.error('Search error:', error);
        setFilteredPlaces([]);
      }
      setIsLoading(false);
    };

    // Debounce search
    const timer = setTimeout(searchPlaces, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Get total on mount
  useEffect(() => {
    fetch('/api/places/search?q=')
      .then(res => res.json())
      .then(data => setTotalPlaces(data.total || 0))
      .catch(() => {});
  }, []);

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
          onBlur={() => setTimeout(() => setIsOpen(false), 250)}
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
                  <span className="uk-search-result-type">{place.type || 'place'}</span>
                </div>
                <span className="uk-search-result-region">{place.region}</span>
              </li>
            ))}
          </ul>
        )}

        {isOpen && query.length >= 2 && filteredPlaces.length === 0 && !isLoading && (
          <div className="uk-search-no-results">
            No locations found for "{query}"
          </div>
        )}

        {isLoading && (
          <div className="uk-search-no-results">
            Searching...
          </div>
        )}
      </div>

      <p className="uk-search-stats">
        🇬🇧 Covering {totalPlaces.toLocaleString()} locations across the UK
      </p>
    </div>
  );
}
