import { CameraOptics, LightingAnalysis, SpatialElement, TypographyExtraction } from './schema';

/**
 * Prizom AI Studio Perception Analyzer Engine (Phase 3)
 * Synthesizes deep optical camera parameters, volumetric lighting vectors,
 * surface PBR material properties, and spatial layout metadata.
 */

export function analyzeCameraOptics(mainPrompt: string, style: string, composition: string): CameraOptics {
  const lower = (mainPrompt + ' ' + style + ' ' + composition).toLowerCase();

  let focalLength = '50mm standard prime';
  let aperture = 'f/2.8';
  let shotType = 'Medium shot';
  let cameraAngle = 'Eye-level angle';
  let depthOfField = 'Balanced natural depth of field';
  let lensCharacter = 'Pristine optical clarity, neutral distortion';

  if (lower.includes('portrait') || lower.includes('face') || lower.includes('close-up') || lower.includes('close up')) {
    focalLength = '85mm f/1.4 portrait prime';
    aperture = 'f/1.4';
    shotType = 'Tight portrait close-up';
    depthOfField = 'Extremely shallow depth of field with smooth creamy bokeh';
    lensCharacter = 'Soft background separation, subtle edge vignetting';
  } else if (lower.includes('macro') || lower.includes('micro') || lower.includes('dewdrop') || lower.includes('extreme close')) {
    focalLength = '100mm macro lens (1:1 magnification)';
    aperture = 'f/4.0';
    shotType = 'Extreme macro detail';
    depthOfField = 'Razor-thin depth of field with magnified micro-textures';
    lensCharacter = 'High optical resolution micro-contrast';
  } else if (lower.includes('wide') || lower.includes('landscape') || lower.includes('architecture') || lower.includes('panoramic')) {
    focalLength = '24mm ultra-wide architectural lens';
    aperture = 'f/8.0';
    shotType = 'Wide environmental landscape';
    depthOfField = 'Deep focus with edge-to-edge sharpness';
    lensCharacter = 'Rectilinear wide-angle perspective correction';
  } else if (lower.includes('cyberpunk') || lower.includes('cinematic') || lower.includes('film')) {
    focalLength = '35mm anamorphic prime';
    aperture = 'f/1.8';
    shotType = 'Cinematic environmental medium shot';
    cameraAngle = 'Low angle heroic perspective';
    depthOfField = 'Cinematic anamorphic depth of field';
    lensCharacter = 'Horizontal oval bokeh flares, subtle chromatic aberration';
  }

  return {
    focalLength,
    aperture,
    shotType,
    cameraAngle,
    depthOfField,
    lensCharacter
  };
}

export function analyzeLighting(mainPrompt: string, style: string, lightingStr: string): LightingAnalysis {
  const lower = (mainPrompt + ' ' + style + ' ' + lightingStr).toLowerCase();

  let primaryType = 'Diffused soft studio illumination';
  let directionality = '45-degree key light with fill bounce';
  let colorTemperature = '5500K balanced daylight';
  const atmosphericEffects: string[] = [];
  let ambientLevel = 'Balanced dynamic range exposure';

  if (lower.includes('neon') || lower.includes('cyberpunk') || lower.includes('cyan')) {
    primaryType = 'Dual-tone neon volumetric lighting';
    directionality = 'Split cyan key light with magenta rim backlighting';
    colorTemperature = 'Cool 7500K ambient with saturated neon highlights';
    atmosphericEffects.push('Volumetric fog', 'Reflective wet surface glow');
    ambientLevel = 'High contrast dark atmosphere';
  } else if (lower.includes('golden hour') || lower.includes('sunset') || lower.includes('warm')) {
    primaryType = 'Natural golden hour low-angle sunlight';
    directionality = 'Direct warm rim lighting from behind subject';
    colorTemperature = 'Warm 3200K tungsten golden glow';
    atmosphericEffects.push('Sunburst lens flare', 'Warm atmospheric haze');
    ambientLevel = 'Soft golden shadow drop-off';
  } else if (lower.includes('chiaroscuro') || lower.includes('black and white') || lower.includes('monochrome') || lower.includes('dramatic')) {
    primaryType = 'High contrast chiaroscuro spotlight';
    directionality = 'Steep hard directional key light';
    colorTemperature = 'Monochrome tonal spectrum';
    atmosphericEffects.push('Deep void shadows');
    ambientLevel = 'Extreme high-key chiaroscuro contrast';
  } else if (lower.includes('soft') || lower.includes('daylight') || lower.includes('window')) {
    primaryType = 'Diffused North-window natural daylight';
    directionality = 'Side window soft wrap light';
    colorTemperature = '6000K overcast daylight';
    atmosphericEffects.push('Subtle dust motes');
    ambientLevel = 'Low contrast ambient shadow detail';
  }

  return {
    primaryType,
    directionality,
    colorTemperature,
    atmosphericEffects,
    ambientLevel
  };
}

export function extractSpatialLayout(mainPrompt: string, composition: string): { elements: SpatialElement[]; layoutSummary: string } {
  const elements: SpatialElement[] = [
    {
      label: 'Primary Subject',
      layer: 'midground',
      bbox: [200, 250, 800, 750],
      description: 'Central focus point of the visual composition'
    },
    {
      label: 'Foreground Accents',
      layer: 'foreground',
      bbox: [700, 100, 950, 900],
      description: 'Out-of-focus framing elements and ground reflections'
    },
    {
      label: 'Background Environment',
      layer: 'background',
      bbox: [0, 0, 1000, 1000],
      description: 'Atmospheric environment setting and ambient backdrop'
    }
  ];

  return {
    elements,
    layoutSummary: composition || 'Centered composition with structured depth separation across foreground, midground, and background.'
  };
}

export function extractTypography(mainPrompt: string): TypographyExtraction {
  const hasText = mainPrompt.toLowerCase().includes('text') || mainPrompt.toLowerCase().includes('sign') || mainPrompt.toLowerCase().includes('logo');
  
  return {
    hasText,
    detectedText: hasText ? ['PRIZOM AI'] : [],
    fontStyle: hasText ? 'Bold geometric sans-serif display typography' : 'None',
    placement: hasText ? 'Centered display alignment' : 'None'
  };
}
