# 🚀 Plan de Optimización Lighthouse - Driving School

**Análisis Completo y Estrategia de Implementación**

---

## 📊 Hallazgos del Análisis

### **Problemas Críticos Encontrados (42 total)**

1. **Imágenes sin optimizar:** 22 MB en public/, sin WebP, sin responsive images
2. **Sin lazy loading:** 9 modales + 82 componentes Framer Motion cargados eagerly
3. **JavaScript bloqueante:** Google Maps + reCAPTCHA síncronos
4. **Accesibilidad baja:** Solo 11 ARIA labels, sin navegación por teclado
5. **Fuentes duplicadas:** Poppins importado 4 veces sin optimización
6. **CSS sin optimizar:** 37 estilos inline, CSS crítico no extraído
7. **SEO mejorable:** Falta structured data, canonical URLs

---

## 🎯 Objetivos por Fase

| Métrica | Actual | Fase 1 | Fase 2 | Fase 3 | Meta |
|---------|--------|--------|--------|--------|------|
| **Performance** | 35-45 | 55-65 | 70-80 | 80-90 | 90+ |
| **Accessibility** | 40-50 | 45-55 | 70-80 | 85-95 | 95+ |
| **Best Practices** | 60-70 | 70-75 | 80-85 | 85-90 | 90+ |
| **SEO** | 70-80 | 75-80 | 85-90 | 90-95 | 95+ |

---

## 📋 FASE 1: Quick Wins (Ganancia +20-25 puntos)
**Tiempo estimado:** 1-2 días
**Impacto:** Performance +15, Accessibility +5

### 1.1 Optimizar Next.js Config

**Archivo:** `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Optimización de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "s.gravatar.com",
      },
    ],
  },

  // ✅ Compresión
  compress: true,

  // ✅ Optimización de compilación
  swcMinify: true,

  // ✅ Power optimization
  poweredByHeader: false,

  // ✅ Headers optimizados para caché
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' http://localhost:3000 https://driving-school-mocha.vercel.app https://dashboard-ds-flax.vercel.app",
          },
        ],
      },
    ];
  },

  // ✅ Experimental features
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons'],
  },
};

export default nextConfig;
```

---

### 1.2 Optimizar Fuentes (Centralizado)

**Crear:** `app/fonts.ts`

```typescript
import { Poppins } from 'next/font/google';

export const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap', // ✅ CRITICAL: Evita FOIT (Flash of Invisible Text)
  preload: true,
  variable: '--font-poppins',
});
```

**Actualizar:** `app/layout.tsx`

```typescript
import { poppins } from './fonts';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased bg-white font-sans">
        {/* ... resto del código ... */}
      </body>
    </html>
  );
}
```

**Eliminar imports de Poppins de:**
- ❌ `app/driving_test/page.tsx:5`
- ❌ `app/Lessons/DrivingTestSection.tsx:5`
- ❌ `app/Lessons/page.tsx:5`
- ❌ `app/Lessons/CorporatePrograms.tsx:5`

---

### 1.3 Comprimir Imágenes Críticas

**Script de optimización automática:**

Crear: `scripts/optimize-images.sh`

```bash
#!/bin/bash

# Instalar imagemagick y cwebp si no están instalados
# brew install imagemagick webp

PUBLIC_DIR="./public"

echo "🖼️  Optimizando imágenes..."

# Convertir JPG/PNG grandes a WebP
find "$PUBLIC_DIR" -type f \\( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \\) | while read img; do
  size=$(stat -f%z "$img")

  if [ $size -gt 100000 ]; then # Mayor a 100KB
    filename="${img%.*}"
    echo "Comprimiendo: $img ($size bytes)"

    # Crear versión WebP
    cwebp -q 85 "$img" -o "${filename}.webp"

    # Redimensionar original si es muy grande
    if [ $size -gt 500000 ]; then # Mayor a 500KB
      mogrify -resize "1920x1920>" -quality 85 "$img"
    fi
  fi
done

echo "✅ Optimización completada"
```

**Ejecutar:**
```bash
chmod +x scripts/optimize-images.sh
./scripts/optimize-images.sh
```

---

### 1.4 Optimizar Hero Component (Imagen más pesada)

**Archivo:** `components/Hero.tsx`

**ANTES:**
```tsx
<Image
  src="/8.jpg" // 1.3 MB ❌
  alt="Driving School"
  layout="fill"
/>
```

**DESPUÉS:**
```tsx
import Image from 'next/image';

<Image
  src="/8.webp" // ✅ Usar WebP optimizado
  alt="Professional driving instruction with experienced instructors"
  fill
  priority // ✅ Para imagen hero (LCP)
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  quality={85}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generar con plaiceholder
/>
```

---

### 1.5 Actualizar Metadata con theme-color

**Archivo:** `app/layout.tsx`

