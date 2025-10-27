import type { Metadata, Viewport } from "next";
import "./globals.css";
import { connectDB } from "@/lib/mongodb";
import { SEO } from "@/models/SEO"; // ✅ Importamos el modelo SEO directamente
import { Providers } from "./providers";
import BodyWithDynamicBg from "@/components/BodyWithDynamicBg";
import ConditionalTrackingProvider from '@/components/ConditionalTrackingProvider';
import { AuthProvider } from "@/components/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";
import LayoutWrapper from "@/components/LayoutWrapper";
import { poppins } from "./fonts";

// ✅ Viewport configuration (Next.js 15+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4CAF50' },
    { media: '(prefers-color-scheme: dark)', color: '#2E7D32' }
  ],
};

// ✅ Generamos la metadata sin usar `fetch()`
export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectDB();
    const seo = await SEO.findOne();

    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
      title: seo?.metaTitle || "Affordable Driving School | Professional Driving Lessons in Palm Beach County",
      description: seo?.metaDescription || "Professional behind-the-wheel driving lessons and traffic school courses in Palm Beach County. Experienced instructors, flexible scheduling, and affordable rates.",
      keywords: seo?.metaKeywords || "driving school, driving lessons, traffic school, Palm Beach County, behind the wheel, driving instructor, traffic ticket class",
      robots: seo?.robotsTxt || "index, follow",

      // ✅ Canonical URL
      alternates: {
        canonical: process.env.NEXT_PUBLIC_BASE_URL,
      },

      // ✅ Open Graph mejorado
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: process.env.NEXT_PUBLIC_BASE_URL,
        title: seo?.ogTitle || seo?.metaTitle || "Affordable Driving School - Palm Beach County",
        description: seo?.metaDescription || "Professional driving lessons and traffic school",
        siteName: "Affordable Driving School",
        images: seo?.ogImage ? [{
          url: seo.ogImage,
          width: 1200,
          height: 630,
          alt: 'Affordable Driving School'
        }] : [{
          url: "/default-og-image.jpg",
          width: 1200,
          height: 630,
          alt: 'Driving School'
        }],
      },

      // ✅ Twitter cards
      twitter: {
        card: 'summary_large_image',
        title: seo?.ogTitle || seo?.metaTitle || "Affordable Driving School",
        description: seo?.metaDescription || "Professional driving lessons in Palm Beach County",
        images: seo?.ogImage ? [seo.ogImage] : ["/default-og-image.jpg"],
      },

      // ✅ Otros metadata importantes
      authors: [{ name: 'Affordable Driving School' }],
      creator: 'Affordable Driving School',
      publisher: 'Affordable Driving School',
      formatDetection: {
        telephone: true,
        email: true,
        address: true,
      },
    };
  } catch (error) {
    console.error("❌ Error obteniendo los datos SEO:", error);
    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
      title: "Affordable Driving School - Professional Driving Lessons",
      description: "Learn to drive safely with our professional instructors",
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable}`}>
      <head>
        {/* Preconnect a recursos externos críticos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />

        {/* Mejora de seguridad */}
        <meta name="referrer" content="origin-when-cross-origin" />
      </head>
      <body className={`antialiased bg-white font-sans`} style={{ fontFamily: poppins.style.fontFamily }}>
        <ErrorBoundary>
          <GlobalErrorHandler />
          <AuthProvider>
            <BodyWithDynamicBg>
              <Providers>
                <ConditionalTrackingProvider />
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </Providers>
            </BodyWithDynamicBg>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
