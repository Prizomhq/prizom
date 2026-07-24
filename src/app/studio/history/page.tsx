'use client';

import React, { useState } from 'react';
import { StudioSubNav } from '@/components/ui/studio/StudioSubNav';
import { 
  History, 
  ArrowDownToLine, 
  Search, 
  Filter, 
  CalendarDays,
  FileJson,
  FileCode,
  Image as ImageIcon,
  Activity,
  CreditCard,
  Zap
} from 'lucide-react';
import Image from 'next/image';

const MOCK_HISTORY_LOGS = [
  {
    id: 'log-10293',
    date: '2026-07-23T14:32:00Z',
    type: 'analyze',
    status: 'success',
    model: 'Midjourney v6',
    promptSnippet: 'A futuristic cybernetic tiger prowling through a neon-lit...',
    creditsCost: 1,
    tokensProcessed: 1450,
    latencyMs: 1240,
    thumbnail: 'https://images.unsplash.com/photo-1549608276-5786777e6587?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'log-10292',
    date: '2026-07-23T12:15:00Z',
    type: 'optimize',
    status: 'success',
    model: 'Stable Diffusion XL',
    promptSnippet: 'Hyper-realistic macro photography of a glowing crystal...',
    creditsCost: 0.5,
    tokensProcessed: 890,
    latencyMs: 650,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'log-10291',
    date: '2026-07-22T09:45:00Z',
    type: 'analyze',
    status: 'failed',
    model: 'Unknown',
    promptSnippet: 'N/A (Analysis Failed - Image Unreadable)',
    creditsCost: 0,
    tokensProcessed: 0,
    latencyMs: 420,
    thumbnail: null
  },
  {
    id: 'log-10290',
    date: '2026-07-21T16:20:00Z',
    type: 'analyze',
    status: 'success',
    model: 'DALL-E 3',
    promptSnippet: 'Isometric 3D render of a cozy coffee shop interior...',
    creditsCost: 1,
    tokensProcessed: 2100,
    latencyMs: 1850,
    thumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=200'
  }
];

export default function StudioHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <StudioSubNav creditBalance={245} />
      
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <History className="w-8 h-8 text-purple-500" />
              History & Telemetry
            </h1>
            <p className="text-zinc-400 mt-2 font-medium max-w-2xl">
              Audit trail of reverse engineering jobs, credit ledger expenditures, token usage telemetry, and batch exports.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-400" />
              Export JSON
            </button>
            <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              Export Markdown
            </button>
          </div>
        </div>

        {/* Telemetry Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-16 h-16 text-purple-400" />
            </div>
            <span className="text-zinc-400 text-sm font-bold flex items-center gap-2">
              Total Operations
            </span>
            <span className="text-3xl font-black text-white">1,248</span>
            <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 w-fit px-2 py-0.5 rounded-full">
              +12% this week
            </span>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-16 h-16 text-blue-400" />
            </div>
            <span className="text-zinc-400 text-sm font-bold flex items-center gap-2">
              Avg. Latency
            </span>
            <span className="text-3xl font-black text-white">840ms</span>
            <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 w-fit px-2 py-0.5 rounded-full">
              -150ms improvement
            </span>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-16 h-16 text-amber-400" />
            </div>
            <span className="text-zinc-400 text-sm font-bold flex items-center gap-2">
              Tokens Processed
            </span>
            <span className="text-3xl font-black text-white">4.2M</span>
            <span className="text-zinc-500 text-xs font-bold">
              All-time usage
            </span>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CreditCard className="w-16 h-16 text-rose-400" />
            </div>
            <span className="text-zinc-400 text-sm font-bold flex items-center gap-2">
              Credits Spent
            </span>
            <span className="text-3xl font-black text-white">890</span>
            <span className="text-zinc-500 text-xs font-bold">
              Lifetime ledger
            </span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by ID, model, or prompt keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none">
              <CalendarDays className="w-4 h-4" />
              Date Range
            </button>
          </div>
        </div>

        {/* Audit Trail Log Table */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/80 border-b border-zinc-800/80">
                <tr>
                  <th className="px-6 py-4 font-bold text-zinc-400">ID / Date</th>
                  <th className="px-6 py-4 font-bold text-zinc-400">Type</th>
                  <th className="px-6 py-4 font-bold text-zinc-400">Target Model</th>
                  <th className="px-6 py-4 font-bold text-zinc-400">Output Snippet</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 text-right">Telemetry</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 text-right">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {MOCK_HISTORY_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-purple-400 font-bold">{log.id}</span>
                        <span className="text-zinc-500 text-xs">
                          {new Date(log.date).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                        )}
                        <span className="capitalize font-bold text-zinc-300">{log.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                      {log.model}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {log.thumbnail ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800">
                            <Image src={log.thumbnail} alt="Thumbnail" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700">
                            <ImageIcon className="w-4 h-4 text-zinc-500" />
                          </div>
                        )}
                        <p className="text-zinc-400 truncate max-w-[250px] lg:max-w-[400px]">
                          {log.promptSnippet}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-zinc-300 font-mono text-xs">{log.latencyMs}ms</span>
                        <span className="text-zinc-500 text-xs">{log.tokensProcessed} tokens</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`font-bold ${log.creditsCost > 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                        {log.creditsCost > 0 ? `-${log.creditsCost}` : '0'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-zinc-900/50 border-t border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-zinc-500 font-medium">
              Showing 1 to 4 of 1,248 entries
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold transition-colors disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