```typescript
export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectDB();
    const seo = await SEO.findOne();

    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
      title: seo?.metaTitle || "Driving School",
      description: seo?.metaDescription || "Learn road skills for life",
      robots: seo?.robotsTxt || "index, follow",

      // ✅ NUEVO: theme-color
      themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' }
      ],

      // ✅ NUEVO: viewport optimizado
      viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
      },

      // ✅ NUEVO: canonical URL
      alternates: {
        canonical: process.env.NEXT_PUBLIC_BASE_URL,
      },

      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: process.env.NEXT_PUBLIC_BASE_URL,
        title: seo?.ogTitle || seo?.metaTitle || "Driving School",
        description: seo?.metaDescription || "Learn road skills for life",
        images: seo?.ogImage ? [seo.ogImage] : ["/default-image.png"],
        siteName: "Driving School",
      },

      // ✅ NUEVO: Twitter cards
      twitter: {
        card: 'summary_large_image',
        title: seo?.ogTitle || seo?.metaTitle || "Driving School",
        description: seo?.metaDescription || "Learn road skills for life",
        images: seo?.ogImage ? [seo.ogImage] : ["/default-image.png"],
      },
    };
  } catch (error) {
    console.error("❌ Error obteniendo los datos SEO:", error);
    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
      title: "Driving School",
      description: "Learn road skills for life",
    };
  }
}
```

---

## 📋 FASE 2: Lazy Loading & Code Splitting (Ganancia +15-20 puntos)
**Tiempo estimado:** 3-4 días
**Impacto:** Performance +15, Best Practices +5

### 2.1 Crear Componente de Lazy Load Genérico

**Crear:** `components/LazyLoad.tsx`

```typescript
'use client';

import { Suspense, ComponentType } from 'react';
import LoadingSpinner from './common/LoadingSpinner';

interface LazyLoadProps {
  Component: ComponentType<any>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

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
```

---

### 2.2 Lazy Load de Modales

**Crear:** `components/modals/index.ts`

```typescript
import dynamic from 'next/dynamic';

// ✅ Lazy load con dynamic import
export const LoginModal = dynamic(() => import('@/components/LoginModal'), {
  loading: () => <div className="animate-pulse">Loading...</div>,
  ssr: false, // No renderizar en servidor (modales solo cliente)
});

export const BookingModal = dynamic(() => import('@/components/BookingModal'), {
  loading: () => <div className="animate-pulse">Loading...</div>,
  ssr: false,
});

export const CancellationModal = dynamic(() => import('@/components/CancellationModal'), {
  loading: () => <div className="animate-pulse">Loading...</div>,
  ssr: false,
});

// Repeat for all modals...
```

**Usar en componentes:**

**ANTES:**
```tsx
import BookingModal from '@/components/BookingModal';
```

**DESPUÉS:**
```tsx
import { BookingModal } from '@/components/modals';
```

---

### 2.3 Code-Split Framer Motion

**Crear:** `components/animations/MotionDiv.tsx`

```typescript
'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// ✅ Solo importar cuando se necesite
const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => mod.motion.div),
  { ssr: false }
);

export default function AnimatedDiv(props: ComponentProps<typeof MotionDiv>) {
  return <MotionDiv {...props} />;
}
```

**Usar así:**
```tsx
// ANTES
import { motion } from 'framer-motion';
<motion.div>...</motion.div>

// DESPUÉS
import AnimatedDiv from '@/components/animations/MotionDiv';
<AnimatedDiv>...</AnimatedDiv>
```

---

### 2.4 Lazy Load Google Maps

**Archivo:** `app/driving-lessons/components/RequestModal.tsx`

**ANTES (línea 71-75):**
```tsx
import { GoogleMap, LoadScript } from '@react-google-maps/api';

<LoadScript googleMapsApiKey={apiKey}>
  <GoogleMap />
</LoadScript>
```

**DESPUÉS:**
```tsx
import dynamic from 'next/dynamic';

const GoogleMapComponent = dynamic(
  () => import('@/components/GoogleMapWrapper'),
  {
    loading: () => <div>Loading map...</div>,
    ssr: false,
  }
);

// Renderizar solo cuando el modal esté abierto
{isOpen && <GoogleMapComponent />}
```

---

### 2.5 Lazy Load reCAPTCHA

**Archivo:** `components/ContactForm.tsx` (línea 363-369)

```typescript
import dynamic from 'next/dynamic';

const ReCAPTCHA = dynamic(() => import('react-google-recaptcha'), {
  ssr: false,
  loading: () => <div className="h-20 w-full animate-pulse bg-gray-200 rounded" />,
});

// Renderizar solo cuando el formulario sea visible
{showForm && <ReCAPTCHA ... />}
```

---

## 📋 FASE 3: Accesibilidad (Ganancia +20-30 puntos)
**Tiempo estimado:** 5-6 días
**Impacto:** Accessibility +30

### 3.1 Agregar ARIA Labels

**Archivo:** `app/driving-lessons/components/ScheduleTableImproved.tsx`

**ANTES:**
```tsx
<div onClick={handleSlotClick}>
  Book Now
</div>
```

**DESPUÉS:**
```tsx
<button
  onClick={handleSlotClick}
  className="..."
  aria-label={`Book driving lesson on ${date} at ${start} with ${instructorName}`}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSlotClick();
    }
  }}
>
  Book Now
</button>
```

