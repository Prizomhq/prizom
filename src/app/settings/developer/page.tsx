'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Key, Copy, Check, Terminal, RefreshCw, Zap, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function DeveloperSettingsPage() {
  const [apiKey, setApiKey] = useState('prz_ent_8f92a4b1c3d5e6f7');
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://api.myagency.com/prizom-webhook');

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    if (confirm('Are you sure you want to regenerate your API Key? All existing integrations will break immediately.')) {
      setApiKey('prz_ent_' + Math.random().toString(36).substring(2, 15));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="w-8 h-8 text-indigo-500" />
            <h1 className="text-3xl font-black tracking-tight">Developer Platform</h1>
          </div>
          <p className="text-zinc-400 max-w-2xl">
            Manage your Enterprise API keys, configure webhooks, and monitor your usage for the AI Studio V2 reverse engineering engine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* API Key Panel */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-indigo-400" />
                Enterprise API Key
              </h2>
              <p className="text-sm text-zinc-400 mb-4">
                Use this key to authenticate requests to <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">/api/v1/studio/analyze</code>. Do not share this key in public repositories.
              </p>
              
              <div className="flex items-center gap-3 bg-black border border-zinc-800 rounded-xl p-3">
                <input 
                  type="password"
                  value={apiKey}
                  readOnly
                  className="bg-transparent border-none outline-none flex-1 text-zinc-300 font-mono text-sm"
                />
                <button 
                  onClick={handleCopy}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
                  title="Copy API Key"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Key is active
                </span>
                <button 
                  onClick={handleRegenerate}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate Key
                </button>
              </div>
            </div>

            {/* Webhook Configuration */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Webhook Endpoint</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Receive async HTTP callbacks when batch analysis jobs complete.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Endpoint URL</label>
                  <input 
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button className="px-4 py-2 bg-white text-black font-bold rounded-xl text-sm hover:bg-zinc-200 transition-colors">
                  Save Webhook
                </button>
              </div>
            </div>
            
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quota & Usage */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="w-16 h-16 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-6">Current Cycle Usage</h2>
              
              <div className="space-y-4 relative z-10">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">API Requests</span>
                    <span className="font-bold text-white">4,250 / 10,000</span>
                  </div>
                  <div className="w-full bg-black rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '42.5%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Cache Hits (0 cost)</span>
                    <span className="font-bold text-emerald-400">1,820</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentation Links */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Resources</h2>
              <div className="space-y-3">
                <Link href="#" className="flex items-center justify-between text-sm text-zinc-400 hover:text-indigo-400 transition-colors group">
                  <span>API Documentation</span>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link href="#" className="flex items-center justify-between text-sm text-zinc-400 hover:text-indigo-400 transition-colors group">
                  <span>Batch Operations Guide</span>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link href="#" className="flex items-center justify-between text-sm text-zinc-400 hover:text-indigo-400 transition-colors group">
                  <span>Error Code Reference</span>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
