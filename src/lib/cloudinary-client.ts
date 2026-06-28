// Client-safe URL transformation utility (no server-side Cloudinary SDK imports to avoid Turbopack client-side errors)
export function getOptimizedImageUrl(
  url: string | null | undefined, 
  type: 'card' | 'detail' | 'avatar' | 'avatar-large' | 'placeholder'
): string {
  if (!url) return '';
  
  // If it's a legacy or external URL, return as-is
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  // Inject real-time Cloudinary CDN optimizations
  if (url.includes('/upload/')) {
    const parts = url.split('/upload/');
    let transformation = 'f_auto,q_auto'; // Auto WebP format & auto quality compression
    
    if (type === 'avatar') {
      transformation = 'c_fill,g_center,w_100,h_100,f_auto,q_auto'; // Small center-cropped avatar
    } else if (type === 'avatar-large') {
      transformation = 'c_fill,g_center,w_400,h_400,f_auto,q_auto'; // Large center-cropped avatar for headers
    } else if (type === 'card') {
      transformation = 'c_limit,w_500,f_auto,q_auto'; // Masonry-grid card optimized preview width (saves ~65% bandwidth)
    } else if (type === 'detail') {
      transformation = 'c_limit,w_1000,f_auto,q_auto'; // Crisp detailed viewport hero width (saves ~50% bandwidth)
    } else if (type === 'placeholder') {
      transformation = 'c_limit,w_20,e_blur:1000,f_auto,q_auto:low'; // Tiny, blurred progressive placeholder (under 1KB)
    }
    
    // Cloudinary format: parts[0] + '/upload/' + transformation + '/' + parts[1] (stripping existing transformations if present)
    const cleanPath = parts[1].replace(/^[^\/]+\/(v\d+)/, '$1'); // ensure we strip any intermediate server transformations
    return `${parts[0]}/upload/${transformation}/${cleanPath}`;
  }
  
  return url;
}
