import {
  UniversalPromptData,
  UniversalPromptSection,
  ComplexityLevel,
  QualityValidationResult,
  EditableVariable
} from './schema';

/**
  * Prizom Universal Prompt Engine
  * Constructs a structured, high-density, reusable visual reconstruction prompt
  * designed for cross-platform image generators.
  */

export function determineComplexityLevel(input: {
  hasText?: boolean;
  detectedTextCount?: number;
  elementCount?: number;
  category?: string;
  descriptionLength?: number;
}): ComplexityLevel {
  const textCount = input.detectedTextCount || 0;
  const isPosterOrGraphic = ['Poster', 'Product', 'Commercial', 'Architecture'].includes(input.category || '');
  const length = input.descriptionLength || 0;

  if (input.hasText || textCount > 0 || isPosterOrGraphic || length > 600) {
    return 'high';
  }

  if (length > 250 || (input.elementCount && input.elementCount > 2)) {
    return 'medium';
  }

  return 'simple';
}

/**
 * Normalizes camera optical claims so they describe visual characteristics
 * without making false claims about exact camera hardware.
 */
export function sanitizeCameraOptics(cameraStr: string): string {
  if (!cameraStr || cameraStr.toLowerCase() === 'none') {
    return 'Eye-level natural perspective with subtle depth falloff.';
  }

  let cleaned = cameraStr;

  // Replace exact hardware claims with visual impression terms
  cleaned = cleaned.replace(/shot on (canon|nikon|sony|leica|hasselblad) [^\s,]+/gi, 'captured with a clean optical lens');
  cleaned = cleaned.replace(/85mm f\/1\.4 prime/gi, 'medium telephoto perspective with shallow depth of field');
  cleaned = cleaned.replace(/35mm f\/1\.8/gi, 'natural wide perspective with cinematic depth separation');
  cleaned = cleaned.replace(/24mm ultra-wide/gi, 'wide-angle optical perspective');
  cleaned = cleaned.replace(/100mm macro prime/gi, 'macro close-up magnification focus');

  return cleaned.trim();
}

/**
 * Builds the 14-section structured Universal Prompt Data object.
 */
