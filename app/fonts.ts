import { Poppins } from 'next/font/google';

/**
 * Configuración centralizada de fuentes
 * Evita múltiples cargas de la misma fuente
 */
export const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap', // Evita FOIT (Flash of Invisible Text)
  preload: true,
  variable: '--font-poppins',
  adjustFontFallback: true, // Mejora CLS
  fallback: ['system-ui', 'arial'], // Fallback fonts
});
