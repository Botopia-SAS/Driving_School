'use client';

/**
 * Colección de componentes animados con Framer Motion lazy-loaded
 * Reduce el bundle inicial en ~35KB
 */

import dynamic from 'next/dynamic';
import type { HTMLMotionProps } from 'framer-motion';
import { ReactNode, CSSProperties } from 'react';

interface StaticDivProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

// Fallback simple sin animación
const StaticDiv = ({ children, className, style, ...props }: StaticDivProps) => (
  <div className={className} style={style} {...props}>
    {children}
  </div>
);

// ✅ Motion.div lazy loaded
export const MotionDiv = dynamic<HTMLMotionProps<'div'>>(
  () => import('framer-motion').then((mod) => mod.motion.div),
  {
    ssr: false,
    loading: () => <StaticDiv />
  }
);

// ✅ Motion.section lazy loaded
export const MotionSection = dynamic<HTMLMotionProps<'section'>>(
  () => import('framer-motion').then((mod) => mod.motion.section),
  {
    ssr: false,
    loading: () => <StaticDiv />
  }
);

// ✅ Motion.button lazy loaded
export const MotionButton = dynamic<HTMLMotionProps<'button'>>(
  () => import('framer-motion').then((mod) => mod.motion.button),
  { ssr: false }
);

// ✅ Motion.span lazy loaded
export const MotionSpan = dynamic<HTMLMotionProps<'span'>>(
  () => import('framer-motion').then((mod) => mod.motion.span),
  { ssr: false }
);

// ✅ AnimatePresence lazy loaded
export const AnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => mod.AnimatePresence),
  { ssr: false }
);

/**
 * Variantes de animación comunes
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};
