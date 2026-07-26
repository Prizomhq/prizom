'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Trash2, Edit, Save, Loader2, AlertCircle } from 'lucide-react';
import { getExploreSectionsAction, createExploreSectionAction, editExploreSectionAction, deleteExploreSectionAction } from '@/app/actions/adminActions';


export default function ExploreCMSModule() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // New section form
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState<'curated' | 'algorithmic'>('curated');

  const loadSections = () => {
    setLoading(true);
    getExploreSectionsAction().then(res => {
      if (res.success && res.sections) {
        setSections(res.sections);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSections();
  }, []);

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setMsg(null);

    const res = await createExploreSectionAction(
      title.trim(),
      type === 'algorithmic' ? 'dynamic' : 'curated'
    );
    setSubmitting(false);


    if (res.success) {
      setTitle('');
      setSubtitle('');
      setMsg('Created new explore section.');
      loadSections();
    } else {
      setMsg(res.error || 'Failed to create section.');
    }
  };

  const handleDeleteSection = async (id: string) => {
    setSubmitting(true);
    const res = await deleteExploreSectionAction(id);
    setSubmitting(false);
    if (res.success) {
      loadSections();
    } else {
      alert(res.error || 'Failed to delete section.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Explore Collections & Curated Rows</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Manage featured explore sections and algorithmic prompt collections.</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Section Form */}
        <form onSubmit={handleCreateSection} className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Create New Collection Row</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Collection Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Top Midjourney V6 Prompts"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Subtitle / Description</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Curated photorealistic AI prompts..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Collection Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none"
              >
                <option value="curated">Curated (Manually Picked Prompts)</option>
                <option value="algorithmic">Algorithmic (Auto-populated by Likes)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Collection Row
            </button>
          </div>
        </form>

        {/* Existing Sections List */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Active Explore Collections ({sections.length})</h3>

          {loading ? (
            <div className="py-8 text-center text-zinc-400 gap-2 flex flex-col items-center">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-xs">Loading collection rows...</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
              {sections.map((sec) => (
                <div key={sec.id} className="py-3 flex items-center justify-between gap-4 text-xs font-medium text-zinc-800">
                  <div>
                    <h4 className="font-bold text-zinc-900">{sec.title}</h4>
                    <p className="text-zinc-500 text-[11px] mt-0.5">{sec.subtitle || 'No subtitle specified.'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-semibold uppercase">
                      {sec.type}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(sec.id)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
