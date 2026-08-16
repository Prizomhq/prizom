'use client';

import React, { useState } from 'react';
import { Home, Save, Loader2, Link as LinkIcon, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { updateHomepageCMSAction } from '@/app/actions/adminActions';

interface HeroCMSModuleProps {
  initialCms: any;
  onRefresh: () => void;
}

export default function HeroCMSModule({ initialCms, onRefresh }: HeroCMSModuleProps) {
  const initialData = initialCms?.homepage || initialCms || {};
  const [cms, setCms] = useState({
    heroTitle: initialData.heroTitle || initialData.hero_title || '',
    heroSubtitle: initialData.heroSubtitle || initialData.hero_subtitle || '',
    heroBannerText: initialData.heroBannerText || initialData.banner_text || initialData.announcement || '',
    heroBannerLink: initialData.heroBannerLink || initialData.banner_link || '/studio',
    heroBannerEnabled: initialData.heroBannerEnabled ?? initialData.show_banner ?? initialData.show_announcement ?? false,
    showStudioBanner: initialData.showStudioBanner ?? initialData.show_studio_banner ?? true,
    studioBannerTitle: initialData.studioBannerTitle || initialData.studio_banner_title || '',
    studioBannerDesc: initialData.studioBannerDesc || initialData.studio_banner_desc || '',
    studioBannerCtaText: initialData.studioBannerCtaText || initialData.studio_banner_cta_text || '',
    studioBannerCtaLink: initialData.studioBannerCtaLink || initialData.studio_banner_cta_link || '/studio',
    ...initialData,
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setSubmitting(true);
    setMsg(null);

    // Synchronize both camelCase and snake_case property keys to guarantee CMS compatibility
    const updatedCms = {
      ...cms,
      hero_title: cms.heroTitle,
      heroTitle: cms.heroTitle,
      hero_subtitle: cms.heroSubtitle,
      heroSubtitle: cms.heroSubtitle,
      banner_text: cms.heroBannerText,
      heroBannerText: cms.heroBannerText,
      announcement: cms.heroBannerText,
      banner_link: cms.heroBannerLink,
      heroBannerLink: cms.heroBannerLink,
      show_banner: cms.heroBannerEnabled,
      show_announcement: cms.heroBannerEnabled,
      heroBannerEnabled: cms.heroBannerEnabled,
      show_studio_banner: cms.showStudioBanner,
      showStudioBanner: cms.showStudioBanner,
      studio_banner_title: cms.studioBannerTitle,
      studioBannerTitle: cms.studioBannerTitle,
      studio_banner_desc: cms.studioBannerDesc,
      studioBannerDesc: cms.studioBannerDesc,
      studio_banner_cta_text: cms.studioBannerCtaText,
      studioBannerCtaText: cms.studioBannerCtaText,
      studio_banner_cta_link: cms.studioBannerCtaLink,
      studioBannerCtaLink: cms.studioBannerCtaLink,
    };

    const res = await updateHomepageCMSAction(updatedCms);
    setSubmitting(false);

    if (res.success) {
      setMsg('Hero & banner CMS settings updated successfully.');
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
          <h2 className="text-base font-bold text-zinc-900">Homepage Hero & Banner Controls</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Configure main hero headline, top announcement banners, and AI Studio showcase section.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
        
        {/* Top Banner Announcement */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Top Announcement Banner</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Announcement Text</label>
              <input
                type="text"
                value={cms.heroBannerText || ''}
                onChange={(e) => setCms({ ...cms, heroBannerText: e.target.value })}
                placeholder="e.g. 🎉 Explore photorealistic AI prompt formulas & apply for AI Studio Early Access..."
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

        {/* AI Studio Showcase Section Control */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">AI Studio Showcase Banner Section</h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showStudioBanner"
                checked={cms.showStudioBanner ?? true}
                onChange={(e) => setCms({ ...cms, showStudioBanner: e.target.checked })}
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="showStudioBanner" className="font-semibold text-xs text-zinc-700 cursor-pointer">
                Visible on Landing Page
              </label>
            </div>
          </div>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Section Headline Title (optional override)</label>
              <input
                type="text"
                value={cms.studioBannerTitle || ''}
                onChange={(e) => setCms({ ...cms, studioBannerTitle: e.target.value })}
                placeholder="Turn Any Image Into Detailed Reusable Prompts"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Section Subtitle / Description (optional override)</label>
              <textarea
                value={cms.studioBannerDesc || ''}
                onChange={(e) => setCms({ ...cms, studioBannerDesc: e.target.value })}
                placeholder="AI Studio is our visual intelligence suite designed to help creators reverse engineer visual ideas..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={cms.studioBannerCtaText || ''}
                  onChange={(e) => setCms({ ...cms, studioBannerCtaText: e.target.value })}
                  placeholder="Get Early Access"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">CTA Button Link</label>
                <input
                  type="text"
                  value={cms.studioBannerCtaLink || ''}
                  onChange={(e) => setCms({ ...cms, studioBannerCtaLink: e.target.value })}
                  placeholder="/studio"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-mono text-zinc-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Headline & Subtitle */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4 lg:col-span-2">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Hero Headline Copy</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

