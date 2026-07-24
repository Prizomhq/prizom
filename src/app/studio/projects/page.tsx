'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StudioSubNav } from '@/components/ui/studio/StudioSubNav';
import { getStudioProjects, togglePinStudioProject, deleteStudioProject, StudioProject } from '@/lib/ai-studio/projects-store';
import { FolderKanban, Pin, Trash2, Search, Plus, Sparkles, Clock, ArrowRight, ExternalLink } from 'lucide-react';

export default function StudioProjectsPage() {
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pinned'>('all');

  useEffect(() => {
    setProjects(getStudioProjects());
  }, []);

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = togglePinStudioProject(id);
    setProjects(updated);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this studio project?')) {
      const updated = deleteStudioProject(id);
      setProjects(updated);
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
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      <StudioSubNav creditBalance={10} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                Workspace Persistence & Version Control
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Studio Projects & Saved Drafts
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium mt-1">
              Organize reverse engineered images, version iterations, and target prompt collections.
            </p>
          </div>

          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-lg active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Reverse Analysis</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, tags, or categories..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              All Projects ({projects.length})
            </button>
            <button
              onClick={() => setFilterTab('pinned')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'pinned'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Pinned ({projects.filter((p) => p.pinned).length})
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-zinc-900 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-lg group hover:border-purple-500/40 transition-all flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-zinc-950 overflow-hidden">
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
                    <div className="flex items-center justify-center h-full text-zinc-600 text-xs font-bold">
                      No Image Preview
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleTogglePin(project.id, e)}
                      className={`p-1.5 rounded-xl backdrop-blur-md border transition-all ${
                        project.pinned
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                      title={project.pinned ? 'Unpin project' : 'Pin project'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="p-1.5 rounded-xl bg-zinc-950/60 text-zinc-400 border border-zinc-800 hover:text-rose-400 hover:border-rose-900 transition-all"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-purple-300 text-[10px] font-extrabold border border-purple-500/30">
                    {project.category}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1 font-medium">
                      {project.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-bold text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1 text-purple-400">
                      <span>v{project.activeVersion} ({project.versionsCount} snaps)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-12 text-center space-y-4">
            <Sparkles className="w-10 h-10 text-purple-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Studio Projects Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto font-medium">
              Upload an image in AI Studio to reverse engineer visual prompts and save project iterations.
            </p>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-lg"
            >
              <span>Launch AI Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
