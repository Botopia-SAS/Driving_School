/**
 * Structured Data (JSON-LD) para SEO
 * Mejora los rich snippets en Google
 */

interface LocalBusinessSchemaProps {
  name?: string;
  description?: string;
  telephone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
}

export function LocalBusinessSchema({
  name = "Affordable Driving School",
  description = "Professional behind-the-wheel driving lessons and traffic school courses in Palm Beach County",
  telephone = "(561) 969-0150",
  address = {
    street: "Palm Beach County",
    city: "West Palm Beach",
    state: "FL",
    zip: "33401"
  },
  geo = {
    latitude: 26.7153,
    longitude: -80.0534
  },
  openingHours = [
    "Monday 09:00-18:00",
    "Tuesday 09:00-18:00",
    "Wednesday 09:00-18:00",
    "Thursday 09:00-18:00",
    "Friday 09:00-18:00",
    "Saturday 09:00-15:00"
  ],
  priceRange = "$$"
}: LocalBusinessSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    "name": name,
    "description": description,
    "url": process.env.NEXT_PUBLIC_BASE_URL,
    "telephone": telephone,
    "priceRange": priceRange,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": address.street,
      "addressLocality": address.city,
      "addressRegion": address.state,
      "postalCode": address.zip,
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": geo.latitude,
      "longitude": geo.longitude
    },
    "openingHoursSpecification": openingHours.map(hours => {
      const [day, time] = hours.split(' ');
      const [opens, closes] = time.split('-');
      return {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": day,
        "opens": opens,
        "closes": closes
      };
    }),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "250"
    },
    "sameAs": [
      "https://www.facebook.com/affordabledrivingschool",
      "https://www.instagram.com/affordabledrivingschool"
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

export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function CourseSchema({
  name,
  description,
  price,
  provider = "Affordable Driving School"
}: {
  name: string;
  description: string;
  price: number;
  provider?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": name,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": provider,
      "sameAs": process.env.NEXT_PUBLIC_BASE_URL
    },
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "USD"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
