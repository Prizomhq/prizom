import { AGRouterPromptResponse } from './schema';
import { evaluatePromptQuality } from './evaluator';

/**
 * Prizom AI Studio Autonomous Self-Refining Prompt Alignment Engine (Phase 10)
 * Research-Grade closed-loop generative alignment simulation:
 * Reverse Prompt -> Visual Metric Compare ($S_{CLIP}$ + LPIPS + SSIM) -> Autonomous Self-Refinement.
 */

export interface SimulatedVisualMetrics {
  clipAlignmentScore: number; // Target > 0.88
  lpipsDistance: number; // Target < 0.25 (lower is better visual feature match)
  ssimLayoutScore: number; // Target > 0.70
}

export interface AutonomousRefinementResult {
  certified: boolean;
  certificationBadge: string; // e.g. "Prizom Certified High-Fidelity Seal (Score: 94/100)"
  initialScore: number;
  refinedScore: number;
  iterationsRun: number;
  refinedPromptText: string;
  simulatedMetrics: SimulatedVisualMetrics;
  optimizationsApplied: string[];
}

/**
 * Runs generative alignment metric simulation on reconstructed prompt.
 */
export function simulateVisualAlignmentMetrics(promptText: string, style: string): SimulatedVisualMetrics {
  const evalResult = evaluatePromptQuality(promptText, style);
  
  const clipAlignmentScore = evalResult.clipAlignmentScore;
  const lpipsDistance = Math.max(0.12, Math.min(0.35, Math.round((0.35 - clipAlignmentScore * 0.25) * 100) / 100));
  const ssimLayoutScore = Math.max(0.60, Math.min(0.95, Math.round((clipAlignmentScore * 0.90) * 100) / 100));

  return {
    clipAlignmentScore,
    lpipsDistance,
    ssimLayoutScore
  };
}

/**
 * Executes autonomous closed-loop self-refinement.
 * Iteratively refines prompt parameters until fidelity target (>90/100) is reached.
 */
export function runAutonomousSelfRefinementLoop(
  response: AGRouterPromptResponse,
  maxIterations = 3
): AutonomousRefinementResult {
  let currentMain = response.prompt.main;
  const currentStyle = response.prompt.style;
  const optimizationsApplied: string[] = [];

  let iterationsRun = 0;
  let evalResult = evaluatePromptQuality(currentMain, currentStyle, response.prompt.negative);
  const initialScore = evalResult.overallScore;

  // Closed-loop refinement iteration
  while (evalResult.overallScore < 90 && iterationsRun < maxIterations) {
    iterationsRun++;

    // 1. Remove identified contradictions
    if (evalResult.contradictionWarnings.length > 0) {
      currentMain = currentMain.replace(/watercolor/gi, 'digital vector').replace(/cartoon/gi, 'realist');
      optimizationsApplied.push(`Iteration ${iterationsRun}: Eliminated contradictory style keywords`);
    }

    // 2. Remove redundant buzzwords
    if (evalResult.redundantBuzzwordsFound.length > 0) {
      for (const b of evalResult.redundantBuzzwordsFound) {
        const regex = new RegExp(b, 'gi');
        currentMain = currentMain.replace(regex, '');
      }
      optimizationsApplied.push(`Iteration ${iterationsRun}: Stripped redundant buzzwords`);
    }

    // 3. Inject optical & camera precision if missing
    if (response.optics?.focalLength && !currentMain.toLowerCase().includes('mm')) {
      currentMain += `, shot on ${response.optics.focalLength} at ${response.optics.aperture}`;
      optimizationsApplied.push(`Iteration ${iterationsRun}: Injected precise camera focal optics`);
    }

    // Re-evaluate quality
    evalResult = evaluatePromptQuality(currentMain, currentStyle, response.prompt.negative);
  }

  const refinedScore = evalResult.overallScore;
  const simulatedMetrics = simulateVisualAlignmentMetrics(currentMain, currentStyle);
  const certified = refinedScore >= 88;

  const certificationBadge = certified
    ? `Prizom High-Fidelity Certified Seal (Grade: ${evalResult.estimatedFidelityGrade.toUpperCase()} ${refinedScore}/100)`
    : `Standard Prompt Synthesis (Score: ${refinedScore}/100)`;

  return {
    certified,
    certificationBadge,
    initialScore,
    refinedScore,
    iterationsRun,
    refinedPromptText: currentMain.trim(),
    simulatedMetrics,
    optimizationsApplied
  };
}
