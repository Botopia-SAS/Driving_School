'use client';
import React, { useRef, useEffect } from 'react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Enter location',
  className = '',
  label
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || typeof window === 'undefined' || !window.google) {
      return;
    }

    // Initialize Google Places Autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' }, // Restrict to US
    });

    // Listen for place selection
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [onChange]);

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-black ${className}`}
      />
    </div>
  );
};
