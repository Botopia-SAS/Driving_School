/**
 * Cloudinary Image Optimization Utilities
 * Centraliza la lógica de transformación de imágenes
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryImageOptions {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'webp' | 'avif' | 'auto';
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  gravity?: 'auto' | 'face' | 'center';
  blur?: number;
}

/**
 * Genera una URL optimizada de Cloudinary
 * @example
 * getCloudinaryUrl('car_ds', { width: 800, quality: 'auto', format: 'auto' })
 * // => "https://res.cloudinary.com/yourcloud/image/upload/w_800,q_auto,f_auto/car_ds"
 */
export function getCloudinaryUrl(
  publicId: string,
  options: CloudinaryImageOptions = {}
): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
    blur,
  } = options;

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);
  if (blur) transformations.push(`e_blur:${blur}`);

  const transformString = transformations.join(',');

  return `${CLOUDINARY_BASE_URL}/${transformString}/${publicId}`;
}

/**
 * Loader para Next.js Image component
 * @example
 * <Image src="car_ds" loader={cloudinaryLoader} width={800} height={600} />
 */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  return getCloudinaryUrl(src, {
    width,
    quality: quality || 'auto',
    format: 'auto', // Cloudinary detecta automáticamente el mejor formato
  });
}

/**
 * Genera srcset para imágenes responsive
 */
export function generateSrcSet(publicId: string, widths: number[]): string {
  return widths
    .map((width) => {
      const url = getCloudinaryUrl(publicId, { width, quality: 'auto', format: 'auto' });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Placeholder blur para mejor UX
 */
export function getBlurDataUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, {
    width: 10,
    quality: 10,
    blur: 1000,
  });
}
