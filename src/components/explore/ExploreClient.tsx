'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Sparkles, 
  Loader2, 
  Settings,
  Grid
} from 'lucide-react';
import PromptCard from '@/components/ui/PromptCard';
import MasonryGrid from '@/components/ui/MasonryGrid';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { fetchRecommendedPrompts } from '@/app/actions/recommendations';
import { getUserInterests, trackUserActivity } from '@/lib/recommendations-client';

interface ExploreClientProps {
  categories: any[];
  aiTools: any[];
  isLoggedIn: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  activeFilters: {
    query?: string;
    category?: string;
    tool?: string;
    aspectRatio?: string;
  };
}

export default function ExploreClient({
  categories = [],
  aiTools = [],
  isLoggedIn,
  isAdmin = false,
  currentUserId,
  activeFilters
}: ExploreClientProps) {
  const router = useRouter();
  
  // Local state for search text and filter drawer
  const [searchVal, setSearchVal] = useState(activeFilters.query || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchVal);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Debounce input changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Filter states
  const [activeCategory, setActiveCategory] = useState(activeFilters.category || '');
  const [activeTool, setActiveTool] = useState(activeFilters.tool || '');
  const [activeAspectRatio, setActiveAspectRatio] = useState(activeFilters.aspectRatio || '');

  // Feed states
  const [prompts, setPrompts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observerRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Focus trap inside the filter drawer
  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const drawer = drawerRef.current;
        if (!drawer) return;

        const focusables = Array.from(
          drawer.querySelectorAll('button, select, input, [href], [tabindex="0"]')
        ) as HTMLElement[];
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      } else if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Sync state if filters change externally
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchVal(activeFilters.query || '');
    setActiveCategory(activeFilters.category || '');
    setActiveTool(activeFilters.tool || '');
    setActiveAspectRatio(activeFilters.aspectRatio || '');
  }, [activeFilters]);

  // Load feed when filters change
  useEffect(() => {
    async function loadFilteredFeed() {
      setLoading(true);
      setPage(0);
      try {
        const interests = getUserInterests();
        const res = await fetchRecommendedPrompts({
          page: 0,
          limit: 12,
          interests,
          filters: {
            query: debouncedSearch,
            category: activeCategory,
            tool: activeTool,
            aspectRatio: activeAspectRatio
          }
        });
        setPrompts(res.prompts);
        setHasMore(res.hasMore);
        setPage(1);
      } catch (err) {
        console.error('Failed to load explore feed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFilteredFeed();
  }, [debouncedSearch, activeCategory, activeTool, activeAspectRatio]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const cleanTerm = term.trim();
    const saved = localStorage.getItem('prizom_recent_searches');
    let recents: string[] = [];
    if (saved) {
      try { recents = JSON.parse(saved); } catch (e) {}
    }
    const updated = [cleanTerm, ...recents.filter(s => s !== cleanTerm)].slice(0, 5);
    localStorage.setItem('prizom_recent_searches', JSON.stringify(updated));
  };

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadingRef.current = true;
          setLoadingMore(true);
          try {
            const interests = getUserInterests();
            const res = await fetchRecommendedPrompts({
              page,
              limit: 12,
              interests,
              filters: {
                query: debouncedSearch,
                category: activeCategory,
                tool: activeTool,
                aspectRatio: activeAspectRatio
              }
            });
            
            if (res.prompts.length > 0) {
              setPrompts((prev) => {
                const existingIds = new Set(prev.map(p => p.id));
                const newPrompts = res.prompts.filter(p => !existingIds.has(p.id));
                return [...prev, ...newPrompts];
              });
              setHasMore(res.hasMore);
              setPage((prev) => prev + 1);
            } else {
              setHasMore(false);
            }
          } catch (err) {
            console.error('Failed to load more explore prompts:', err);
          } finally {
            setLoadingMore(false);
            loadingRef.current = false;
          }
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, loading, loadingMore, debouncedSearch, activeCategory, activeTool, activeAspectRatio]);

  // Handle category visual card selection
  const handleCategorySelect = (catName: string) => {
    const nextCat = activeCategory === catName ? '' : catName;
    setActiveCategory(nextCat);
    
    if (nextCat) {
      trackUserActivity('category', { category: nextCat });
    }
  };

  const getCategoryCoverImage = (cat: any) => {
    if (cat.cover_image) return cat.cover_image;
    const defaults: Record<string, string> = {
      cinematic: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop',
      anime: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop',
      realistic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop',
      fantasy: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop',
      portrait: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop',
      'character-design': 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=500&auto=format&fit=crop',
      fashion: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop',
      'product-photography': 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop',
      architecture: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop',
      landscape: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&auto=format&fit=crop',
      'sci-fi': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop',
      cyberpunk: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop',
      'concept-art': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop',
      'logo-design': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&auto=format&fit=crop',
      '3d-render': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop'
    };
    return defaults[cat.id] || defaults[cat.name.toLowerCase()] || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop`;
  };

  const clearAllFilters = () => {
    setSearchVal('');
    setActiveCategory('');
    setActiveTool('');
    setActiveAspectRatio('');
    setDrawerOpen(false);
  };

  const activeFiltersCount = [
    activeCategory,
    activeTool,
    activeAspectRatio
  ].filter(Boolean).length;

  // Render Category visual cards (Approved and visible)
  const visibleCategories = categories
    .filter(c => c.approved && c.show_on_explore)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 pt-10">
      
      {/* 1. Header & Search Hub */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-2 leading-none">
          Discover Prompt Universe
        </h1>
        <p className="text-zinc-500 font-semibold text-sm max-w-lg mb-8">
          Personalized discovery feed. Search templates or select categories below.
        </p>

        {/* Global Hub Search Bar */}
        <div className="relative w-full max-w-2xl flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search prompts by title, description, creator..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onClick={(e) => {
                if (window.innerWidth < 768) {
                  window.dispatchEvent(new Event('open-prizom-search'));
                }
              }}
              onFocus={(e) => {
                if (window.innerWidth < 768) {
                  e.target.blur();
                  window.dispatchEvent(new Event('open-prizom-search'));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveRecentSearch(searchVal);
                  router.push(`/discover?query=${encodeURIComponent(searchVal.trim())}`);
                }
              }}
              className={`block w-full pl-11 ${searchVal ? 'pr-10' : 'pr-4'} py-3.5 border border-zinc-200 rounded-full bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-neon-purple)] focus:ring-2 focus:ring-[var(--color-neon-purple)]/10 text-sm font-bold shadow-sm transition-all duration-300`}
            />
            {searchVal && (
              <button
                onClick={() => {
                  setSearchVal('');
                  router.push('/discover');
                }}
                className="absolute inset-y-0 right-3.5 flex items-center text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className={`px-4 py-3.5 sm:px-5 border rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm shrink-0
              ${activeFiltersCount > 0 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100' 
                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }
            `}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-indigo-650 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          {isAdmin && (
            <button
              onClick={() => router.push('/admin/content')}
              className="px-4 py-3.5 bg-zinc-950 text-white border border-transparent rounded-full text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
              title="Manage Categories"
            >
              <Settings className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">CMS</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Visual Category Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative overflow-hidden">
        <div className="absolute left-4 top-4 bottom-4 w-8 bg-gradient-to-r from-[#fcfcfc] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-4 top-4 bottom-4 w-8 bg-gradient-to-l from-[#fcfcfc] to-transparent z-10 pointer-events-none" />
        <div className="flex overflow-x-auto gap-4 py-4 scrollbar-hide snap-x snap-mandatory">
          {visibleCategories.map((cat) => {
            const isSelected = activeCategory === cat.name;
            const coverImg = getCategoryCoverImage(cat);
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.name)}
                className={`flex-none w-48 h-32 rounded-3xl overflow-hidden relative group snap-start transition-all duration-300 border-2 select-none text-left
                  ${isSelected 
                    ? 'border-[var(--color-neon-purple)] shadow-lg scale-98' 
                    : 'border-transparent shadow-sm hover:shadow-md hover:scale-102'
                  }
                `}
              >
                {/* Background Cover Image */}
                <img 
                  src={coverImg} 
                  alt={cat.name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Visual Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300
                  ${isSelected ? 'from-purple-950/80 to-purple-950/20' : 'from-black/70 to-black/20 group-hover:from-black/80'}
                `} />

                {/* Text Context */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <h3 className="text-sm font-black text-white leading-tight uppercase tracking-wider flex items-center gap-1">
                    {cat.name}
                    {isSelected && <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />}
                  </h3>
                  {cat.description && (
                    <p className="text-[10px] text-zinc-300 font-semibold line-clamp-1 mt-0.5">
                      {cat.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Slide-out advanced filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[9000] flex justify-end pointer-events-auto">
          <div 
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
          />
          <div ref={drawerRef} className="relative w-full max-w-md h-full bg-white shadow-2xl p-8 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-5 mb-6">
                <h3 className="text-lg font-black text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
                  Filter parameters
                </h3>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto max-h-[75vh] pr-2 no-scrollbar">
                
                {/* AI Tool */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">AI Tool Model</label>
                  <select
                    value={activeTool}
                    onChange={(e) => setActiveTool(e.target.value)}
                    className="block w-full py-2.5 px-3 border border-zinc-200 rounded-xl bg-white text-zinc-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All AI Tools</option>
                    {aiTools.map((t: any) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio Filter */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">Aspect Ratio Shape</label>
                  <select
                    value={activeAspectRatio}
                    onChange={(e) => setActiveAspectRatio(e.target.value)}
                    className="block w-full py-2.5 px-3 border border-zinc-200 rounded-xl bg-white text-zinc-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Ratios</option>
                    <option value="1:1">Square (1:1)</option>
                    <option value="4:5">Portrait (4:5)</option>
                    <option value="3:4">Portrait (3:4)</option>
                    <option value="9:16">Vertical (9:16)</option>
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="21:9">Ultra Wide (21:9)</option>
                    <option value="2:3">2:3 Portrait</option>
                    <option value="3:2">3:2 Landscape</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 border-t border-zinc-100 pt-6 mt-4">
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex-1 py-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-full text-xs font-black uppercase tracking-wider transition-colors"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 py-3 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-lg text-white rounded-full text-xs font-black uppercase tracking-wider transition-all"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Display Content Layout: Infinite Masonry Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dynamic header title */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-5 mb-8">
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wide flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-500" />
            {activeCategory ? `${activeCategory} Prompts` : 'All Prompt Discoveries'}
            {prompts.length > 0 && <span className="text-zinc-500 font-semibold text-xs lowercase">({prompts.length} loaded)</span>}
          </h2>
        </div>

        {loading ? (
          <MasonryGrid>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </MasonryGrid>
        ) : prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center max-w-2xl mx-auto mt-8">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-[1.5rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner">
                <Search className="w-10 h-10 text-zinc-300" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight">No results found</h3>
            <p className="text-zinc-500 font-medium text-sm leading-relaxed mb-2">
              {searchVal
                ? <>No prompts match <strong className="text-zinc-800">&quot;{searchVal}&quot;</strong>. Try different keywords or clear your filters.</>
                : "No prompts match your active filters. Try a different combination."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-8">
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-black text-white transition-all bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] rounded-full hover:shadow-[0_8px_25px_rgba(168,85,247,0.3)] hover:-translate-y-0.5"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            </div>
            {visibleCategories.length > 0 && (
              <div className="w-full">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Try browsing a category</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {visibleCategories.slice(0, 6).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSearchVal(''); setActiveCategory(cat.name); }}
                      className="px-4 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 font-bold text-xs hover:border-[var(--color-neon-purple)] hover:text-[var(--color-neon-purple)] transition-all"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <MasonryGrid>
              {prompts.map((prompt) => (
                <PromptCard 
                  key={prompt.id} 
                  id={prompt.id}
                  title={prompt.title}
                  imageUrl={prompt.image_url}
                  tool={prompt.ai_tool}
                  creator={{ 
                    username: prompt.profiles?.username || 'unknown',
                    displayName: prompt.profiles?.full_name,
                    avatarUrl: prompt.profiles?.avatar_url,
                    badges: prompt.profiles?.badges
                  }}
                  likes={prompt.likes_count}
                  saves={prompt.saves_count}
                  description={prompt.description}
                  tags={prompt.tags}
                  remixOf={prompt.remix_of}
                  remixCount={prompt.remix_count}
                  aspectRatio={prompt.aspect_ratio}
                  category={prompt.category}
                  imageWidth={prompt.image_width}
                  imageHeight={prompt.image_height}
                />
              ))}
            </MasonryGrid>

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div ref={observerRef} className="flex justify-center items-center py-10 w-full">
                {loadingMore ? (
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-6 py-3 border border-zinc-200/50 rounded-full shadow-md">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-neon-purple)]" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-600">Discovering more prompts...</span>
                  </div>
                ) : (
                  <div className="h-4 w-full" />
                )}
              </div>
            )}

            {!hasMore && prompts.length > 0 && (
              <div className="flex justify-center items-center py-16 text-center text-zinc-500 text-xs font-black uppercase tracking-widest border-t border-zinc-100 mt-10">
                ✨ End of Discover ✨
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
