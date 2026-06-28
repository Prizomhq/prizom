import { v2 as cloudinary } from 'cloudinary';

// Initialize and export secure Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Extracts the Cloudinary public_id from a full resource URL.
 * Supports our standard folders 'prizom/prompts' and 'prizom/avatars'.
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null;

  try {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;

    // Locate the start of our folder namespace 'prizom/'
    const prizomIdx = parts[1].indexOf('prizom/');
    if (prizomIdx === -1) return null;

    const pathWithExt = parts[1].substring(prizomIdx);
    const lastDotIdx = pathWithExt.lastIndexOf('.');
    if (lastDotIdx === -1) return pathWithExt;
    
    return pathWithExt.substring(0, lastDotIdx);
  } catch (err) {
    console.error('[CLOUDINARY PARSE ERROR] Failed to extract public_id:', url, err);
    return null;
  }
}

/**
 * Deletes a Cloudinary asset by its URL.
 */
export async function deleteCloudinaryAsset(url: string): Promise<boolean> {
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (err) {
    console.error(`[CLOUDINARY DELETE ERROR] Failed to delete asset for public_id ${publicId}:`, err);
    return false;
  }
}

export { cloudinary };
export default cloudinary;

