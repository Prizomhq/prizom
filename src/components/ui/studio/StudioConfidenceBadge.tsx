'use client';

import React from 'react';
import { ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';

interface StudioConfidenceBadgeProps {
  confidenceScore?: number;
  qualityScore?: number;
  safetyScore?: number;
  estimatedQuality?: string;
}

export function StudioConfidenceBadge({
  confidenceScore = 0.9,
  qualityScore = 0.88,
  safetyScore = 0.99,
  estimatedQuality = 'high'
}: StudioConfidenceBadgeProps) {
  const getQualityBadgeColor = () => {
    if (qualityScore >= 0.85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (qualityScore >= 0.70) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm mb-6">
      {/* Quality Badge */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${getQualityBadgeColor()}`}>
        <Sparkles className="w-3.5 h-3.5" />
        <span>Quality: {Math.round(qualityScore * 100)}% ({estimatedQuality.toUpperCase()})</span>
      </div>

      {/* Confidence Score */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
        <span>Confidence: {Math.round(confidenceScore * 100)}%</span>
      </div>

      {/* Safety Pass */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Safety Pass: {Math.round(safetyScore * 100)}%</span>
      </div>

      {qualityScore < 0.70 && (
        <div className="w-full mt-2 text-xs font-semibold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Low quality score detected. Review and adjust prompt parameters before publishing.</span>
        </div>
      )}
    </div>
  );
}
