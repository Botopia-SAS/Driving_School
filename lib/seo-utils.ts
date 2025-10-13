import { connectDB } from "@/lib/mongodb";
import { SEO } from "@/models/SEO";
import { Metadata } from "next";
import Classes from "@/models/Classes";
import Location from "@/models/Locations";
import OnlineCourse from "@/models/OnlineCourses";
import mongoose from "mongoose";

/**
 * Genera un slug SEO-friendly desde un texto
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .replace(/[^a-z0-9]+/g, "-") // Reemplaza caracteres especiales con guiones
    .replace(/^-+|-+$/g, ""); // Elimina guiones al inicio y final
}

/**
 * Obtiene el ID de una entidad por slug o ID
 * Si es un slug, busca en la base de datos. Si es un ObjectId válido, lo retorna directamente.
 */
export async function getEntityIdBySlugOrId(
  slugOrId: string,
  entityType: 'DrivingClass' | 'locations' | 'onlinecourses'
): Promise<string | null> {
  try {
    await connectDB();

    // Verificar si es un ObjectId válido
    if (mongoose.Types.ObjectId.isValid(slugOrId) && slugOrId.length === 24) {
      return slugOrId;
    }

    // Buscar por slug en la colección correspondiente
    let entity;
    switch (entityType) {
      case 'DrivingClass':
        entity = await Classes.findOne({ slug: slugOrId }).lean();
        break;
      case 'locations':
        entity = await Location.findOne({ slug: slugOrId }).lean();
        break;
      case 'onlinecourses':
        entity = await OnlineCourse.findOne({ slug: slugOrId }).lean();
        break;
    }

    return entity ? entity._id.toString() : null;
  } catch (error) {
    console.error(`❌ Error getting entity ID for ${slugOrId}:`, error);
    return null;
  }
}

/**
 * Genera y actualiza el slug de una entidad basado en su metaTitle del SEO
 */
export async function generateAndUpdateSlugFromSEO(
  entityId: string,
  entityType: 'DrivingClass' | 'locations' | 'onlinecourses'
): Promise<string | null> {
  try {
    await connectDB();

    // Buscar metadata SEO
    const seoData = await SEO.findOne({
      entityId: entityId,
      entityType: entityType
    });

    if (!seoData || !seoData.metaTitle) {
      console.warn(`⚠️ No SEO metaTitle found for ${entityType}:${entityId}`);
      return null;
    }

    const slug = generateSlug(seoData.metaTitle);

    // Actualizar el slug en la entidad correspondiente
    let Model;
    switch (entityType) {
      case 'DrivingClass':
        Model = Classes;
        break;
      case 'locations':
        Model = Location;
        break;
      case 'onlinecourses':
        Model = OnlineCourse;
        break;
    }

    await Model.findByIdAndUpdate(entityId, { slug });

    return slug;
  } catch (error) {
    console.error(`❌ Error generating slug for ${entityType}:${entityId}:`, error);
    return null;
  }
}

/**
 * Obtiene metadata SEO específica para una entidad
 */
export async function getEntityMetadata(
  entityId: string,
  entityType: 'DrivingClass' | 'locations' | 'onlinecourses',
  fallbackTitle: string = "Driving School",
  fallbackDescription: string = "Learn road skills for life"
): Promise<Metadata> {
  try {
    await connectDB();

    const seoData = await SEO.findOne({
      entityId: entityId,
      entityType: entityType
    });

    if (!seoData) {
      console.warn(`⚠️ No SEO data found for ${entityType}:${entityId}, using fallback`);
      return {
        title: fallbackTitle,
        description: fallbackDescription,
      };
    }

    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
      title: seoData.metaTitle || fallbackTitle,
      description: seoData.metaDescription || fallbackDescription,
      keywords: seoData.metaKeywords || undefined,
      robots: seoData.robotsTxt || "index, follow",
      openGraph: {
        title: seoData.ogTitle || seoData.metaTitle || fallbackTitle,
        description: seoData.metaDescription || fallbackDescription,
        images: seoData.metaImage ? [seoData.metaImage] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: seoData.ogTitle || seoData.metaTitle || fallbackTitle,
        description: seoData.metaDescription || fallbackDescription,
        images: seoData.metaImage ? [seoData.metaImage] : undefined,
      },
    };
  } catch (error) {
    console.error(`❌ Error getting SEO metadata for ${entityType}:${entityId}:`, error);
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }
}

/**
 * Obtiene metadata SEO general (sin entidad específica)
 */
export async function getGeneralMetadata(): Promise<Metadata> {
  try {
    await connectDB();

    const seoData = await SEO.findOne({
      entityType: null
    });

    if (!seoData) {
      console.warn(`⚠️ No general SEO data found, using fallback`);
      return {
        title: "Driving School",
        description: "Learn road skills for life",
      };
    }

    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
      title: seoData.metaTitle || "Driving School",
      description: seoData.metaDescription || "Learn road skills for life",
      keywords: seoData.metaKeywords || undefined,
      robots: seoData.robotsTxt || "index, follow",
      openGraph: {
        title: seoData.ogTitle || seoData.metaTitle || "Driving School",
        description: seoData.metaDescription || "Learn road skills for life",
        images: seoData.metaImage ? [seoData.metaImage] : ["/default-image.png"],
      },
      twitter: {
        card: "summary_large_image",
        title: seoData.ogTitle || seoData.metaTitle || "Driving School",
        description: seoData.metaDescription || "Learn road skills for life",
        images: seoData.metaImage ? [seoData.metaImage] : ["/default-image.png"],
      },
    };
  } catch (error) {
    console.error("❌ Error getting general SEO metadata:", error);
    return {
      title: "Driving School",
      description: "Learn road skills for life",
    };
  }
}