export function build14SectionUniversalPrompt(raw: {
  coreConcept?: string;
  subject?: string;
  composition?: string;
  environment?: string;
  lighting?: string;
  colorPalette?: string | string[];
  cameraPhotographic?: string;
  materialsTextures?: string;
  typographyText?: string;
  graphicDesignElements?: string;
  visualStyle?: string;
  technicalQuality?: string;
  negativeConstraints?: string;
  aspectRatio?: string;
  hasText?: boolean;
  detectedText?: string[];
  category?: string;
}): UniversalPromptData {
  const category = raw.category || 'Visual Art';
  const aspectRatio = raw.aspectRatio || '1:1';

  // 1. Core Concept
  const coreConcept = (raw.coreConcept || raw.subject || `A high-fidelity ${category.toLowerCase()} artwork.`).trim();

  // 2. Subject
  const subject = (raw.subject || 'The main focal subject displayed in the reference image.').trim();

  // 3. Composition
  const composition = (raw.composition || 'Balanced framing with structured visual hierarchy across foreground and background layers.').trim();

  // 4. Environment
  const environment = (raw.environment || 'Atmospheric background setting with complementary spatial details.').trim();

  // 5. Lighting
  const lighting = (raw.lighting || 'Directional studio lighting with clear highlight placement and controlled shadow falloff.').trim();

  // 6. Color Palette
  let colorPaletteStr = '';
  if (Array.isArray(raw.colorPalette)) {
    colorPaletteStr = `Dominant color palette: ${raw.colorPalette.join(', ')}. Harmonious contrast with controlled saturation.`;
  } else {
    colorPaletteStr = raw.colorPalette || 'Harmonious color palette with balanced saturation and tonal contrast.';
  }

  // 7. Camera & Photographic Character
  const cameraPhotographic = sanitizeCameraOptics(raw.cameraPhotographic || 'Eye-level perspective with controlled depth of field.');

  // 8. Materials & Textures
  const materialsTextures = (raw.materialsTextures || 'Tactile surface details with natural material shaders and physical texture separation.').trim();

  // 9. Typography / Text Reconstruction
  let typographyText = '';
  if (raw.hasText && Array.isArray(raw.detectedText) && raw.detectedText.length > 0) {
    typographyText = `Visible text reads: "${raw.detectedText.join(' ')}". Display typography with clean font alignment and spatial hierarchy. [OBSERVED]`;
  } else if (raw.typographyText) {
    typographyText = raw.typographyText;
  } else {
    typographyText = 'No prominent visible text detected in reference image. Keep composition clean of random text artifacts. [OBSERVED]';
  }

  // 10. Graphic / Design Elements
  const graphicDesignElements = (raw.graphicDesignElements || 'Clean framing, spatial alignment, and graphic shape hierarchy complement the visual layout.').trim();

  // 11. Visual Style
  const visualStyle = (raw.visualStyle || `${category} aesthetic with distinct artistic rendering characteristics.`).trim();

  // 12. Technical & Quality Characteristics
  const technicalQuality = (raw.technicalQuality || 'Sharp focal detail, clean texture fidelity, subtle film grain, and realistic dynamic range falloff.').trim();

  // 13. Targeted Negative Constraints
  const negativeConstraints = (raw.negativeConstraints || 'Unwanted text artifacts, extra limbs, distorted features, duplicate subjects, unintentional background clutter, heavy plastic skin, oversaturation.').trim();

  // Determine adaptive complexity level
  const complexityLevel = determineComplexityLevel({
    hasText: raw.hasText,
    detectedTextCount: raw.detectedText?.length,
    category,
    descriptionLength: coreConcept.length + subject.length + environment.length
  });

  const sections: UniversalPromptSection[] = [
    { key: 'concept', title: 'Core Concept', content: coreConcept, status: 'observed' },
    { key: 'subject', title: 'Subject & Identity', content: subject, status: 'observed' },
    { key: 'composition', title: 'Composition & Framing', content: composition, status: 'observed' },
    { key: 'environment', title: 'Environment & Setting', content: environment, status: 'observed' },
    { key: 'lighting', title: 'Lighting & Atmosphere', content: lighting, status: 'observed' },
    { key: 'color', title: 'Color Palette', content: colorPaletteStr, status: 'observed' },
    { key: 'camera', title: 'Camera & Optics', content: cameraPhotographic, status: 'inferred' },
    { key: 'materials', title: 'Materials & Textures', content: materialsTextures, status: 'observed' },
    { key: 'typography', title: 'Typography & Text', content: typographyText, status: raw.hasText ? 'observed' : 'uncertain' },
    { key: 'graphics', title: 'Graphic & Design Elements', content: graphicDesignElements, status: 'observed' },
    { key: 'style', title: 'Visual Style', content: visualStyle, status: 'observed' },
    { key: 'technical', title: 'Technical Quality', content: technicalQuality, status: 'inferred' },
    { key: 'constraints', title: 'Targeted Constraints', content: negativeConstraints, status: 'inferred' },
    { key: 'aspectRatio', title: 'Aspect Ratio', content: `Aspect Ratio: ${aspectRatio}`, status: 'observed' }
  ];

  // Construct Markdown representation
  const fullMarkdownPrompt = `# Universal Image Recreation Prompt

## Core Concept
${coreConcept}

## Subject
${subject}

## Composition
${composition}

## Environment
${environment}

## Lighting
${lighting}

## Color Palette
${colorPaletteStr}

## Camera & Visual Characteristics
${cameraPhotographic}

## Materials & Textures
${materialsTextures}

## Typography / Graphic Elements
${typographyText}

## Visual Style
${visualStyle}

## Technical Characteristics
${technicalQuality}

## Negative Constraints
${negativeConstraints}

## Aspect Ratio
${aspectRatio}`;

  // Construct continuous Master Prompt for AI generators
  const masterParts = [
    coreConcept,
    `Subject: ${subject}`,
    `Composition: ${composition}`,
    `Environment: ${environment}`,
    `Lighting: ${lighting}`,
    `Color: ${colorPaletteStr}`,
    `Optics & Style: ${cameraPhotographic}, ${visualStyle}`,
    `Materials: ${materialsTextures}`
  ];

  if (raw.hasText && Array.isArray(raw.detectedText) && raw.detectedText.length > 0) {
    masterParts.push(`Typography text: "${raw.detectedText.join(' ')}"`);
  }

  masterParts.push(`Aspect ratio: ${aspectRatio}`);

  const universalMasterPrompt = masterParts.join('. ');

  return {
    coreConcept,
    subject,
    composition,
    environment,
    lighting,
    colorPalette: colorPaletteStr,
    cameraPhotographic,
    materialsTextures,
    typographyText,
    graphicDesignElements,
    visualStyle,
    technicalQuality,
    negativeConstraints,
    aspectRatio,
    sections,
    fullMarkdownPrompt,
    universalMasterPrompt,
    complexityLevel
  };
}