---

### 3.2 Navegación por Teclado

**Crear:** `hooks/useKeyboardNavigation.ts`

```typescript
import { useEffect } from 'react';

export function useKeyboardNavigation(
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          onEnter?.();
          break;
        case 'Escape':
          onEscape?.();
          break;
        case 'ArrowUp':
          onArrowUp?.();
          break;
        case 'ArrowDown':
          onArrowDown?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onEscape, onArrowUp, onArrowDown]);
}
```

---

### 3.3 Focus Indicators (CSS Global)

**Archivo:** `globals.css`

```css
/* ✅ Focus visible para accesibilidad */
*:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  border-radius: 4px;
}

/* ✅ Skip to content link */
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-to-content:focus {
  top: 0;
}

/* ✅ Botones accesibles */
button:focus-visible,
a:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* ✅ Mejorar contraste */
.text-blue-100 {
  color: #dbeafe; /* WCAG AA compliant */
}
```

---

### 3.4 Skip to Content Link

**Archivo:** `components/LayoutWrapper.tsx`

```tsx
export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="skip-to-content"
        aria-label="Skip to main content"
      >
        Skip to content
      </a>

      <Header />

      <main id="main-content" role="main" tabIndex={-1}>
        {children}
      </main>

      <Footer />
    </>
  );
}
```

---

## 📋 FASE 4: SEO Avanzado (Ganancia +10-15 puntos)
**Tiempo estimado:** 2-3 días
**Impacto:** SEO +10-15

### 4.1 Structured Data (JSON-LD)

**Crear:** `components/StructuredData.tsx`

```typescript
export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    "name": "Driving School",
    "description": "Professional driving lessons and instruction",
    "url": process.env.NEXT_PUBLIC_BASE_URL,
    "telephone": "(561) 969-0150",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Your Street Address",
      "addressLocality": "Your City",
      "addressRegion": "Your State",
      "postalCode": "Your Zip",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "YOUR_LATITUDE",
      "longitude": "YOUR_LONGITUDE"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "sameAs": [
      "https://facebook.com/yourschool",
      "https://instagram.com/yourschool"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**Agregar a layout.tsx:**

```tsx
import { LocalBusinessSchema } from '@/components/StructuredData';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <LocalBusinessSchema />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

---

## 🛠️ Scripts de Automatización

### Package.json - Agregar scripts

```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "lighthouse": "lighthouse http://localhost:3000 --view --output json --output html",
    "optimize:images": "./scripts/optimize-images.sh",
    "audit": "npm run lighthouse && npm run analyze"
  }
}
```

---

## 📊 Checklist de Implementación

### Fase 1 (Días 1-2)
- [ ] Actualizar `next.config.ts` con optimizaciones
- [ ] Centralizar fonts en `app/fonts.ts`
- [ ] Comprimir imágenes >250KB
- [ ] Convertir Hero images a WebP
- [ ] Agregar theme-color y canonical URLs

### Fase 2 (Días 3-6)
- [ ] Crear `components/LazyLoad.tsx`
- [ ] Lazy load de 9 modales
- [ ] Code-split Framer Motion
- [ ] Lazy load Google Maps
- [ ] Lazy load reCAPTCHA

### Fase 3 (Días 7-12)
- [ ] Agregar ARIA labels (200+ elementos)
- [ ] Implementar navegación por teclado
- [ ] Agregar focus indicators CSS
- [ ] Implementar Skip to Content
- [ ] Verificar contraste WCAG AA

### Fase 4 (Días 13-15)
- [ ] Agregar LocalBusiness schema
- [ ] Agregar Breadcrumb schema
- [ ] Agregar FAQ schema
- [ ] Implementar rich snippets

---

## 🎯 Métricas de Éxito Esperadas

### Core Web Vitals
- **LCP (Largest Contentful Paint):** <2.5s (actualmente ~4-5s)
- **FID (First Input Delay):** <100ms
- **CLS (Cumulative Layout Shift):** <0.1

### Lighthouse Scores
- **Performance:** 85-95 (desde ~40)
- **Accessibility:** 90-100 (desde ~45)
- **Best Practices:** 90-95 (desde ~65)
- **SEO:** 95-100 (desde ~75)

---

## 📱 Testing

```bash
# Local Lighthouse audit
npm run lighthouse

# Build analysis
npm run analyze

# Test accessibility
npx axe-cli http://localhost:3000
```

---

## 🚨 Notas Importantes

1. **No optimizar todas las imágenes a la vez** - Hazlo por secciones para evitar romper el sitio
2. **Testing incremental** - Después de cada fase, correr Lighthouse
3. **Backup antes de cambios** - Git commit antes de cambios grandes
4. **Mobile-first** - Priorizar mobile en optimizaciones

---

**Este plan debería llevar tu Lighthouse score de ~40-50 a 85-95 en todas las métricas.**

¿Por dónde quieres empezar? Puedo ayudarte a implementar cualquiera de estas fases.
