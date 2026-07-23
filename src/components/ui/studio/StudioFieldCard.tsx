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
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:border-purple-200 transition-colors mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <div className="flex items-center gap-3">
          {maxLength && (
            <span className="text-[10px] font-bold text-zinc-400">
              {stringValue.length}/{maxLength}
            </span>
          )}
          {stringValue && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-zinc-400 hover:text-purple-600 transition-colors p-1 rounded-lg"
              title="Copy field text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
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
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
        />
      ) : (
        <input
          type="text"
          value={stringValue}
          maxLength={maxLength}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
        />
      )}
    </div>
  );
}
