'use client';

import { useEffect } from 'react';

/**
 * Microsoft Clarity Analytics Component
 *
 * Implements Clarity tracking following Next.js 15 best practices:
 * - Client component for browser-only script execution
 * - Environment variable for project ID
 * - Type-safe window interface extension
 * - Loads only in production environment
 * - Prevents duplicate initialization
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
    // Only run in browser environment
    if (globalThis.window === undefined) {
      return;
    }

    const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    const isProduction = process.env.NODE_ENV === 'production';

    // Debug log
    console.log('[Clarity] Environment:', process.env.NODE_ENV);
    console.log('[Clarity] Project ID:', clarityProjectId ? 'Present' : 'Missing');

    // Don't load in development or if no project ID is configured
    if (!isProduction || !clarityProjectId) {
      console.log('[Clarity] Skipped: Not in production or no project ID configured');
      return;
    }

    // Prevent duplicate initialization
    if (globalThis.clarity) {
      console.log('[Clarity] Already initialized');
      return;
    }

    // Initialize Clarity with type-safe implementation
    globalThis.clarity = function (...args: ClarityArguments[]) {
      const clarityFn = globalThis.clarity as ClarityFunction;
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

    console.log('[Clarity] Initialized successfully with project ID:', clarityProjectId);
  }, []);

  return null;
}
