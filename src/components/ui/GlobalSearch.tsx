'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Loader2, Sparkles, User, History, ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { searchPrizom } from '@/app/actions/search';

export default function GlobalSearch() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ prompts: any[]; profiles: any[]; tags: string[] }>({
    prompts: [],
    profiles: [],
    tags: []
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'prompts' | 'creators' | 'tags'>('all');
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-prizom-search', handleOpen);
    return () => window.removeEventListener('open-prizom-search', handleOpen);
  }, []);

  // Handle window resizing to detect mobile viewports safely
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile full-screen search overlay is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Load recents from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('prizom_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Reset tab to all if query is empty
  useEffect(() => {
    if (!query.trim()) {
      setActiveTab('all');
    }
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation focus loop trap inside the dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const dropdown = dropdownRef.current;
        const input = inputRef.current;
        if (!dropdown || !input) return;

        const dropdownFocusables = Array.from(
          dropdown.querySelectorAll('button, [href], [tabindex="0"]')
        ) as HTMLElement[];

        const allFocusables = [input, ...dropdownFocusables];
        if (allFocusables.length < 2) return;

        const firstElement = allFocusables[0];
        const lastElement = allFocusables[allFocusables.length - 1];

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
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Debounce search query
  useEffect(() => {
    if (!query.trim()) {
      setResults({ prompts: [], profiles: [], tags: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await searchPrizom(query);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Save query to recent searches
  const saveRecentSearch = (searchVal: string) => {
    if (!searchVal.trim()) return;
    const term = searchVal.trim();
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('prizom_recent_searches', JSON.stringify(updated));
  };

  // Clear a specific recent item
  const clearRecentItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== item);
    setRecentSearches(updated);
    localStorage.setItem('prizom_recent_searches', JSON.stringify(updated));
  };

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeFullSearch(query);
    }
  };

  // Go to full search page
  const executeFullSearch = (searchVal: string) => {
    if (!searchVal.trim()) return;
    saveRecentSearch(searchVal);
    setIsOpen(false);
    router.push(`/discover?query=${encodeURIComponent(searchVal.trim())}`);
  };

  const trendingSearches = [
    'Photorealistic Anime',
    'Cyberpunk City',
    '3D Glassmorphism',
    'Midjourney v6',
    'Cinematic Lighting'
  ];

  const hasResults = results.prompts.length > 0 || results.profiles.length > 0 || results.tags.length > 0;

  const showTags = (activeTab === 'all' || activeTab === 'tags') && results.tags.length > 0;
  const showCreators = (activeTab === 'all' || activeTab === 'creators') && results.profiles.length > 0;
  const showPrompts = (activeTab === 'all' || activeTab === 'prompts') && results.prompts.length > 0;

  const currentTabHasResults = 
    (activeTab === 'all' && hasResults) ||
    (activeTab === 'tags' && results.tags.length > 0) ||
    (activeTab === 'creators' && results.profiles.length > 0) ||
    (activeTab === 'prompts' && results.prompts.length > 0);

  const renderSuggestionsContent = () => {
    // A. RECENT & TRENDING
    if (!query.trim()) {
      return (
        <div className="space-y-6">
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center">
                  <History className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                  Recent Searches
                </span>
                <button 
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('prizom_recent_searches');
                  }}
                  className="text-[10px] font-bold text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between hover:bg-zinc-50 rounded-xl transition-colors group/item"
                  >
                    <button
                      onClick={() => {
                        setQuery(item);
                        executeFullSearch(item);
                      }}
                      className="flex-1 text-left px-3 py-2 text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition-colors focus:outline-none focus-visible:bg-zinc-100 rounded-l-xl cursor-pointer"
                    >
                      {item}
                    </button>
                    <button 
                      onClick={(e) => clearRecentItem(e, item)}
                      className="mr-2 p-1 rounded-full text-zinc-300 hover:text-zinc-650 hover:bg-zinc-200/50 transition-colors cursor-pointer"
                      aria-label={`Remove recent search for ${item}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center mb-3 px-1">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-neon-purple" />
              Trending Searches
            </span>
            <div className="flex flex-wrap gap-2 px-1">
              {trendingSearches.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag);
                    executeFullSearch(tag);
                  }}
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200/60 hover:border-electric-blue hover:bg-white text-xs font-bold text-zinc-600 hover:text-electric-blue rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{tag}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // B. SKELETON SEARCH LOADER
    if (loading) {
      return (
        <div className="py-8 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-neon-purple mb-2" />
          <p className="text-xs text-zinc-400 font-bold">Scanning prompts...</p>
        </div>
      );
    }

    // C. SEARCH RESULTS
    return (
      <div className="space-y-5">
        <div className="flex border-b border-zinc-100 pb-3 gap-2 flex-wrap">
          {(['all', 'prompts', 'creators', 'tags'] as const).map((tab) => {
            const label = tab === 'all' ? 'All' : tab === 'prompts' ? 'Prompts' : tab === 'creators' ? 'Creators' : 'Tags';
            const isActive = activeTab === tab;
            let count = 0;
            if (tab === 'prompts') count = results.prompts.length;
            else if (tab === 'creators') count = results.profiles.length;
            else if (tab === 'tags') count = results.tags.length;
            else if (tab === 'all') count = results.prompts.length + results.profiles.length + results.tags.length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border
                  ${isActive 
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                  }
                `}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {!currentTabHasResults ? (
          <div className="text-center py-8">
            <p className="text-sm font-bold text-zinc-500">No results found in this category</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-[240px] mx-auto leading-relaxed">Try switching tabs or check other results.</p>
          </div>
        ) : (
          <>
            {showTags && (
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Tags</span>
                  {activeTab === 'all' && results.tags.length > 0 && (
                    <button
                      onClick={() => setActiveTab('tags')}
                      className="text-[9px] font-bold text-zinc-400 hover:text-neon-purple transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      View All ({results.tags.length})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {results.tags.map(tag => (
                    <Link
                      key={tag}
                      href={`/discover?tag=${tag}`}
                      onClick={() => {
                        saveRecentSearch(query);
                        setIsOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-extrabold text-zinc-600 hover:text-electric-blue hover:border-blue-200 shadow-sm transition-all"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {showCreators && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Creators</span>
                  {activeTab === 'all' && results.profiles.length > 0 && (
                    <button
                      onClick={() => setActiveTab('creators')}
                      className="text-[9px] font-bold text-zinc-400 hover:text-neon-purple transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      View All ({results.profiles.length})
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {results.profiles.map(profile => (
                    <Link
                      key={profile.id}
                      href={`/creator/${profile.username}`}
                      onClick={() => {
                        saveRecentSearch(query);
                        setIsOpen(false);
                      }}
                      className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/50 transition-colors group"
                    >
                      <Avatar
                        src={profile.avatar_url}
                        username={profile.username}
                        size="sm"
                        className="border border-zinc-200/50 shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-sm font-extrabold text-zinc-900 group-hover:text-neon-purple transition-colors truncate">
                          {profile.full_name || profile.username}
                        </span>
                        <span className="text-xs font-bold text-zinc-400 truncate mt-0.5">
                          @{profile.username}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {showPrompts && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Prompts & Remixes</span>
                  {activeTab === 'all' && results.prompts.length > 0 && (
                    <button
                      onClick={() => setActiveTab('prompts')}
                      className="text-[9px] font-bold text-zinc-400 hover:text-neon-purple transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      View All ({results.prompts.length})
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {results.prompts.map(prompt => (
                    <Link
                      key={prompt.id}
                      href={`/prompt/${prompt.id}`}
                      onClick={() => {
                        saveRecentSearch(query);
                        setIsOpen(false);
                      }}
                      className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/50 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200 relative">
                        {prompt.image_url ? (
                          <img src={prompt.image_url} alt={prompt.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="text-sm font-extrabold text-zinc-900 group-hover:text-neon-purple transition-colors truncate">
                          {prompt.title}
                        </span>
                        <div className="flex items-center space-x-2 mt-0.5">
                          {prompt.remix_of ? (
                            <span className="text-[9px] font-black text-purple-500 uppercase tracking-wider bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-md">
                              ⚡ Remix
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                              🌿 Original
                            </span>
                          )}
                          {prompt.remix_count > 0 && (
                            <span className="text-[9px] font-bold text-zinc-400">
                              {prompt.remix_count} remixes
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => executeFullSearch(query)}
              className="w-full pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-black text-electric-blue uppercase tracking-wider cursor-pointer hover:text-neon-purple transition-colors px-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/50 rounded-lg"
            >
              <span>Search all prompts for "{query}"</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    );
  };

  if (isMobile && isOpen) {
    if (!mounted || typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed inset-0 bg-white z-[10000] flex flex-col pt-[env(safe-area-inset-top,0px)] pointer-events-auto">
        {/* Mobile Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-150 shrink-0">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-11 h-11 -ml-2 text-zinc-600 hover:text-zinc-900 rounded-full hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              autoFocus
              type="text"
              placeholder="Search AI prompts, tags, creators..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-base py-2.5 pl-3 pr-16 bg-zinc-50 border border-zinc-200/80 rounded-xl leading-5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-neon-purple focus:ring-4 focus:ring-neon-purple/10 font-medium transition-all"
            />
            {query && (
              <div className="absolute inset-y-0 right-1 flex items-center space-x-1">
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-zinc-400 hover:text-zinc-650 rounded-full cursor-pointer relative after:content-[''] after:absolute after:-inset-3"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => executeFullSearch(query)}
                  className="w-7 h-7 bg-neon-purple hover:bg-neon-purple/90 text-white rounded-full transition-all flex items-center justify-center cursor-pointer animate-in fade-in relative after:content-[''] after:absolute after:-inset-2"
                  aria-label="Execute search"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Suggestions / Results */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] bg-white">
          {renderSuggestionsContent()}
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="relative w-full max-w-full group" ref={dropdownRef}>
      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 text-neon-purple animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-neon-purple transition-colors" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search AI prompts, tags, creators..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`block w-full pl-11 ${query ? 'pr-20' : 'pr-10'} py-2.5 border border-zinc-200/80 rounded-full leading-5 bg-zinc-50/50 text-zinc-900 placeholder-zinc-400/90 focus:outline-none focus:bg-white focus:border-neon-purple focus:ring-4 focus:ring-neon-purple/10 sm:text-sm font-medium transition-all duration-300 shadow-xs`}
        />
        {query && (
          <div className="absolute inset-y-0 right-2 flex items-center space-x-1.5">
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer relative after:content-[''] after:absolute after:-inset-3"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => executeFullSearch(query)}
              className="w-7 h-7 bg-neon-purple hover:bg-neon-purple/90 text-white rounded-full transition-all duration-200 hover:shadow-md active:scale-95 flex items-center justify-center cursor-pointer relative after:content-[''] after:absolute after:-inset-2"
              aria-label="Execute search"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Dropdown Suggestions Overlay */}
      {isOpen && (
        <div className="absolute top-[110%] left-0 right-0 bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-[2rem] shadow-2xl p-5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto z-50">
          {renderSuggestionsContent()}
        </div>
      )}
    </div>
  );
}
