'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getStudioProjects, togglePinStudioProject, deleteStudioProject, StudioProject } from '@/lib/ai-studio/projects-store';
import { getUserStudioHistoryAction, deleteStudioSessionAction } from '@/app/actions/studio';
import { FolderKanban, Pin, Trash2, Search, Plus, Sparkles, Clock, ArrowRight, Loader2 } from 'lucide-react';

export function StudioProjectsClient() {
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pinned'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUserProjects() {
      try {
        const localProjects = getStudioProjects();
        const serverRes = await getUserStudioHistoryAction();
        
        if (serverRes.success && serverRes.history && isMounted) {
          const serverProjects: StudioProject[] = serverRes.history.map(({ session, latestVersion }: any) => {
            const rawAg = latestVersion?.ag_router_response;
            let parsedAg: any = null;
            if (rawAg) {
              if (typeof rawAg === 'string') {
                try { parsedAg = JSON.parse(rawAg); } catch (_) {}
              } else if (typeof rawAg === 'object') {
                parsedAg = rawAg;
              }
            }

            const promptTitle = latestVersion?.prompt_text && latestVersion.prompt_text !== 'Visual prompt deconstruction'
              ? latestVersion.prompt_text.slice(0, 40) + '...'
              : (parsedAg?.metadata?.title || 'Studio Prompt Deconstruction');

            return {
              id: session.id,
              title: promptTitle,
              description: latestVersion?.prompt_text || 'AI image reverse engineering analysis',
              imageUrl: session.cloudinary_url,
              aspectRatio: session.aspect_ratio || '1:1',
              category: parsedAg?.metadata?.category || 'Concept Art',
              tags: ['prizom-studio'],
              pinned: false,
              activeVersion: session.active_version || 1,
              versionsCount: 1,
              agRouterResponse: parsedAg,
              createdAt: session.created_at,
              updatedAt: session.updated_at
            };
          });

          // Merge server projects with local projects (server projects take precedence)
          const mergedMap = new Map<string, StudioProject>();
          serverProjects.forEach(p => mergedMap.set(p.id, p));
          localProjects.forEach(p => {
            if (!mergedMap.has(p.id)) mergedMap.set(p.id, p);
          });

          setProjects(Array.from(mergedMap.values()));
        } else if (isMounted) {
          setProjects(localProjects);
        }
      } catch (err) {
        console.error('Failed to load user studio history:', err);
        if (isMounted) setProjects(getStudioProjects());
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUserProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = togglePinStudioProject(id);
    setProjects(updated);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this studio project?')) {
      const updated = deleteStudioProject(id);
      setProjects(updated);
      await deleteStudioSessionAction(id).catch(() => {});
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterTab === 'pinned') return matchesSearch && p.pinned;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900 pb-20">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 border border-slate-200/80 rounded-3xl p-6 shadow-sm glass-card">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                Studio Workspace & Saved Drafts
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Studio Projects
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
              Organize reconstructed image prompts, saved iterations, and prompt collections.
            </p>
          </div>

          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-indigo-300" />
            <span>New Generation</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, tags, or categories..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              All Projects ({projects.length})
            </button>
            <button
              onClick={() => setFilterTab('pinned')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterTab === 'pinned'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Pinned ({projects.filter((p) => p.pinned).length})
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="bg-white/80 border border-slate-200/80 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Loading studio project history...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white/90 border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm group hover:border-indigo-300 transition-all flex flex-col glass-card"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden border-b border-slate-100">
                  {project.imageUrl ? (
                    <Image
                      src={project.imageUrl}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs font-bold">
                      No Image Preview
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleTogglePin(project.id, e)}
                      className={`p-1.5 rounded-xl backdrop-blur-md border transition-all ${
                        project.pinned
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-white/80 text-slate-500 border-slate-200 hover:text-slate-900'
                      }`}
                      title={project.pinned ? 'Unpin project' : 'Pin project'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="p-1.5 rounded-xl bg-white/80 text-slate-500 border border-slate-200 hover:text-rose-600 hover:border-rose-200 transition-all"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-extrabold backdrop-blur-md">
                    {project.category}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 font-medium leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1 text-indigo-600">
                      <span>v{project.activeVersion}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 glass-card shadow-sm">
            <Sparkles className="w-10 h-10 text-indigo-600 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">No Studio Projects Found</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
              Upload an image in AI Studio to reconstruct visual prompts and save your generations.
            </p>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all shadow-md"
            >
              <span>Launch AI Studio</span>
              <ArrowRight className="w-4 h-4 text-indigo-300" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

