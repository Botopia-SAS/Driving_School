'use client';

import dynamic from 'next/dynamic';
import { HTMLMotionProps } from 'framer-motion';

// ✅ Lazy load Framer Motion solo cuando se necesite
const MotionDivComponent = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
);

/**
 * Wrapper optimizado para motion.div de Framer Motion
 * Solo carga la librería cuando el componente se renderiza
 *
 * @example
 * <MotionDiv
 *   initial={{ opacity: 0 }}
 *   animate={{ opacity: 1 }}
 *   className="..."
 * >
 *   Content
 * </MotionDiv>
 */
export default function MotionDiv(props: HTMLMotionProps<'div'>) {
  return <MotionDivComponent {...props} />;
}
