'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  GitFork, 
  Heart, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  ArrowUpRight, 
  Bookmark, 
  Loader2,
  LayoutDashboard,
  ShieldCheck,
  AlertCircle,
  EyeOff,
  UserCheck,
  FileWarning,
  Activity,
  ShieldX,
  Database,
  Mail,
  History,
  MousePointerClick,
  Copy,
  ExternalLink,
  Search
} from 'lucide-react';
import { getAdminAnalytics } from '@/app/actions/adminActions';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'health' | 'moderation' | 'funnel' | 'security'>('health');

  useEffect(() => {
    getAdminAnalytics().then(res => {
      if (res.success) {
        setData(res.analytics);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-black uppercase tracking-widest">Compiling Operations Telemetry...</span>
        </div>
      </div>
    );
  }

  // Calculate quick summary metrics
  const totalPendingModeration = (data?.reportedPromptsCount || 0) + (data?.reportedUsersCount || 0) + (data?.appeals?.pendingAccount || 0) + (data?.appeals?.pendingPrompt || 0);
  const resolutionRate = (totalPendingModeration + (data?.resolvedReportsCount || 0)) > 0 
    ? Math.round((data?.resolvedReportsCount / (totalPendingModeration + (data?.resolvedReportsCount || 0))) * 100) 
    : 100;

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-indigo-500" />
            Platform Operations Dashboard
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Live telemetry, system diagnostics, and conversion funnel monitoring</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-950/40 border border-zinc-800/80 px-4 py-2 rounded-2xl">
          <span className={`w-2.5 h-2.5 rounded-full ${data?.cronWarningAlert ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            {data?.cronWarningAlert ? 'Telemetry Warnings' : 'All Systems Nominal'}
          </span>
        </div>
      </div>

      {/* Warning Banners */}
      {data?.cronWarningAlert && (
        <div className="bg-red-950/20 border border-red-900/30 rounded-3xl p-5 flex items-center gap-4 text-red-200">
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
          <div className="flex-1">
            <h4 className="font-extrabold text-xs uppercase tracking-wider">Cron Sweeper Health Alert</h4>
            <p className="text-[11px] font-semibold text-zinc-450 mt-0.5">{data.cronWarningAlert}</p>
          </div>
        </div>
      )}

      {/* 2. Operations Segmented Control Tabs */}
      <div className="flex flex-wrap bg-zinc-950/60 p-1.5 rounded-2.5xl border border-zinc-900 gap-1.5">
        <button
          onClick={() => setActiveTab('health')}
          className={`flex-1 min-w-[150px] text-center py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'health'
              ? 'bg-zinc-900 text-white shadow border border-zinc-800/80'
              : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <Database className="w-4 h-4" />
          System Health & Logs
        </button>
        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex-1 min-w-[150px] text-center py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'moderation'
              ? 'bg-zinc-900 text-white shadow border border-zinc-800/80'
              : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Moderation & Appeals ({totalPendingModeration})
        </button>
        <button
          onClick={() => setActiveTab('funnel')}
          className={`flex-1 min-w-[150px] text-center py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'funnel'
              ? 'bg-zinc-900 text-white shadow border border-zinc-800/80'
              : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Guest Conversion Funnel
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 min-w-[150px] text-center py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'security'
              ? 'bg-zinc-900 text-white shadow border border-zinc-800/80'
              : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <ShieldX className="w-4 h-4" />
          Security & Spam Shield
        </button>
      </div>

      {/* 3. Render Dashboard Sections */}

      {/* Tab 1: System Health & Logs */}
      {activeTab === 'health' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Cron Health Diagnostics */}
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-[2.2rem] p-6 shadow-xl space-y-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-4">
                  <Clock className="w-4.5 h-4.5" />
                  Cron Sweeper Diagnostics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                    <span className="text-[10px] font-bold text-zinc-550 uppercase">Last Job Executed</span>
                    <span className="text-xs font-black text-white">{data?.cron?.lastJobName || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                    <span className="text-[10px] font-bold text-zinc-550 uppercase">Execution Status</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      data?.cron?.lastJobStatus === 'success' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : data?.cron?.lastJobStatus === 'failure' 
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {data?.cron?.lastJobStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                    <span className="text-[10px] font-bold text-zinc-550 uppercase">Runtime Duration</span>
                    <span className="text-xs font-black text-white">{data?.cron?.lastJobDuration || 0} ms</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                    <span className="text-[10px] font-bold text-zinc-550 uppercase">Records Swept</span>
                    <span className="text-xs font-black text-white">{data?.cron?.lastJobProcessed || 0} records</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[10px] font-bold text-zinc-550 uppercase">Failed Runs (24h)</span>
                    <span className={`text-xs font-black ${data?.cron?.failedCount24h > 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                      {data?.cron?.failedCount24h}
                    </span>
                  </div>
                </div>
              </div>

              {data?.cron?.lastJobError && (
                <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 text-red-400 text-[10px] font-mono whitespace-pre-wrap break-all mt-4">
                  Error: {data.cron.lastJobError}
                </div>
              )}
            </div>

            {/* Centralized Email Delivery */}
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-[2.2rem] p-6 shadow-xl space-y-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Mail className="w-4.5 h-4.5" />
                Email Logs & Delivery
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl text-center">
                  <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Total Dispatches</span>
                  <p className="text-3xl font-black text-white mt-1">{data?.emails?.total || 0}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-zinc-950/30 border border-zinc-900 rounded-xl text-center">
                    <span className="block text-[8px] text-zinc-550 font-black uppercase">Delivered</span>
                    <span className="block text-sm font-black text-emerald-400 mt-1">{data?.emails?.sent || 0}</span>
                  </div>
                  <div className="p-3 bg-zinc-950/30 border border-zinc-900 rounded-xl text-center">
                    <span className="block text-[8px] text-zinc-550 font-black uppercase">Queued / Retry</span>
                    <span className="block text-sm font-black text-amber-400 mt-1">{data?.emails?.failed || 0}</span>
                  </div>
                  <div className="p-3 bg-zinc-950/30 border border-zinc-900 rounded-xl text-center">
                    <span className="block text-[8px] text-zinc-550 font-black uppercase">Pending</span>
                    <span className="block text-sm font-black text-zinc-400 mt-1">{data?.emails?.pending || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Database Node Metrics */}
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-[2.2rem] p-6 shadow-xl space-y-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Database className="w-4.5 h-4.5" />
                Database Nodes Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                  <span className="text-[10px] font-bold text-zinc-550 uppercase">Profiles</span>
                  <span className="text-xs font-black text-white">{data?.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                  <span className="text-[10px] font-bold text-zinc-550 uppercase">Active Prompts</span>
                  <span className="text-xs font-black text-white">{data?.activePromptsCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                  <span className="text-[10px] font-bold text-zinc-550 uppercase">Removed (Grace Period)</span>
                  <span className="text-xs font-black text-white">{data?.removedPromptsCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-900">
                  <span className="text-[10px] font-bold text-zinc-550 uppercase">Archived Prompts</span>
                  <span className="text-xs font-black text-white">{data?.archivedPromptsCount}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[10px] font-bold text-zinc-550 uppercase">Hard-Deleted Prompts</span>
                  <span className="text-xs font-black text-white">{data?.deletedPromptsCount}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Category breakdowns micro-tables */}
          <div className="bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">Prompts Categories Segmentations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-zinc-450 font-semibold border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    <th className="pb-3.5">Category Name</th>
                    <th className="pb-3.5">Slug</th>
                    <th className="pb-3.5">Active Catalog</th>
                    <th className="pb-3.5">Removed</th>
                    <th className="pb-3.5 text-right">Archived</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {Object.entries(data?.categoryBreakdown || {}).map(([slug, values]: any) => (
                    <tr key={slug} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 text-zinc-200 font-bold">{values.name}</td>
                      <td className="py-3.5 font-mono text-[10px] text-zinc-500">{slug}</td>
                      <td className="py-3.5 text-emerald-400">{values.active}</td>
                      <td className="py-3.5 text-red-400">{values.removed}</td>
                      <td className="py-3.5 text-right text-zinc-400">{values.archived}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Moderation & Appeals */}
      {activeTab === 'moderation' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Prompt Reports */}
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-3xl p-5 shadow text-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block">Open Prompt Reports</span>
              <p className="text-3xl font-black text-white mt-2">{data?.reportedPromptsCount || 0}</p>
              <Link href="/admin/reports" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase mt-3 inline-block">
                Manage Queue &rarr;
              </Link>
            </div>

            {/* Creator Reports */}
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-3xl p-5 shadow text-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block">Open User Reports</span>
              <p className="text-3xl font-black text-white mt-2">{data?.reportedUsersCount || 0}</p>
              <Link href="/admin/reports" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase mt-3 inline-block">
                Manage Queue &rarr;
              </Link>
            </div>

            {/* Account Appeals */}
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-3xl p-5 shadow text-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block">Pending User Appeals</span>
              <p className="text-3xl font-black text-white mt-2">{data?.appeals?.pendingAccount || 0}</p>
              <Link href="/admin/reports" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase mt-3 inline-block">
                Review Appeals &rarr;
              </Link>
            </div>

            {/* Prompt Appeals */}
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-3xl p-5 shadow text-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block">Pending Prompt Appeals</span>
              <p className="text-3xl font-black text-white mt-2">{data?.appeals?.pendingPrompt || 0}</p>
              <Link href="/admin/reports" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase mt-3 inline-block">
                Review Appeals &rarr;
              </Link>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Safety Telemetry details */}
            <div className="bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6">Safety Telemetry Audit</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hidden Content (Grace Period)</span>
                    <span className="text-xs font-black text-white">{data?.removedPromptsCount || 0} items</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Verified Creators</span>
                    <span className="text-xs font-black text-white">{data?.verifiedCreatorsCount || 0} nodes</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Reports Raised (7d)</span>
                    <span className="text-xs font-black text-white">{data?.reportsWeekly || 0} logs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Clearing Efficiency</span>
                    <span className="text-xs font-black text-emerald-450">{resolutionRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Most Reported Prompt card */}
            <div className="bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 border border-red-900/30 bg-red-950/20 text-red-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                  Most Reported Prompt
                </span>
                <div className="flex items-start gap-3 mt-4 mb-6">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl shrink-0">
                    <FileWarning className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-zinc-200 font-extrabold text-sm leading-snug">
                      {data?.mostReportedPrompt?.title !== 'None' ? `"${data?.mostReportedPrompt?.title}"` : 'No reported prompts'}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                      Accumulated {data?.mostReportedPrompt?.count || 0} alerts
                    </p>
                  </div>
                </div>
              </div>
              {data?.mostReportedPrompt?.id && (
                <Link 
                  href={`/admin/reports`}
                  className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-center text-[10px] font-black uppercase tracking-wider text-zinc-300 transition-all flex items-center justify-center gap-1.5"
                >
                  Audit Content
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Most Reported Creator card */}
            <div className="bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 border border-red-900/30 bg-red-950/20 text-red-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                  Most Reported Creator
                </span>
                <div className="flex items-start gap-3 mt-4 mb-6">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl shrink-0">
                    <Users className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-zinc-200 font-extrabold text-sm leading-snug">
                      {data?.mostReportedCreator?.username !== 'None' ? `@${data?.mostReportedCreator?.username}` : 'No reported creators'}
                    </h4>
                    <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-widest mt-1">
                      Accumulated {data?.mostReportedCreator?.count || 0} complaints
                    </p>
                  </div>
                </div>
              </div>
              {data?.mostReportedCreator?.username !== 'None' && (
                <Link 
                  href={`/admin/reports`}
                  className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-center text-[10px] font-black uppercase tracking-wider text-zinc-300 transition-all flex items-center justify-center gap-1.5"
                >
                  Audit Creator
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: Guest Conversion Funnel */}
      {activeTab === 'funnel' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Key Funnel Conversions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-3xl p-5 shadow text-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block">Total Guest Visitors</span>
              <p className="text-3xl font-black text-white mt-2">{data?.guestFunnel?.visitors || 0}</p>
            </div>
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-3xl p-5 shadow text-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block">Funnel Conversion Rate</span>
              <p className="text-3xl font-black text-emerald-400 mt-2">{data?.guestFunnel?.conversionRate || 0}%</p>
            </div>
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-3xl p-5 shadow text-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block">Copy to Signup Rate</span>
              <p className="text-3xl font-black text-cyan-400 mt-2">{data?.guestFunnel?.copyConversionRate || 0}%</p>
            </div>
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-3xl p-5 shadow text-center">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block">Search to Signup Rate</span>
              <p className="text-3xl font-black text-indigo-400 mt-2">{data?.guestFunnel?.searchConversionRate || 0}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Landing Entry Pages */}
            <div className="lg:col-span-2 bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                <MousePointerClick className="w-4.5 h-4.5 text-cyan-450" />
                Popular Guest Landing Entry Pages
              </h3>
              <div className="space-y-4">
                {(data?.guestFunnel?.entryPages || []).length === 0 ? (
                  <p className="text-zinc-550 text-[10px] uppercase font-bold tracking-wide">No landing entries recorded yet.</p>
                ) : (
                  data.guestFunnel.entryPages.map((ep: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-[9px] text-zinc-450 shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-zinc-250 truncate text-xs">{ep.page}</span>
                      </div>
                      <span className="text-xs font-black text-white shrink-0">{ep.count} visitors</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Retention rates card */}
            <div className="bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                  Guest Cohort Retention
                </h3>
                <p className="text-[11px] text-zinc-450 leading-relaxed mb-6">
                  Calculated based on visitors returning to the platform on a different calendar day.
                </p>
                
                <div className="p-6 bg-zinc-950/50 border border-zinc-900 rounded-3xl text-center">
                  <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Returning Guests Rate</span>
                  <p className="text-4xl font-black text-white mt-2">{data?.guestFunnel?.retentionRate || 0}%</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/30 border border-zinc-900 rounded-2xl text-[9px] font-bold text-zinc-550 uppercase tracking-wider leading-relaxed mt-6">
                Cohort tracking uses SHA-256 hashed IP identifiers to respect privacy.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Security & Spam Shield */}
      {activeTab === 'security' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Blocked request card */}
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-[2.2rem] p-6 shadow-xl flex flex-col justify-between items-center text-center">
              <div className="w-full text-left border-b border-zinc-900/60 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                  <ShieldX className="w-4.5 h-4.5" />
                  Rate-Limiter Blocked Attacks
                </h3>
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-wider mt-6">Suspicious Activities Blocked</p>
              <p className="text-5xl font-black text-red-500 mt-2 tracking-tight">
                {data?.security?.blockedSpamCount || 0}
              </p>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl text-[9px] font-bold text-zinc-550 uppercase leading-relaxed mt-6 text-left">
                Counts unique IP/user keys exceeding window limits for auth or forms submissions.
              </div>
            </div>

            {/* Curation Telemetry aspect ratios */}
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-[2.2rem] p-6 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">Curation Aspect Ratios</h3>
              {(!data?.topAspectRatios || data.topAspectRatios.length === 0) ? (
                <p className="text-[10px] font-black text-zinc-650 uppercase">No aspect ratio data compiled.</p>
              ) : (
                <div className="space-y-3">
                  {data.topAspectRatios.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase">
                        <span className="font-mono text-zinc-300">{item.ratio}</span>
                        <span className="font-black text-white">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${item.percentage}%` }}
                          className="bg-indigo-500 h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security summary */}
            <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-[2.2rem] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Security Rules Configuration</h3>
                <div className="space-y-3.5 text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Login/Signup limit: 5 / 5m</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Report Form limit: 10 / hr</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Appeal Form limit: 5 / hr</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>Contact Form limit: 3 / hr</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl text-[9px] font-bold text-zinc-550 uppercase leading-relaxed mt-6">
                All limits are enforced at the Edge database server layer for maximum safety.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. Recent Performers & Signups Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent signups list */}
        <div className="bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            Recent Users Online
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-450 font-semibold border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  <th className="pb-3.5">Username</th>
                  <th className="pb-3.5">Clearance</th>
                  <th className="pb-3.5 text-right">Node ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {(data?.recentSignups || []).map((user: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 text-zinc-200 font-bold">{user.username}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex px-2 py-0.5 border rounded-md text-[9px] font-black uppercase tracking-wider ${
                        user.role === 'super_admin' ? 'text-red-400 bg-red-950/20 border-red-900/20' : 'text-zinc-500 bg-zinc-900/50 border-zinc-800'
                      }`}>
                        {user.role === 'super_admin' ? 'Sys Admin' : 'Creator'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-zinc-650 font-mono text-[10px]">...{user.id.substring(user.id.length - 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trending prompts list */}
        <div className="bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
            <Heart className="w-4 h-4 text-zinc-550" />
            Top Performers Catalog
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-450 font-semibold border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  <th className="pb-3.5">Title</th>
                  <th className="pb-3.5">Creator</th>
                  <th className="pb-3.5 text-right">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {(data?.trendingPrompts || []).map((prompt: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 text-zinc-200 font-bold truncate max-w-[150px]">{prompt.title}</td>
                    <td className="py-3.5 text-indigo-400">@{prompt.creator}</td>
                    <td className="py-3.5 text-right text-zinc-300 font-mono">{prompt.likesCount} ★ / {prompt.copiesCount} copies</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
