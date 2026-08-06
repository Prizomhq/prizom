/**
 * Prizom AI Studio Style DNA Extraction Engine & Fine Art Classifier (Phase 3 Modernization)
 * Analyzes visual signatures, K-Means palette distributions, Kelvin color temperatures,
 * HSL color harmonies, artistic mediums, and historical movement aesthetics.
 */

export interface StyleDNA {
  medium: string;
  movement: string;
  colorTemperatureKelvin: number;
  colorHarmony: 'Monochromatic' | 'Analogous' | 'Complementary' | 'Triadic' | 'Complex Palette';
  colorPaletteRgb: Array<{ hex: string; rgb: [number, number, number]; weight: number }>;
  contrastRatio: number; // 1.0 to 21.0 scale
  aestheticTags: string[];
  lightingVector: string;
  shadingType: string;
}

/**
 * Converts Hex color string to RGB tuple.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return [128, 128, 128];
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Converts RGB tuple to Hex color string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Converts RGB tuple to HSL tuple (Hue: 0-360, Saturation: 0-100, Lightness: 0-100).
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;

  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case nr: h = (ng - nb) / d + (ng < nb ? 6 : 0); break;
      case ng: h = (nb - nr) / d + 2; break;
      case nb: h = (nr - ng) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Classifies Color Harmony based on HSL hue distributions across dominant palette colors.
 */
export function classifyColorHarmony(rgbs: Array<[number, number, number]>): 'Monochromatic' | 'Analogous' | 'Complementary' | 'Triadic' | 'Complex Palette' {
  if (rgbs.length < 2) return 'Monochromatic';

  const hues = rgbs.map(([r, g, b]) => rgbToHsl(r, g, b)[0]);
  
  // Calculate max hue distance
  let maxHueDiff = 0;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      let diff = Math.abs(hues[i] - hues[j]);
      if (diff > 180) diff = 360 - diff;
      if (diff > maxHueDiff) maxHueDiff = diff;
    }
  }

  if (maxHueDiff < 30) return 'Monochromatic';
  if (maxHueDiff < 60) return 'Analogous';
  if (maxHueDiff >= 150 && maxHueDiff <= 210) return 'Complementary';
  if (maxHueDiff >= 100 && maxHueDiff <= 140) return 'Triadic';

  return 'Complex Palette';
}

/**
 * K-Means Color Quantizer for RGB pixel arrays.
 * Clusters raw RGB pixels into k dominant colors with cluster weights.
 */
export function quantizeRgbPalette(
  pixelRgbs: Array<[number, number, number]>,
  k = 5
): Array<{ hex: string; rgb: [number, number, number]; weight: number }> {
  if (!pixelRgbs || pixelRgbs.length === 0) {
    return [
      { hex: '#A855F7', rgb: [168, 85, 247], weight: 0.2 },
      { hex: '#06B6D4', rgb: [6, 182, 212], weight: 0.2 },
      { hex: '#0F172A', rgb: [15, 23, 42], weight: 0.2 },
      { hex: '#1E293B', rgb: [30, 41, 59], weight: 0.2 },
      { hex: '#F43F5E', rgb: [244, 63, 94], weight: 0.2 }
    ];
  }

  // Initialize centroids by evenly sampling input pixels
  const step = Math.floor(pixelRgbs.length / k);
  let centroids: Array<[number, number, number]> = [];
  for (let i = 0; i < k; i++) {
    centroids.push(pixelRgbs[(i * step) % pixelRgbs.length]);
  }

  // 3 iterations of K-Means clustering
  for (let iter = 0; iter < 3; iter++) {
    const clusters: Array<Array<[number, number, number]>> = Array.from({ length: k }, () => []);

    for (const [r, g, b] of pixelRgbs) {
      let minDistance = Infinity;
      let closestIdx = 0;

      for (let cIdx = 0; cIdx < k; cIdx++) {
        const [cr, cg, cb] = centroids[cIdx];
        const dist = Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = cIdx;
        }
      }
      clusters[closestIdx].push([r, g, b]);
    }

    // Recompute centroids
    centroids = clusters.map((cluster, cIdx) => {
      if (cluster.length === 0) return centroids[cIdx];
      const sumR = cluster.reduce((acc, p) => acc + p[0], 0);
      const sumG = cluster.reduce((acc, p) => acc + p[1], 0);
      const sumB = cluster.reduce((acc, p) => acc + p[2], 0);
      return [
        Math.round(sumR / cluster.length),
        Math.round(sumG / cluster.length),
        Math.round(sumB / cluster.length)
      ];
    });
  }

  const totalPixels = pixelRgbs.length || 1;

  return centroids.map(([r, g, b]) => ({
    hex: rgbToHex(r, g, b),
    rgb: [r, g, b] as [number, number, number],
    weight: Math.round((1 / k) * 100) / 100
  }));
}

/**
 * Estimates Color Temperature in Kelvin from RGB values.
 * Uses McCamy's approximation algorithm.
 */
export function calculateKelvinFromRgb(r: number, g: number, b: number): number {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;

  const X = nr * 0.4124 + ng * 0.3576 + nb * 0.1805;
  const Y = nr * 0.2126 + ng * 0.7152 + nb * 0.0722;
  const Z = nr * 0.0193 + ng * 0.1192 + nb * 0.9505;

  const sum = X + Y + Z;
  if (sum === 0) return 5500;

  const x = X / sum;
  const y = Y / sum;

  const n = (x - 0.3320) / (0.1858 - y);
  const CCT = 449 * Math.pow(n, 3) + 3525 * Math.pow(n, 2) + 6823.3 * n + 5520.33;

  return Math.max(2000, Math.min(10000, Math.round(CCT)));
}

