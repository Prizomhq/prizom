export interface SourceDimensions {
  width: number;
  height: number;
}

export type OrientationType = 'landscape' | 'portrait' | 'square';

export interface StandardRatioDefinition {
  label: string;
  value: number;
  orientation: OrientationType;
  description: string;
}

export interface AspectRatioAnalysisResult {
  source_dimensions: SourceDimensions;
  source_aspect_ratio: string;
  source_ratio_float: number;
  normalized_aspect_ratio: string;
  orientation: OrientationType;
  confidence: number;
  framing_directive: string;
}

export const STANDARD_ASPECT_RATIOS: StandardRatioDefinition[] = [
  { label: '1:1', value: 1.0, orientation: 'square', description: 'Square framing' },
  { label: '4:5', value: 0.8, orientation: 'portrait', description: 'Vertical portrait framing' },
  { label: '5:4', value: 1.25, orientation: 'landscape', description: 'Classic medium landscape' },
  { label: '3:4', value: 0.75, orientation: 'portrait', description: 'Standard vertical portrait' },
  { label: '4:3', value: 1.3333, orientation: 'landscape', description: 'Standard photography landscape' },
  { label: '2:3', value: 0.6667, orientation: 'portrait', description: 'Classic 35mm portrait' },
  { label: '3:2', value: 1.5, orientation: 'landscape', description: 'Classic 35mm landscape' },
  { label: '9:16', value: 0.5625, orientation: 'portrait', description: 'Full mobile vertical display' },
  { label: '16:9', value: 1.7778, orientation: 'landscape', description: 'Widescreen cinematic landscape' },
  { label: '21:9', value: 2.3333, orientation: 'landscape', description: 'Ultra-wide anamorphic cinematic' }
];

/**
 * Layer 1: Exact Mathematical Aspect Ratio Calculation
 */
export function calculateRawFloatRatio(width: number, height: number): number {
  if (!width || !height || width <= 0 || height <= 0) return 1.0;
  return width / height;
}

/**
 * Layer 2: Aspect Ratio Normalization Engine
 * Maps raw float ratio to closest standard ratio within orientation constraint.
 */
export function normalizeAspectRatio(width: number, height: number): {
  normalizedRatio: string;
  confidence: number;
  orientation: OrientationType;
} {
  const rawRatio = calculateRawFloatRatio(width, height);
  const orientation: OrientationType =
    rawRatio > 1.03 ? 'landscape' : rawRatio < 0.97 ? 'portrait' : 'square';

  // Filter candidates matching orientation
  const candidates = STANDARD_ASPECT_RATIOS.filter((r) => r.orientation === orientation);

  let closest = candidates[0] || STANDARD_ASPECT_RATIOS[0];
  let minDiff = Math.abs(rawRatio - closest.value);

  for (let i = 1; i < candidates.length; i++) {
    const diff = Math.abs(rawRatio - candidates[i].value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = candidates[i];
    }
  }

  // Calculate confidence score based on distance metric
  const tolerance = 0.15;
  const confidence = Math.max(0.5, Math.min(1.0, Math.round((1 - minDiff / tolerance) * 100) / 100));

  return {
    normalizedRatio: closest.label,
    confidence,
    orientation
  };
}

/**
 * Layer 3 & 4: Comprehensive 4-Layer Aspect Ratio Pipeline
 */
export function analyzeImageAspectRatio(width: number, height: number): AspectRatioAnalysisResult {
  const rawFloat = calculateRawFloatRatio(width, height);
  const { normalizedRatio, confidence, orientation } = normalizeAspectRatio(width, height);

  const formattedFloat = Math.round(rawFloat * 1000) / 1000;
  const sourceRatioStr = width > height
    ? `${Math.round((width / height) * 100) / 100}:1`
    : `1:${Math.round((height / width) * 100) / 100}`;

  // Formulate composition directive to embed in universal prompt
  let framingDirective = `Maintain original ${normalizedRatio} ${orientation} composition`;
  if (normalizedRatio === '1:1') {
    framingDirective = 'Maintain square 1:1 centered composition with equal margins';
  } else if (normalizedRatio === '16:9' || normalizedRatio === '21:9') {
    framingDirective = `Maintain ${normalizedRatio} widescreen ${orientation} cinematic framing`;
  } else if (normalizedRatio === '4:5' || normalizedRatio === '9:16') {
    framingDirective = `Maintain ${normalizedRatio} vertical ${orientation} subject framing`;
  }

  return {
    source_dimensions: { width, height },
    source_aspect_ratio: sourceRatioStr,
    source_ratio_float: formattedFloat,
    normalized_aspect_ratio: normalizedRatio,
    orientation,
    confidence,
    framing_directive: framingDirective
  };
}
