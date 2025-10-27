'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Lazy load reCAPTCHA solo cuando se necesite
const ReCAPTCHAComponent = dynamic(
  () => import('react-google-recaptcha'),
  {
    ssr: false,
    loading: () => (
      <div className="h-20 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading security check...</span>
      </div>
    ),
  }
);

type ReCAPTCHAProps = ComponentProps<typeof ReCAPTCHAComponent>;

/**
 * Wrapper optimizado para Google reCAPTCHA
 * Solo carga el script cuando el componente se renderiza
 *
 * @example
 * <ReCaptchaWrapper
 *   sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
 *   onChange={(token) => setRecaptchaToken(token)}
 * />
 */
export default function ReCaptchaWrapper(props: ReCAPTCHAProps) {
  return <ReCAPTCHAComponent {...props} />;
}
