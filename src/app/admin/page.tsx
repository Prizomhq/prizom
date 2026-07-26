'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  Heart, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  Loader2,
  LayoutDashboard,
  ShieldCheck,
  FileWarning,
  Activity,
  ShieldX,
  Database,
  Mail,
  MousePointerClick
} from 'lucide-react';
import { getAdminAnalytics } from '@/app/actions/adminActions';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminStatCard from '@/components/admin/ui/AdminStatCard';
import AdminStatusBadge from '@/components/admin/ui/AdminStatusBadge';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'funnel' | 'security'>('overview');

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
      <div className="min-h-[60vh] flex items-center justify-center text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Loading Telemetry Data...</span>
        </div>
      </div>
    );
  }

  // Summary Metrics
  const totalPendingModeration = (data?.reportedPromptsCount || 0) + (data?.reportedUsersCount || 0) + (data?.appeals?.pendingAccount || 0) + (data?.appeals?.pendingPrompt || 0);
  const resolutionRate = (totalPendingModeration + (data?.resolvedReportsCount || 0)) > 0 
    ? Math.round((data?.resolvedReportsCount / (totalPendingModeration + (data?.resolvedReportsCount || 0))) * 100) 
    : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Platform Operations Control Center"
        description="Real-time telemetry diagnostics, platform metrics, moderation queues, and conversion funnel monitoring."
        icon={LayoutDashboard}
        badge={{
          text: data?.cronWarningAlert ? 'Warning Alert' : 'System Nominal',
          variant: data?.cronWarningAlert ? 'rose' : 'emerald'
        }}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Dashboard' }]}
      >
        <Link
          href="/admin/reports"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" />
          Moderation Queue ({totalPendingModeration})
        </Link>
      </AdminPageHeader>

      {/* Warning Banners */}
      {data?.cronWarningAlert && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs font-medium">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-900">Cron Sweeper Diagnostic Alert</h4>
            <p className="text-rose-700 text-[11px] mt-0.5">{data.cronWarningAlert}</p>
          </div>
        </div>
      )}

      {/* 2. Operational Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AdminStatCard
          title="Total User Profiles"
          value={data?.totalUsers?.toLocaleString() || '0'}
          subtitle={`+${data?.recentSignups?.length || 0} recent signups online`}
          icon={Users}
          variant="indigo"
          href="/admin/users"
        />
        <AdminStatCard
          title="Active Prompt Catalog"
          value={data?.activePromptsCount?.toLocaleString() || '0'}
          subtitle={`${data?.removedPromptsCount || 0} removed in grace period`}
          icon={FileText}
          variant="emerald"
          href="/admin/prompts"
        />
        <AdminStatCard
          title="Pending Moderation Queue"
          value={totalPendingModeration}
          subtitle={`${resolutionRate}% resolution efficiency`}
          icon={ShieldAlert}
          variant={totalPendingModeration > 0 ? 'amber' : 'zinc'}
          href="/admin/reports"
        />
        <AdminStatCard
          title="Guest Funnel Visitors"
          value={data?.guestFunnel?.visitors?.toLocaleString() || '0'}
          subtitle={`${data?.guestFunnel?.conversionRate || 0}% funnel conversion rate`}
          icon={TrendingUp}
          variant="emerald"
        />
      </div>

      {/* 3. Navigation Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100/80 rounded-xl border border-zinc-200/80 w-fit text-xs font-semibold text-zinc-600">
        <button
          onClick={() => setActiveTab('overview')}
          aria-label="Overview & Health Tab"
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          System Health & Logs
        </button>
        <button
          onClick={() => setActiveTab('moderation')}
          aria-label="Moderation & Appeals Queue Tab"
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'moderation' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Moderation & Appeals ({totalPendingModeration})
        </button>
        <button
          onClick={() => setActiveTab('funnel')}
          aria-label="Guest Conversion Funnel Tab"
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'funnel' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Guest Conversion Funnel
        </button>
        <button
          onClick={() => setActiveTab('security')}
          aria-label="Security & Shield Tab"
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'security' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <ShieldX className="w-3.5 h-3.5" />
          Security Shield
        </button>
      </div>

      {/* Tab Content 1: Overview & System Health */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cron Diagnostics */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Cron Sweeper Diagnostics
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Last Sweeper Job</span>
                  <span className="font-semibold text-zinc-900">{data?.cron?.lastJobName || 'None'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Execution Status</span>
                  <AdminStatusBadge 
                    status={data?.cron?.lastJobStatus === 'success' ? 'active' : 'suspended'}
                    label={data?.cron?.lastJobStatus || 'unknown'}
                  />
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Runtime Duration</span>
                  <span className="font-semibold text-zinc-900">{data?.cron?.lastJobDuration || 0} ms</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Records Processed</span>
                  <span className="font-semibold text-zinc-900">{data?.cron?.lastJobProcessed || 0} items</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-500">Failed Runs (24h)</span>
                  <span className={`font-semibold ${data?.cron?.failedCount24h > 0 ? 'text-rose-600' : 'text-zinc-900'}`}>
                    {data?.cron?.failedCount24h || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Dispatch Logs */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                Email Delivery Telemetry
              </h3>
              <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-xl text-center">
                <span className="text-xs text-zinc-500 font-medium">Total Email Dispatches</span>
                <p className="text-3xl font-bold text-zinc-900 mt-1">{data?.emails?.total || 0}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <span className="block text-[10px] text-emerald-700 font-semibold uppercase">Sent</span>
                  <span className="font-bold text-emerald-800 text-base">{data?.emails?.sent || 0}</span>
                </div>
                <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-xl">
                  <span className="block text-[10px] text-amber-700 font-semibold uppercase">Retrying</span>
                  <span className="font-bold text-amber-800 text-base">{data?.emails?.failed || 0}</span>
                </div>
                <div className="p-2.5 bg-zinc-100 border border-zinc-200/60 rounded-xl">
                  <span className="block text-[10px] text-zinc-600 font-semibold uppercase">Pending</span>
                  <span className="font-bold text-zinc-800 text-base">{data?.emails?.pending || 0}</span>
                </div>
              </div>
            </div>

            {/* Database Node Stats */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                Database Catalog Metrics
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Registered Creator Profiles</span>
                  <span className="font-semibold text-zinc-900">{data?.totalUsers}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Active Prompt Templates</span>
                  <span className="font-semibold text-zinc-900">{data?.activePromptsCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Grace Period Removals</span>
                  <span className="font-semibold text-zinc-900">{data?.removedPromptsCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Archived Records</span>
                  <span className="font-semibold text-zinc-900">{data?.archivedPromptsCount}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-500">Hard-Deleted Records</span>
                  <span className="font-semibold text-zinc-900">{data?.deletedPromptsCount}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Category Breakdown Table */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Category Catalog Segmentation</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-zinc-700">
                <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Active Prompts</th>
                    <th className="px-4 py-3">Removed</th>
                    <th className="px-4 py-3 text-right">Archived</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {Object.entries(data?.categoryBreakdown || {}).map(([slug, values]: any) => (
                    <tr key={slug} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-zinc-900">{values.name}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">{slug}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">{values.active}</td>
                      <td className="px-4 py-3 text-rose-600">{values.removed}</td>
                      <td className="px-4 py-3 text-right text-zinc-500">{values.archived}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Moderation & Appeals */}
      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs text-center space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Open Prompt Reports</span>
              <p className="text-3xl font-bold text-zinc-900">{data?.reportedPromptsCount || 0}</p>
              <Link href="/admin/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                Review Queue <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs text-center space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Open User Reports</span>
              <p className="text-3xl font-bold text-zinc-900">{data?.reportedUsersCount || 0}</p>
              <Link href="/admin/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                Review Queue <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs text-center space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Pending Account Appeals</span>
              <p className="text-3xl font-bold text-zinc-900">{data?.appeals?.pendingAccount || 0}</p>
              <Link href="/admin/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                Process Appeals <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs text-center space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Pending Prompt Appeals</span>
              <p className="text-3xl font-bold text-zinc-900">{data?.appeals?.pendingPrompt || 0}</p>
              <Link href="/admin/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                Process Appeals <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Safety Telemetry Audit</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Hidden Items (Grace Period)</span>
                  <span className="font-semibold text-zinc-900">{data?.removedPromptsCount || 0} items</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Verified Creator Badges</span>
                  <span className="font-semibold text-zinc-900">{data?.verifiedCreatorsCount || 0} creators</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-500">Weekly Complaints</span>
                  <span className="font-semibold text-zinc-900">{data?.reportsWeekly || 0} reports</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-500">Moderation Efficiency</span>
                  <span className="font-bold text-emerald-600">{resolutionRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <AdminStatusBadge status="warned" label="Most Reported Prompt" className="mb-3" />
                <div className="flex items-start gap-3 my-3">
                  <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl shrink-0">
                    <FileWarning className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 text-xs leading-snug">
                      {data?.mostReportedPrompt?.title !== 'None' ? `"${data?.mostReportedPrompt?.title}"` : 'No reported prompts'}
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {data?.mostReportedPrompt?.count || 0} reports accumulated
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/admin/reports" className="w-full py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-center text-xs font-semibold text-zinc-700 transition-colors">
                Audit Queue &rarr;
              </Link>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <AdminStatusBadge status="warned" label="Most Reported Creator" className="mb-3" />
                <div className="flex items-start gap-3 my-3">
                  <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 text-xs leading-snug">
                      {data?.mostReportedCreator?.username !== 'None' ? `@${data?.mostReportedCreator?.username}` : 'No reported creators'}
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {data?.mostReportedCreator?.count || 0} complaints accumulated
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/admin/reports" className="w-full py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-center text-xs font-semibold text-zinc-700 transition-colors">
                Audit Creator &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Guest Conversion Funnel */}
      {activeTab === 'funnel' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs text-center space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Guest Visitors</span>
              <p className="text-3xl font-bold text-zinc-900">{data?.guestFunnel?.visitors || 0}</p>
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs text-center space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Overall Funnel Conversion</span>
              <p className="text-3xl font-bold text-emerald-600">{data?.guestFunnel?.conversionRate || 0}%</p>
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs text-center space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Copy to Signup</span>
              <p className="text-3xl font-bold text-indigo-600">{data?.guestFunnel?.copyConversionRate || 0}%</p>
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs text-center space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Search to Signup</span>
              <p className="text-3xl font-bold text-indigo-600">{data?.guestFunnel?.searchConversionRate || 0}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Security Shield */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs text-center space-y-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-left">Blocked Spam Requests</h3>
              <p className="text-5xl font-bold text-rose-600 tracking-tight">{data?.security?.blockedSpamCount || 0}</p>
              <p className="text-xs text-zinc-500 text-left leading-relaxed">
                Unique rate-limiter triggers for IP and user keys exceeding rate thresholds.
              </p>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Rate Limit Policy Rules</h3>
              <div className="space-y-2 text-xs font-medium text-zinc-700">
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span>Auth Endpoint</span>
                  <span className="font-semibold text-zinc-900">5 req / 5 min</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span>Report Endpoint</span>
                  <span className="font-semibold text-zinc-900">10 req / hour</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span>Appeal Endpoint</span>
                  <span className="font-semibold text-zinc-900">5 req / hour</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Prompt Creation</span>
                  <span className="font-semibold text-zinc-900">5 req / hour</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cloudflare Turnstile Verification</h3>
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Active on Appeals & Messages
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                CAPTCHA tokens verified on server actions before inserting records into Postgres.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            Recent Registered Creators
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-700">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Username</th>
                  <th className="px-3 py-2.5">Clearance Role</th>
                  <th className="px-3 py-2.5 text-right">Node ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {(data?.recentSignups || []).map((user: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-zinc-900">{user.username}</td>
                    <td className="px-3 py-2.5">
                      <AdminStatusBadge status={user.role} />
                    </td>
                    <td className="px-3 py-2.5 text-right text-zinc-400 font-mono text-[10px]">
                      ...{user.id.substring(user.id.length - 8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performing Catalog */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-zinc-500" />
            Top Performing Prompt Templates
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-700">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Title</th>
                  <th className="px-3 py-2.5">Creator</th>
                  <th className="px-3 py-2.5 text-right">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {(data?.trendingPrompts || []).map((prompt: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-zinc-900 truncate max-w-[160px]">{prompt.title}</td>
                    <td className="px-3 py-2.5 text-indigo-600 font-medium">@{prompt.creator}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-zinc-500">{prompt.likesCount} ★ / {prompt.copiesCount} copies</td>
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
