import { runUniversalPromptBenchmark, comparePromptEnginesAB } from '../src/lib/ai-studio/benchmark';

console.log('================================================================');
console.log('   PRIZOM AI STUDIO — 200-IMAGE BENCHMARK & A/B TEST HARNESS   ');
console.log('================================================================\n');

const benchmarkRun = runUniversalPromptBenchmark();
console.log(`[BENCHMARK RUN RESULTS]`);
console.log(`Total Test Specs Analyzed: ${benchmarkRun.total}`);
console.log(`Passed Benchmark Gate (Score >= 85 & Valid): ${benchmarkRun.passed} / ${benchmarkRun.total}`);
console.log(`Quantitative Average Quality Score: ${benchmarkRun.averageScore}%`);
console.log(`Overall Pass Rate: ${benchmarkRun.passRate}%\n`);

console.log('--- A/B PROMPT ENGINE COMPARISON ---');
const abResult = comparePromptEnginesAB();
console.log(`Legacy Engine Average Score: ${abResult.legacyEngineAverageScore}%`);
console.log(`V3 Universal Vision Engine Average Score: ${abResult.newEngineAverageScore}%`);
console.log(`Measurable Quality Improvement: +${abResult.improvementPercentage}%`);
console.log(`Legacy Pass Rate: ${abResult.legacyPassRate}%`);
console.log(`V3 Universal Pass Rate: ${abResult.newPassRate}%\n`);

if (benchmarkRun.averageScore >= 90) {
  console.log('✅ BENCHMARK VERDICT: WORLD-CLASS BENCHMARK ACHIEVED (Score >= 90%)');
} else {
  console.log('⚠️ BENCHMARK VERDICT: READY FOR INTERNAL TESTING (Score < 90%)');
}
console.log('================================================================');