/**
 * Calculates visual contrast ratio between dominant palette colors.
 */
export function calculateContrastRatio(rgbs: Array<[number, number, number]>): number {
  if (rgbs.length < 2) return 4.5;

  const getLuminance = ([r, g, b]: [number, number, number]) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const lums = rgbs.map(getLuminance).sort((a, b) => b - a);
  const maxLum = lums[0];
  const minLum = lums[lums.length - 1];

  return Math.round(((maxLum + 0.05) / (minLum + 0.05)) * 10) / 10;
}

/**
 * Main Style DNA Extractor.
 * Computes exact mathematical color vectors, color harmony, fine art medium, movement, and shading.
 */
export function extractStyleDNA(
  mainPrompt: string,
  style: string,
  lighting: string,
  colorPalette: string[] = ['#1E293B', '#0F172A', '#6366F1', '#F8FAFC']
): StyleDNA {
  const combined = (mainPrompt + ' ' + style + ' ' + lighting).toLowerCase();

  // 1. Process RGB Color Palette & Kelvin Temperature
  const paletteRgb = colorPalette.map((hex) => {
    const rgb = hexToRgb(hex);
    return {
      hex,
      rgb,
      weight: Math.round((1 / colorPalette.length) * 100) / 100
    };
  });

  const avgRgb: [number, number, number] = [
    Math.round(paletteRgb.reduce((acc, c) => acc + c.rgb[0], 0) / paletteRgb.length),
    Math.round(paletteRgb.reduce((acc, c) => acc + c.rgb[1], 0) / paletteRgb.length),
    Math.round(paletteRgb.reduce((acc, c) => acc + c.rgb[2], 0) / paletteRgb.length)
  ];

  const colorTemperatureKelvin = calculateKelvinFromRgb(avgRgb[0], avgRgb[1], avgRgb[2]);
  const contrastRatio = calculateContrastRatio(paletteRgb.map(p => p.rgb));
  const colorHarmony = classifyColorHarmony(paletteRgb.map(p => p.rgb));

  // 2. Classify Fine Art Medium
  let medium = 'Digital Art Illustration';
  if (combined.includes('photo') || combined.includes('camera') || combined.includes('portrait') || combined.includes('editorial')) {
    medium = 'Photographic Film';
  } else if (combined.includes('3d') || combined.includes('render') || combined.includes('octane') || combined.includes('unreal')) {
    medium = '3D Octane / Ray-traced Render';
  } else if (combined.includes('oil') || combined.includes('impasto') || combined.includes('canvas')) {
    medium = 'Impasto Oil Painting';
  } else if (combined.includes('watercolor') || combined.includes('gouache')) {
    medium = 'Watercolor & Gouache';
  } else if (combined.includes('anime') || combined.includes('cel') || combined.includes('ghibli')) {
    medium = 'Cel-shaded Anime Illustration';
  } else if (combined.includes('vector') || combined.includes('branding') || combined.includes('icon')) {
    medium = 'Vector Graphic Illustration';
  }

  // 3. Classify Movement Aesthetics
  let movement = 'Contemporary Digital Synthesis';
  if (combined.includes('cyberpunk') || combined.includes('neon') || combined.includes('hologram')) {
    movement = 'Cyberpunk & Futuristic Realism';
  } else if (combined.includes('scandinavian') || combined.includes('minimalist') || combined.includes('clean')) {
    movement = 'Scandinavian Architectural Minimalism';
  } else if (combined.includes('fashion') || combined.includes('vogue') || combined.includes('monochrome')) {
    movement = 'High Fashion Editorial & Chiaroscuro';
  } else if (combined.includes('macro') || combined.includes('nature') || combined.includes('dewdrop')) {
    movement = 'Hyper-realist Macro Botany';
  } else if (combined.includes('ghibli') || combined.includes('meadow')) {
    movement = 'Studio Ghibli Pastoral Impressionism';
  } else if (combined.includes('baroque') || combined.includes('dramatic')) {
    movement = 'Baroque Dramatic Chiaroscuro';
  }

  // 4. Shading & Lighting Vectors
  let shadingType = 'PBR Physically Based Shading';
  if (combined.includes('cel-shaded') || combined.includes('anime')) {
    shadingType = 'Toon / Cel Shading';
  } else if (combined.includes('chiaroscuro') || combined.includes('high contrast')) {
    shadingType = 'Chiaroscuro Deep Shadow Play';
  } else if (combined.includes('subsurface') || combined.includes('skin')) {
    shadingType = 'Subsurface Scattering (SSS) Shading';
  } else if (combined.includes('vector') || combined.includes('flat')) {
    shadingType = 'Flat Vector Shading';
  }

  const aestheticTags = [
    medium.toLowerCase().replace(/[\/\s]+/g, '-'),
    movement.toLowerCase().replace(/[\/\s]+/g, '-'),
    colorHarmony.toLowerCase().replace(/\s+/g, '-'),
    colorTemperatureKelvin < 4000 ? 'warm-toned' : colorTemperatureKelvin > 6500 ? 'cool-toned' : 'neutral-white-balance',
    contrastRatio > 7 ? 'high-contrast' : 'soft-contrast'
  ];

  return {
    medium,
    movement,
    colorTemperatureKelvin,
    colorHarmony,
    colorPaletteRgb: paletteRgb,
    contrastRatio,
    aestheticTags,
    lightingVector: lighting || 'Diffused directional illumination',
    shadingType
  };
}

