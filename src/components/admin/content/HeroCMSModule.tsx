'use client';

import React, { useState } from 'react';
import { Home, Save, Loader2, Link as LinkIcon, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { updateHomepageCMSAction } from '@/app/actions/adminActions';

interface HeroCMSModuleProps {
  initialCms: any;
  onRefresh: () => void;
}

export default function HeroCMSModule({ initialCms, onRefresh }: HeroCMSModuleProps) {
  const [cms, setCms] = useState(initialCms?.homepage || initialCms || {});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setSubmitting(true);
    setMsg(null);
    const res = await updateHomepageCMSAction(cms);
    setSubmitting(false);


    if (res.success) {
      setMsg('Hero announcements & CMS settings updated successfully.');
      onRefresh();
    } else {
      setMsg(res.error || 'Failed to update CMS settings.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Homepage Hero & Platform Branding</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Configure main hero headline, announcement banners, and developer profiles.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Banner Announcement */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Top Banner Announcement</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Announcement Text</label>
              <input
                type="text"
                value={cms.heroBannerText || ''}
                onChange={(e) => setCms({ ...cms, heroBannerText: e.target.value })}
                placeholder="e.g. 🎉 Welcome to Prizom 2.0 Studio..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Target Link URL</label>
              <input
                type="text"
                value={cms.heroBannerLink || ''}
                onChange={(e) => setCms({ ...cms, heroBannerLink: e.target.value })}
                placeholder="/studio"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-mono text-zinc-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="bannerEnabled"
                checked={cms.heroBannerEnabled || false}
                onChange={(e) => setCms({ ...cms, heroBannerEnabled: e.target.checked })}
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="bannerEnabled" className="font-semibold text-zinc-700 cursor-pointer">
                Enable Top Announcement Banner
              </label>
            </div>
          </div>
        </div>

        {/* Hero Headline & Subtitle */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Hero Headline Copy</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Hero Title</label>
              <input
                type="text"
                value={cms.heroTitle || ''}
                onChange={(e) => setCms({ ...cms, heroTitle: e.target.value })}
                placeholder="Curated AI Prompt Engineering Library"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Hero Subtitle</label>
              <textarea
                value={cms.heroSubtitle || ''}
                onChange={(e) => setCms({ ...cms, heroSubtitle: e.target.value })}
                placeholder="Discover, remix, and execute production AI prompts..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
