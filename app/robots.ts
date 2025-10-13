import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/myschedule',
          '/mystudents',
          '/Students',
          '/myagenda',
          '/checkout',
          '/payment-success',
          '/payment-cancel',
          '/payment-retry',
          '/register-profile',
          '/sign-in',
          '/error-checkout',
          '/success-checkout',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
