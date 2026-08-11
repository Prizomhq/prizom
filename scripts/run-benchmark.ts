import { runUniversalPromptBenchmark } from '../src/lib/ai-studio/benchmark.js';

console.log('====================================================');
console.log('  PRIZOM AI STUDIO — UNIVERSAL PROMPT BENCHMARK    ');
console.log('====================================================\n');

const suite = runUniversalPromptBenchmark();

console.log(`Total Test Cases: ${suite.total}`);
console.log(`Passed (Score >= 80%): ${suite.passed} / ${suite.total}`);
console.log(`Average Quality Score: ${suite.averageScore}%\n`);

console.log('--- DETAILED PER-IMAGE BREAKDOWN ---');
suite.results.forEach((res, index) => {
  const badge = res.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${index + 1}/${suite.total}] ${badge} (${res.score}%) - ${res.specName} [${res.complexityLevel.toUpperCase()}]`);
  console.log(`    Subject: ${res.subjectCompleteness}% | Comp: ${res.compositionAccuracy}% | Light: ${res.lightingPrecision}% | Text: ${res.typographyPreservation}%`);
  if (res.feedback.length > 0) {
    console.log(`    Feedback: ${res.feedback.join('; ')}`);
  }
});

console.log('\n====================================================');
console.log(`  BENCHMARK COMPLETED: ${suite.passed === suite.total ? 'ALL TESTS PASSED!' : 'SOME TESTS NEED ATTENTION'}`);
console.log('====================================================');
