import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/mongodb';
import Classes from '@/models/Classes';
import Location from '@/models/Locations';
import OnlineCourse from '@/models/OnlineCourses';
import { SEO } from '@/models/SEO';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    await connectDB();

    // Obtener todas las clases, locations, cursos online y SEOs
    const [classes, locations, onlineCourses, seos] = await Promise.all([
      Classes.find({}).lean(),
      Location.find({}).lean(),
      OnlineCourse.find({}).lean(),
      SEO.find({}).select('entityId entityType slug').lean(),
    ]);

    // Crear mapa de slugs por entityId
    const slugMap = new Map();
    seos.forEach((seo: any) => {
      if (seo.slug && seo.entityId) {
        slugMap.set(seo.entityId.toString(), seo.slug);
      }
    });

    // Páginas estáticas
    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/classes`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/locations`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/online-courses`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/Lessons`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/driving_test`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/FAQ`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/PrivacyPolicy`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
      {
        url: `${baseUrl}/TermsOfServices`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
    ];

    // Páginas dinámicas de clases (usa slug desde SEO si está disponible, sino ID)
    const classPages = classes.map((cls: any) => ({
      url: `${baseUrl}/classes/${slugMap.get(cls._id.toString()) || cls._id}`,
      lastModified: cls.updatedAt || cls.createdAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Páginas dinámicas de locations (usa slug desde SEO si está disponible, sino ID)
    const locationPages = locations.map((location: any) => ({
      url: `${baseUrl}/locations/${slugMap.get(location._id.toString()) || location._id}`,
      lastModified: location.updatedAt || location.createdAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Páginas dinámicas de cursos online (usa slug si está disponible, sino ID)
    const onlineCoursePages = onlineCourses.map((course: any) => ({
      url: `${baseUrl}/online-courses/${course.slug || course._id}`,
      lastModified: course.updatedAt || course.createdAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [
      ...staticPages,
      ...classPages,
      ...locationPages,
      ...onlineCoursePages,
    ];
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);

    // Fallback a páginas estáticas si hay error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/classes`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/locations`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/online-courses`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
    ];
  }
}
