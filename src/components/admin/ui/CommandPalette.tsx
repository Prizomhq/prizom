'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  LayoutDashboard, 
  Users, 
  FileText, 
  ShieldAlert, 
  Mail, 
  Home, 
  Settings, 
  Clock, 
  Activity,
  LogOut,
  ArrowRight
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commandItems = [
    { label: 'Operations Dashboard', path: '/admin', group: 'Navigation', icon: LayoutDashboard },
    { label: 'User Directory & Verification', path: '/admin/users', group: 'Navigation', icon: Users },
    { label: 'Prompt Templates & Catalog', path: '/admin/prompts', group: 'Navigation', icon: FileText },
    { label: 'Reports & Appeals Queue', path: '/admin/reports', group: 'Navigation', icon: ShieldAlert },
    { label: 'Messages & Inquiries', path: '/admin/messages', group: 'Navigation', icon: Mail },
    { label: 'Content CMS & Taxonomy', path: '/admin/content?tab=homepage', group: 'Navigation', icon: Home },
    { label: 'Team & Security Clearance', path: '/admin/content?tab=team', group: 'Navigation', icon: Settings },
    { label: 'Account Lifecycle Queue', path: '/admin/lifecycle', group: 'Navigation', icon: Clock },
    { label: 'Return to Main Site', path: '/', group: 'Quick Actions', icon: Activity },
  ];

  const filtered = commandItems.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.group.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    // Reset selected index when query changes
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          router.push(filtered[selectedIndex].path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
      />

      {/* Palette Surface */}
      <div className="relative bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full text-left overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-zinc-200/80 bg-zinc-50/50">
          <Search className="w-5 h-5 text-zinc-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search page..."
            className="w-full py-4 text-sm font-medium text-zinc-900 bg-transparent placeholder-zinc-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-bold text-zinc-400 bg-zinc-200/60 rounded border border-zinc-300 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-450 font-medium">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    router.push(item.path);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-zinc-400">{item.group}</span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-200/80 flex items-center justify-between text-[11px] text-zinc-450 font-medium">
          <span>Navigate with <kbd className="font-bold text-zinc-600">↑</kbd> <kbd className="font-bold text-zinc-600">↓</kbd></span>
          <span>Select with <kbd className="font-bold text-zinc-600">↵</kbd></span>
        </div>

      </div>
    </div>
  );
}
