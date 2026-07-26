'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  CheckCircle, 
  Loader2, 
  Search, 
  User, 
  ShieldCheck, 
  FileText, 
  ThumbsUp, 
  ThumbsDown,
  EyeOff
} from 'lucide-react';
import { 
  getAdminReports, 
  updateReportStatus, 
  resolveAppealAction, 
  resolvePromptAppealAction 
} from '@/app/actions/adminActions';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/ui/AdminStatusBadge';
import AdminConfirmDialog from '@/components/admin/ui/AdminConfirmDialog';

export default function AdminReportsPage() {
  const [promptReports, setPromptReports] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [accountAppeals, setAccountAppeals] = useState<any[]>([]);
  const [promptAppeals, setPromptAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab and filter states
  const [activeTab, setActiveTab] = useState<'prompt' | 'user' | 'account_appeal' | 'prompt_appeal'>('prompt');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected ticket Inspector states
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Confirm dialog state for destructive resolutions
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    variant: 'info'
  });

  const loadReports = (keepSelectedId?: string) => {
    setLoading(true);
    setError(null);
    getAdminReports().then(res => {
      if (res.success) {
        setPromptReports(res.promptReports || []);
        setUserReports(res.userReports || []);
        setAccountAppeals(res.accountAppeals || []);
        setPromptAppeals(res.promptAppeals || []);

        if (keepSelectedId) {
          const allLoaded = [
            ...(res.promptReports || []), 
            ...(res.userReports || []),
            ...(res.accountAppeals || []),
            ...(res.promptAppeals || [])
          ];
          const matched = allLoaded.find(r => r.id === keepSelectedId);
          if (matched) {
            setSelectedReport(matched);
          } else {
            setSelectedReport(null);
          }
        }
      } else {
        setError(res.error || 'Failed to load safety reports.');
      }
      setLoading(false);
    }).catch(err => {
      setError(err.message || 'An unexpected error occurred while loading safety reports.');
      setLoading(false);
    });
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Compute active list based on tab
  const getActiveList = () => {
    let list: any[] = [];
    if (activeTab === 'prompt') list = promptReports;
    else if (activeTab === 'user') list = userReports;
    else if (activeTab === 'account_appeal') list = accountAppeals;
    else if (activeTab === 'prompt_appeal') list = promptAppeals;

    return list.filter(item => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch = !searchQuery || 
        (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.targetTitle && item.targetTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.creatorUsername && item.creatorUsername.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  };

  const activeList = getActiveList();

  // Automatically select first item in active list if none selected
  useEffect(() => {
    if (activeList.length > 0 && (!selectedReport || !activeList.some(i => i.id === selectedReport.id))) {
      setSelectedReport(activeList[0]);
    } else if (activeList.length === 0) {
      setSelectedReport(null);
    }
  }, [activeTab, statusFilter, searchQuery, promptReports, userReports, accountAppeals, promptAppeals]);

  // Report Resolution Actions
  const handleUpdateReportStatus = async (status: 'under_review' | 'resolved' | 'dismissed' | 'escalated', reason?: string, actionType?: 'hide' | 'warn' | 'suspend' | 'permanent_ban') => {
    if (!selectedReport) return;
    const targetType = activeTab === 'prompt' ? 'prompt' : 'user';
    setSubmitting(true);
    const res = await updateReportStatus(targetType, selectedReport.id, status, reason || actionReason, actionType);
    setSubmitting(false);

    if (res.success) {
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      setActionReason('');
      loadReports(selectedReport.id);
    } else {
      alert(res.error || 'Failed to update report status.');
    }
  };

  const handleResolveAccountAppeal = async (status: 'approved' | 'rejected') => {
    if (!selectedReport) return;
    setSubmitting(true);
    const actionStatus = status === 'approved' ? 'approve' : 'reject';
    const res = await resolveAppealAction(selectedReport.id, actionStatus);
    setSubmitting(false);

    if (res.success) {
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      setActionReason('');
      loadReports(selectedReport.id);
    } else {
      alert(res.error || 'Failed to resolve account appeal.');
    }
  };

  const handleResolvePromptAppeal = async (status: 'approved' | 'rejected') => {
    if (!selectedReport) return;
    setSubmitting(true);
    const actionStatus = status === 'approved' ? 'approve' : 'reject';
    const res = await resolvePromptAppealAction(selectedReport.id, actionStatus);
    setSubmitting(false);



    if (res.success) {
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      setActionReason('');
      loadReports(selectedReport.id);
    } else {
      alert(res.error || 'Failed to resolve prompt appeal.');
    }
  };

  // Quick summary counts
  const pendingPrompts = promptReports.filter(r => r.status === 'pending').length;
  const pendingUsers = userReports.filter(r => r.status === 'pending').length;
  const pendingAccAppeals = accountAppeals.filter(a => a.status === 'pending').length;
  const pendingPromptAppeals = promptAppeals.filter(a => a.status === 'pending').length;
  const totalPending = pendingPrompts + pendingUsers + pendingAccAppeals + pendingPromptAppeals;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <AdminPageHeader
        title="Moderation & Appeals Control Queue"
        description="Inspect reported prompt templates, user complaints, and account reinstatement appeals."
        icon={ShieldAlert}
        badge={{ text: `${totalPending} Pending Tickets`, variant: totalPending > 0 ? 'amber' : 'emerald' }}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reports' }]}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports or reason..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-zinc-200/80 text-xs font-medium placeholder-zinc-400 focus:outline-none focus:border-indigo-500 w-60 shadow-2xs"
            />
          </div>
        </div>
      </AdminPageHeader>

      {/* Domain Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'prompt' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80' : 'text-zinc-600 hover:bg-zinc-100/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            Prompt Reports
            {pendingPrompts > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                {pendingPrompts}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('user')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'user' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80' : 'text-zinc-600 hover:bg-zinc-100/60'
            }`}
          >
            <User className="w-4 h-4" />
            User Reports
            {pendingUsers > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                {pendingUsers}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('account_appeal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'account_appeal' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80' : 'text-zinc-600 hover:bg-zinc-100/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Account Appeals
            {pendingAccAppeals > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                {pendingAccAppeals}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('prompt_appeal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'prompt_appeal' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80' : 'text-zinc-600 hover:bg-zinc-100/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Prompt Appeals
            {pendingPromptAppeals > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                {pendingPromptAppeals}
              </span>
            )}
          </button>
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <span>Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200/80 text-xs font-semibold text-zinc-900 focus:outline-none"
          >
            <option value="pending">Pending Review</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Split-Pane Main Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        
        {/* Left Pane (5 Cols): Queue Ticket List */}
        <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-zinc-50/80 border-b border-zinc-200/80 flex items-center justify-between text-xs text-zinc-500 font-semibold uppercase tracking-wider">
            <span>Ticket Queue ({activeList.length})</span>
            <span>Created</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 max-h-[550px]">
            {loading ? (
              <div className="p-8 text-center text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                <span className="text-xs">Loading queue tickets...</span>
              </div>
            ) : activeList.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-900 mb-1">Queue is clear</p>
                <p className="text-[11px] text-zinc-500">No tickets matching status "{statusFilter}".</p>
              </div>
            ) : (
              activeList.map((item) => {
                const isSelected = selectedReport?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedReport(item)}
                    className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-zinc-50/80'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <AdminStatusBadge status={item.status} />
                        <span className="font-bold text-xs text-zinc-900 truncate">
                          {item.targetTitle || 'Report Ticket'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {item.reason || item.details || 'No reason specified'}
                      </p>
                      {item.reporterName && (
                        <div className="text-[10px] text-zinc-400">
                          By @{item.reporterName}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 shrink-0">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane (7 Cols): Split-Pane Inspector View */}
        <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-2xl shadow-xs p-6 flex flex-col justify-between overflow-y-auto max-h-[550px]">
          {selectedReport ? (
            <div className="space-y-6">
              
              {/* Ticket Inspector Header */}
              <div className="flex items-start justify-between border-b border-zinc-100 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AdminStatusBadge status={selectedReport.status} />
                    <span className="text-[11px] font-mono text-zinc-400">ID: ...{selectedReport.id.substring(selectedReport.id.length - 8)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {selectedReport.targetTitle}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Submitted on {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Reported Content Snapshot */}
              {selectedReport.promptText && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider">Reported Prompt Source Snapshot</h4>
                  <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap text-zinc-800">
                    {selectedReport.promptText}
                  </div>
                </div>
              )}

              {/* Violation Reason / Details */}
              <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-1">
                <h4 className="font-bold text-amber-900 uppercase text-[10px] tracking-wider">Reported Violation Reason</h4>
                <p className="text-xs text-amber-950 font-medium leading-relaxed">
                  {selectedReport.reason || selectedReport.details || 'No reason provided.'}
                </p>
              </div>

              {/* Reporter Context */}
              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-zinc-600">
                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Reporter Profile</span>
                  <span className="font-bold text-zinc-900">
                    @{selectedReport.reporterName}
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Resolution Status</span>
                  <span className="font-bold text-zinc-900 capitalize">{selectedReport.status}</span>
                </div>
              </div>

              {/* Action Note Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">Moderator Audit Note (Optional)</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Add administrative notes regarding policy decision..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3 flex-wrap">
                {activeTab === 'prompt' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateReportStatus('dismissed')}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl border border-zinc-200 hover:border-zinc-300 text-xs font-semibold text-zinc-700 transition-colors"
                    >
                      Dismiss Report
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateReportStatus('resolved')}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                    >
                      Resolve & Keep Active
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Hide & Remove Prompt',
                          description: `Are you sure you want to hide prompt "${selectedReport.targetTitle}"?`,
                          variant: 'danger',
                          action: () => handleUpdateReportStatus('resolved', actionReason || 'Prompt hidden due to policy violation.', 'hide')
                        });
                      }}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Hide & Remove Prompt
                    </button>
                  </>
                )}

                {activeTab === 'user' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateReportStatus('dismissed')}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl border border-zinc-200 hover:border-zinc-300 text-xs font-semibold text-zinc-700 transition-colors"
                    >
                      Dismiss Complaint
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateReportStatus('resolved', actionReason, 'warn')}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                    >
                      Issue Warning & Resolve
                    </button>
                  </>
                )}

                {(activeTab === 'account_appeal' || activeTab === 'prompt_appeal') && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'account_appeal') handleResolveAccountAppeal('rejected');
                        else handleResolvePromptAppeal('rejected');
                      }}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      Reject Appeal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'account_appeal') handleResolveAccountAppeal('approved');
                        else handleResolvePromptAppeal('approved');
                      }}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Approve & Reinstate
                    </button>
                  </>
                )}
              </div>

            </div>
          ) : (
            <div className="py-24 text-center text-zinc-400 my-auto">
              <ShieldAlert className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-700">No Ticket Selected</p>
              <p className="text-[11px] text-zinc-400">Select a report from the left queue pane to inspect details.</p>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Dialog for Destructive Actions */}
      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        isSubmitting={submitting}
      />

    </div>
  );
}
