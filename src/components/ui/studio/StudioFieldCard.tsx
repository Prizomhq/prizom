'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useStudioState, useStudioDispatch } from './context';

interface StudioFieldCardProps {
  fieldKey: 'title' | 'promptText' | 'negativePrompt' | 'category' | 'tags' | 'aiTool' | 'aspectRatio';
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'tags';
  maxLength?: number;
  required?: boolean;
}

export function StudioFieldCard({
  fieldKey,
  label,
  placeholder,
  type = 'text',
  maxLength = 1000,
  required = false
}: StudioFieldCardProps) {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const [copied, setCopied] = useState(false);

  const currentValue = state.userEdits[fieldKey];
  const stringValue = Array.isArray(currentValue) ? currentValue.join(', ') : currentValue || '';

  const handleChange = (val: string) => {
    if (fieldKey === 'tags') {
      const tagArray = val.split(',').map((t) => t.trim()).filter(Boolean);
      dispatch({ type: 'EDIT_FIELD', field: fieldKey, value: tagArray });
    } else {
      dispatch({ type: 'EDIT_FIELD', field: fieldKey, value: val });
    }
  };

  const handleCopy = () => {
    if (!stringValue) return;
    navigator.clipboard.writeText(stringValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-md hover:border-purple-500/50 transition-colors mb-4 text-white">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1">
          {label} {required && <span className="text-red-400">*</span>}
        </label>

        <div className="flex items-center gap-3">
          {maxLength && (
            <span className="text-[10px] font-mono text-zinc-500">
              {stringValue.length}/{maxLength}
            </span>
          )}
          {stringValue && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-zinc-400 hover:text-purple-400 transition-colors p-1 rounded-lg cursor-pointer"
              title="Copy field text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {type === 'textarea' ? (
        <textarea
          rows={4}
          value={stringValue}
          maxLength={maxLength}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-medium text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
        />
      ) : (
        <input
          type="text"
          value={stringValue}
          maxLength={maxLength}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-medium text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
        />
      )}
    </div>
  );
}
