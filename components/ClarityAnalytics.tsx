'use client';

import { useEffect } from 'react';

/**
 * Microsoft Clarity Analytics Component
 *
 * Implements Clarity tracking following Next.js 15 best practices:
 * - Client component for browser-only script execution
 * - Environment variable for project ID
 * - Type-safe window interface extension
 * - Conditional rendering based on environment
 * - No re-initialization on hot reload
 */

type ClarityArguments = string | number | boolean | object | null;

declare global {
  interface Window {
    clarity?: ClarityFunction;
  }
}

interface ClarityFunction {
  (...args: ClarityArguments[]): void;
  q?: ClarityArguments[][];
}

export default function ClarityAnalytics() {
  useEffect(() => {
    const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

    // Don't load in development or if no project ID is configured
    if (process.env.NODE_ENV === 'development' || !clarityProjectId) {
      console.log('[Clarity] Skipped: Running in development or no project ID configured');
      return;
    }

    // Prevent duplicate initialization
    if (globalThis.window?.clarity) {
      console.log('[Clarity] Already initialized');
      return;
    }

    // Initialize Clarity with type-safe implementation
    globalThis.window.clarity = function (...args: ClarityArguments[]) {
      const clarityFn = globalThis.window.clarity as ClarityFunction;
      const queue = clarityFn.q || [];
      clarityFn.q = queue;
      queue.push(args);
    } as ClarityFunction;

    // Create and inject script element
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${clarityProjectId}`;

    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);

    console.log('[Clarity] Initialized with project ID:', clarityProjectId);
  }, []);

  return null;
}
