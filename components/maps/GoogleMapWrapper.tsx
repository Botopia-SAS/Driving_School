'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Lazy load Google Maps API solo cuando se necesite
const GoogleMapComponent = dynamic(
  () => import('./GoogleMapClient'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

/**
 * Wrapper optimizado para Google Maps
 * Solo carga la API cuando el componente se monta
 *
 * @example
 * <GoogleMapWrapper
 *   center={{ lat: 26.7153, lng: -80.0534 }}
 *   zoom={12}
 *   onLocationSelect={(location) => console.log(location)}
 * />
 */
export default function GoogleMapWrapper(props: ComponentProps<typeof GoogleMapComponent>) {
  return <GoogleMapComponent {...props} />;
}
