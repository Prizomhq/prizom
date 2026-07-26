'use client';

import React, { useState } from 'react';
import { Tags, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { 
  createCategoryAction, 
  deleteCategoryAction, 
  createAiToolAction, 
  deleteAiToolAction 
} from '@/app/actions/adminActions';

interface TaxonomyCMSModuleProps {
  initialCms: any;
  onRefresh: () => void;
}

export default function TaxonomyCMSModule({ initialCms, onRefresh }: TaxonomyCMSModuleProps) {
  const [categories, setCategories] = useState<any[]>(initialCms?.categories || []);
  const [aiTools, setAiTools] = useState<any[]>(initialCms?.ai_tools || initialCms?.aiTools || []);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Category state additions
  const [newCatName, setNewCatName] = useState('');

  // AI Tool state additions
  const [newToolName, setNewToolName] = useState('');

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSubmitting(true);
    const res = await createCategoryAction(newCatName.trim());
    setSubmitting(false);

    if (res.success && res.category) {
      setCategories([...categories, res.category]);
      setNewCatName('');
      onRefresh();
    } else {
      setMsg(res.error || 'Failed to create category.');
    }
  };

  const handleRemoveCategory = async (id: string) => {
    setSubmitting(true);
    const res = await deleteCategoryAction(id);
    setSubmitting(false);
    if (res.success) {
      setCategories(categories.filter(c => c.id !== id));
      onRefresh();
    } else {
      alert(res.error || 'Failed to delete category.');
    }
  };

  const handleAddTool = async () => {
    if (!newToolName.trim()) return;
    setSubmitting(true);
    const res = await createAiToolAction(newToolName.trim());
    setSubmitting(false);

    if (res.success && res.tool) {
      setAiTools([...aiTools, res.tool]);
      setNewToolName('');
      onRefresh();
    } else {
      setMsg(res.error || 'Failed to create AI Tool.');
    }
  };

  const handleRemoveTool = async (id: string) => {
    setSubmitting(true);
    const res = await deleteAiToolAction(id);
    setSubmitting(false);
    if (res.success) {
      setAiTools(aiTools.filter(t => t.id !== id));
      onRefresh();
    } else {
      alert(res.error || 'Failed to delete AI Tool.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Categories & AI Tools Taxonomy</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Manage platform prompt categories and AI model tags (ChatGPT, Midjourney, Claude, etc.).</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Categories Panel */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Prompt Categories ({categories.length})</h3>
          
          {/* Add Category Form */}
          <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New Category Name..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add
            </button>
          </div>

          {/* List */}
          <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id || cat.slug || cat.name} className="py-2.5 flex items-center justify-between text-xs font-medium text-zinc-800">
                <div>
                  <span className="font-semibold text-zinc-900">{cat.name}</span>
                  <span className="ml-2 font-mono text-[10px] text-zinc-400">/{cat.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat.id)}
                  disabled={submitting}
                  className="p-1 rounded-md text-zinc-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* AI Tools Panel */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Supported AI Models & Tools ({aiTools.length})</h3>
          
          {/* Add AI Tool Form */}
          <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
            <input
              type="text"
              value={newToolName}
              onChange={(e) => setNewToolName(e.target.value)}
              placeholder="New AI Tool Name..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTool}
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add
            </button>
          </div>

          {/* List */}
          <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
            {aiTools.map((tool) => (
              <div key={tool.id || tool.slug || tool.name} className="py-2.5 flex items-center justify-between text-xs font-medium text-zinc-800">
                <div>
                  <span className="font-semibold text-zinc-900">{tool.name}</span>
                  <span className="ml-2 font-mono text-[10px] text-zinc-400">/{tool.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTool(tool.id)}
                  disabled={submitting}
                  className="p-1 rounded-md text-zinc-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
