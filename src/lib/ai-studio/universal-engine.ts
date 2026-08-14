import {
  UniversalPromptData,
  UniversalPromptSection,
  ComplexityLevel,
  QualityValidationResult,
  EditableVariable
} from './schema';
import { AspectRatioAnalysisResult } from './aspect-ratio';

/**
 * Prizom Universal Prompt Engine (V3 World-Class Edition)
 * Constructs a high-density, grounded, cross-model visual reconstruction recipe.
 */

export function stripQualityBuzzwords(text: string): string {
  if (!text) return '';
  return text
    .replace(/\b(8k|4k|uhd|ultra hd|hd|hyperrealistic|photorealistic quality|masterpiece|award winning|trending on artstation|best quality|top quality|unreal engine 5|octane render|blender 3d)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function determineComplexityLevel(input: {
  hasText?: boolean;
  detectedTextCount?: number;
  elementCount?: number;
  category?: string;
  descriptionLength?: number;
}): ComplexityLevel {
  const textCount = input.detectedTextCount || 0;
  const isComplexCategory = ['Poster', 'Product', 'Commercial', 'Architecture', 'Fashion', 'Cyberpunk', 'Fantasy'].includes(input.category || '');
  const length = input.descriptionLength || 0;

  if (input.hasText || textCount > 0 || (isComplexCategory && length > 350) || length > 600) {
    return 'high';
  }

  if (length > 200 || (input.elementCount && input.elementCount > 2)) {
    return 'medium';
  }

  return 'simple';
}

export function sanitizeCameraOptics(cameraStr: string): string {
  if (!cameraStr || cameraStr.toLowerCase() === 'none') {
    return 'Eye-level optical perspective with clean focus and natural depth falloff.';
  }

  let cleaned = cameraStr;
  cleaned = cleaned.replace(/shot on (canon|nikon|sony|leica|hasselblad) [^\s,]+/gi, 'captured with a calibrated optical prime lens');
  cleaned = cleaned.replace(/85mm f\/1\.4 prime/gi, 'medium telephoto perspective with shallow depth of field falloff');
  cleaned = cleaned.replace(/35mm f\/1\.8/gi, 'natural perspective with cinematic depth separation');
  cleaned = cleaned.replace(/24mm ultra-wide/gi, 'wide-angle perspective with crisp edge resolution');
  cleaned = cleaned.replace(/100mm macro prime/gi, 'macro close-up focus with fine surface detail');

  return stripQualityBuzzwords(cleaned);
}

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
  aspectRatioDetails?: AspectRatioAnalysisResult;
  hasText?: boolean;
  detectedText?: string[];
  category?: string;
}): UniversalPromptData {
  const category = raw.category || 'Visual Art';
  const aspectRatio = raw.aspectRatioDetails?.normalized_aspect_ratio || raw.aspectRatio || '1:1';
  const framingDirective = raw.aspectRatioDetails?.framing_directive || `Maintain original ${aspectRatio} composition`;

  // 1. Core Concept
  const coreConcept = stripQualityBuzzwords(raw.coreConcept || raw.subject || `A high-fidelity ${category.toLowerCase()} visual reconstruction.`);

  // 2. Subject & Identity
  const subject = stripQualityBuzzwords(raw.subject || 'Primary subject positioned clearly in the frame.');

  // 3. Composition & Framing
  const composition = stripQualityBuzzwords(`${raw.composition || 'Balanced visual framing with distinct foreground and background layers.'}. ${framingDirective}.`);

  // 4. Environment & Setting
  const environment = stripQualityBuzzwords(raw.environment || 'Contextual background environment complementary to the focal subject.');

  // 5. Lighting & Atmosphere
  const lighting = stripQualityBuzzwords(raw.lighting || 'Directional lighting with controlled highlight placement and natural shadow falloff.');

  // 6. Color Palette
  let colorPaletteStr = '';
  if (Array.isArray(raw.colorPalette)) {
    colorPaletteStr = `Dominant palette: ${raw.colorPalette.join(', ')}. Controlled color harmony and balanced saturation.`;
  } else {
    colorPaletteStr = stripQualityBuzzwords(raw.colorPalette || 'Harmonious color palette with controlled contrast.');
  }

  // 7. Camera & Optics
  const cameraPhotographic = sanitizeCameraOptics(raw.cameraPhotographic || 'Eye-level optical perspective with controlled depth of field.');

  // 8. Materials & Textures
  const materialsTextures = stripQualityBuzzwords(raw.materialsTextures || 'Natural surface shaders with distinct tactile texture details.');

  // 9. Typography / Text
  let typographyText = '';
  if (raw.hasText && Array.isArray(raw.detectedText) && raw.detectedText.length > 0) {
    typographyText = `Visible text reads: "${raw.detectedText.join(' ')}". Clean display typography with structured spatial alignment.`;
  } else if (raw.typographyText) {
    typographyText = stripQualityBuzzwords(raw.typographyText);
  } else {
    typographyText = 'No prominent visible text. Keep background free of random text artifacts.';
  }

  // 10. Graphic / Design Elements
  const graphicDesignElements = stripQualityBuzzwords(raw.graphicDesignElements || 'Structured spatial alignment and clean shape hierarchy.');

  // 11. Visual Style
  const visualStyle = stripQualityBuzzwords(raw.visualStyle || `${category} aesthetic with distinct visual rendering characteristics.`);

  // 12. Technical Quality
  const technicalQuality = stripQualityBuzzwords(raw.technicalQuality || 'Sharp focal clarity, clean texture fidelity, dynamic contrast, and fine optical falloff.');

  // 13. Negative Constraints
  const negativeConstraints = stripQualityBuzzwords(raw.negativeConstraints || 'Blurry, low resolution, distorted features, extra limbs, duplicate subjects, random text artifacts, plastic skin sheen.');

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

  const fullMarkdownPrompt = `# Prizom Universal Reconstruction Spec

## Core Concept
${coreConcept}

## Subject
${subject}

## Composition & Framing
${composition}

## Environment
${environment}

## Lighting & Atmosphere
${lighting}

## Color Palette
${colorPaletteStr}

## Camera & Visual Characteristics
${cameraPhotographic}

## Materials & Textures
${materialsTextures}

## Typography / Text Elements
${typographyText}

## Visual Style
${visualStyle}

## Technical Characteristics
${technicalQuality}

## Negative Constraints
${negativeConstraints}

## Aspect Ratio
${aspectRatio}`;

  // Build high-density continuous master prompt for cross-model generation
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

export function validateUniversalPromptQuality(data: UniversalPromptData): QualityValidationResult {
  const missingSections: string[] = [];
  const feedback: string[] = [];
  let score = 100;

  if (!data.coreConcept || data.coreConcept.length < 5) {
    missingSections.push('Core Concept');
    score -= 20;
    feedback.push('Core concept is missing or underspecified.');
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
    feedback.push('Lighting analysis missing.');
  }

  if (!data.visualStyle || data.visualStyle.length < 3) {
    missingSections.push('Visual Style');
    score -= 15;
    feedback.push('Visual style classification missing.');
  }

  if (!data.aspectRatio) {
    missingSections.push('Aspect Ratio');
    score -= 15;
    feedback.push('Aspect ratio missing.');
  }

  // Anti-buzzword check
  if (/8k|ultra hd|masterpiece|award-winning|trending on artstation/i.test(data.universalMasterPrompt)) {
    score -= 15;
    feedback.push('Prompt contains quality buzzword contamination.');
  }

  return {
    isValid: missingSections.length === 0 && score >= 75,
    missingSections,
    score: Math.max(0, score),
    feedback
  };
}

export function extractEditableVariablesFromPrompt(
  promptData: UniversalPromptData,
  hasText?: boolean,
  detectedText?: string[]
): EditableVariable[] {
  const vars: EditableVariable[] = [];

  if (promptData.subject) {
    const mainSubj = promptData.subject.split('.')[0].slice(0, 40);
    vars.push({
      key: 'MAIN_SUBJECT',
      currentValue: mainSubj,
      category: 'subject',
      description: 'Primary subject depicted in image'
    });
  }

  if (hasText && Array.isArray(detectedText) && detectedText.length > 0) {
    vars.push({
      key: 'HEADLINE_TEXT',
      currentValue: detectedText[0],
      category: 'text',
      description: 'Main visible headline text'
    });
  }

  if (promptData.environment) {
    const envSummary = promptData.environment.split('.')[0].slice(0, 40);
    vars.push({
      key: 'LOCATION',
      currentValue: envSummary,
      category: 'environment',
      description: 'Environment setting'
    });
  }

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
