'use client';

import { Suspense, ComponentType, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LazyLoadProps {
  Component: ComponentType<Record<string, unknown>>;
  fallback?: ReactNode;
  [key: string]: unknown;
}

/**
 * Wrapper genérico para lazy loading de componentes
 *
 * @example
 * const MyHeavyComponent = dynamic(() => import('./MyHeavyComponent'));
 *
 * <LazyLoad Component={MyHeavyComponent} prop1="value" prop2={123} />
 */
export default function LazyLoad({
  Component,
  fallback = <LoadingSpinner />,
  ...props
}: LazyLoadProps) {
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}
