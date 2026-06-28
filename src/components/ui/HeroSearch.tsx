'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function HeroSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/discover?query=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/discover');
    }
  };

  return (
    <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
      <div className="relative flex items-center bg-white/90 backdrop-blur-xl border border-zinc-200/50 rounded-full p-2 shadow-lg">
        <div className="pl-4 pr-2 text-zinc-400">
          <Search className="w-6 h-6" />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for 'cyberpunk city', 'anime portrait'..." 
          className="w-full bg-transparent border-none outline-none py-3 px-2 text-lg text-zinc-900 placeholder:text-zinc-400"
        />
        <button type="submit" className="bg-zinc-900 text-white font-bold px-8 py-3.5 rounded-full hover:bg-zinc-800 transition-colors whitespace-nowrap cursor-pointer">
          Search
        </button>
      </div>
    </form>
  );
}
