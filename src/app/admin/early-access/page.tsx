'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  User, 
  Mail, 
  Loader2, 
  RefreshCw,
  Ban,
  Check,
  X
} from 'lucide-react';
import { 
  adminGetEarlyAccessApplicationsAction, 
  adminUpdateEarlyAccessStatusAction, 
  EarlyAccessApplication 
} from '@/app/actions/earlyAccess';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminStatCard from '@/components/admin/ui/AdminStatCard';
import Avatar from '@/components/ui/Avatar';

export default function AdminEarlyAccessPage() {
  const [applications, setApplications] = useState<EarlyAccessApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    const res = await adminGetEarlyAccessApplicationsAction(statusFilter, searchQuery);
    if (res.success && res.applications) {
      setApplications(res.applications);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to load applications.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleUpdateStatus = async (appId: string, newStatus: 'approved' | 'rejected' | 'revoked') => {
    setUpdatingId(appId);
    setFeedback(null);

    const res = await adminUpdateEarlyAccessStatusAction(appId, newStatus);
    if (res.success) {
      setFeedback({ 
        type: 'success', 
        message: `Application ${newStatus} successfully. Notification sent to creator.` 
      });
      // Refresh list
      await fetchApplications();
    } else {
      setFeedback({ type: 'error', message: res.error || `Failed to ${newStatus} application.` });
    }
    setUpdatingId(null);
  };

  // Stats calculation
  const totalCount = applications.length;
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected' || a.status === 'revoked').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <AdminPageHeader
        title="AI Studio Early Access Management"
        description="Review, approve, and manage creator early access applications for Prizom AI Studio."
        icon={Sparkles}
      >
        <button
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </AdminPageHeader>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Applications"
          value={totalCount.toString()}
          subtitle="Total creator access requests"
          icon={User}
        />
        <AdminStatCard
          title="Pending Review"
          value={pendingCount.toString()}
          subtitle="Awaiting admin approval"
          icon={Clock}
          variant="amber"
        />
        <AdminStatCard
          title="Approved Creators"
          value={approvedCount.toString()}
          subtitle="Active AI Studio early users"
          icon={CheckCircle2}
          variant="emerald"
        />
        <AdminStatCard
          title="Rejected / Revoked"
          value={rejectedCount.toString()}
          subtitle="Restricted or declined applicants"
          icon={XCircle}
          variant="rose"
        />
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or reason..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
          />
        </form>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'approved', label: `Approved (${approvedCount})` },
            { id: 'rejected', label: 'Rejected' },
            { id: 'revoked', label: 'Revoked' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Applications Table */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Loading Early Access Applications...</span>
          </div>
        ) : applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Applicant</th>
                  <th className="px-6 py-3.5">Reason / Use Case</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 font-medium">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-zinc-50/60 transition-colors">
                    
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={app.avatarUrl}
                          username={app.username || app.fullName || app.email}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-extrabold text-zinc-900 truncate">
                            {app.fullName || app.username || 'Creator'}
                          </p>
                          <p className="text-[11px] text-zinc-500 font-mono truncate">{app.email}</p>
                          <p className="text-[10px] text-zinc-400 font-mono truncate">ID: {app.userId.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4 max-w-xs">
                      {app.reason ? (
                        <p className="text-zinc-700 line-clamp-2 text-xs leading-relaxed">
                          {app.reason}
                        </p>
                      ) : (
                        <span className="text-zinc-400 italic">No notes provided</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                      {new Date(app.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        app.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : app.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : app.status === 'rejected'
                          ? 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {app.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {app.status === 'pending' && <Clock className="w-3 h-3 text-amber-600 animate-pulse" />}
                        {app.status === 'rejected' && <XCircle className="w-3 h-3 text-zinc-500" />}
                        {app.status === 'revoked' && <Ban className="w-3 h-3 text-rose-600" />}
                        <span>{app.status}</span>
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {updatingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600 ml-auto" />
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {app.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'approved')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Approve Early Access"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {app.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'rejected')}
                              className="px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                              title="Reject Application"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}

                          {app.status === 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'revoked')}
                              className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                              title="Revoke Access"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-zinc-400 space-y-3">
            <Sparkles className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="text-sm font-bold text-zinc-700">No Early Access Applications Found</p>
            <p className="text-xs text-zinc-500">No applications match the current filter or search parameters.</p>
          </div>
        )}
      </div>

    </div>
  );
}