/**
 * Pre-Output Quality Validation Gate
 */
export function validateUniversalPromptQuality(data: UniversalPromptData): QualityValidationResult {
  const missingSections: string[] = [];
  const feedback: string[] = [];
  let score = 100;

  if (!data.coreConcept || data.coreConcept.length < 5) {
    missingSections.push('Core Concept');
    score -= 20;
    feedback.push('Core concept is missing or too brief.');
  }

  if (!data.subject || data.subject.length < 5) {
    missingSections.push('Subject');
    score -= 20;
    feedback.push('Subject description is missing.');
  }

  if (!data.composition || data.composition.length < 5) {
    missingSections.push('Composition');
    score -= 15;
    feedback.push('Composition framing details missing.');
  }

  if (!data.lighting || data.lighting.length < 5) {
    missingSections.push('Lighting');
    score -= 15;
    feedback.push('Lighting information missing.');
  }

  if (!data.visualStyle || data.visualStyle.length < 3) {
    missingSections.push('Visual Style');
    score -= 15;
    feedback.push('Visual style missing.');
  }

  if (!data.aspectRatio) {
    missingSections.push('Aspect Ratio');
    score -= 15;
    feedback.push('Aspect ratio missing.');
  }

  // Check for quality buzzword contamination ("8k", "ultra HD", "masterpiece")
  if (/8k|ultra hd|masterpiece|award-winning/i.test(data.universalMasterPrompt)) {
    score -= 10;
    feedback.push('Prompt contains quality buzzwords that cause prompt contamination.');
  }

  return {
    isValid: missingSections.length === 0 && score >= 70,
    missingSections,
    score: Math.max(0, score),
    feedback
  };
}

/**
 * Extracts intelligent editable variables from prompt text and JSON elements.
 */
export function extractEditableVariablesFromPrompt(
  promptData: UniversalPromptData,
  hasText?: boolean,
  detectedText?: string[]
): EditableVariable[] {
  const vars: EditableVariable[] = [];

  // Subject Variable
  if (promptData.subject) {
    const mainSubj = promptData.subject.split('.')[0].slice(0, 40);
    vars.push({
      key: 'MAIN_SUBJECT',
      currentValue: mainSubj,
      category: 'subject',
      description: 'Primary subject depicted in image'
    });
  }

  // Text Variable if present
  if (hasText && Array.isArray(detectedText) && detectedText.length > 0) {
    vars.push({
      key: 'HEADLINE_TEXT',
      currentValue: detectedText[0],
      category: 'text',
      description: 'Main visible text in composition'
    });
  }

  // Location / Environment Variable
  if (promptData.environment) {
    const envSummary = promptData.environment.split('.')[0].slice(0, 40);
    vars.push({
      key: 'LOCATION',
      currentValue: envSummary,
      category: 'environment',
      description: 'Environment setting'
    });
  }

  // Primary Color Variable
  if (promptData.colorPalette) {
    const hexMatch = promptData.colorPalette.match(/#[A-Fa-f0-9]{6}/);
    if (hexMatch) {
      vars.push({
        key: 'PRIMARY_COLOR',
        currentValue: hexMatch[0],
        category: 'color',
        description: 'Dominant color accent'
      });
    }
  }

  return vars;
}
