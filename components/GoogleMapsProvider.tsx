'use client';
import { useLoadScript } from '@react-google-maps/api';
import { ReactNode } from 'react';

const libraries: ("places")[] = ["places"];

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  if (loadError) {
    console.error('Error loading Google Maps:', loadError);
    return <>{children}</>;
  }

  if (!isLoaded) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
