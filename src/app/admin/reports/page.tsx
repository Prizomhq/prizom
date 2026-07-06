'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  EyeOff, 
  UserMinus,
  MessageSquare,
  Sparkles,
  Search,
  ArrowLeft,
  ChevronRight,
  User,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileText,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  UserCheck
} from 'lucide-react';
import { 
  getAdminReports, 
  updateReportStatus, 
  resolveAppealAction, 
  resolvePromptAppealAction 
} from '@/app/actions/adminActions';
import Link from 'next/link';

export default function AdminReportsPage() {
  const [promptReports, setPromptReports] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [accountAppeals, setAccountAppeals] = useState<any[]>([]);
  const [promptAppeals, setPromptAppeals] = useState<any[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs & Search states
  const [activeTab, setActiveTab] = useState<'prompt' | 'user' | 'account_appeal' | 'prompt_appeal'>('prompt');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected ticket states
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedPromptText, setCopiedPromptText] = useState(false);

  // Mobile navigation helper
  const [mobileView, setMobileView] = useState<'list' | 'inspector'>('list');

  const loadReports = (keepSelectedId?: string) => {
    setLoading(true);
    setError(null);
    getAdminReports().then(res => {
      if (res.success) {
        setPromptReports(res.promptReports || []);
        setUserReports(res.userReports || []);
        setAccountAppeals(res.accountAppeals || []);
        setPromptAppeals(res.promptAppeals || []);
        setModerationLogs(res.moderationLogs || []);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports();
  }, []);

  // Update status filter default when switching tabs
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusFilter('pending');
    setSelectedReport(null);
    setMobileView('list');
  }, [activeTab]);

  const handleUpdateStatus = async (
    status: 'under_review' | 'resolved' | 'dismissed' | 'escalated',
    customReason?: string,
    actionType?: 'hide' | 'warn' | 'suspend' | 'permanent_ban'
  ) => {
    if (!selectedReport) return;
    setSubmitting(true);

    const finalReason = customReason !== undefined ? customReason : actionReason;

    try {
      const res = await updateReportStatus(selectedReport.type, selectedReport.id, status, finalReason, actionType);
      if (res.success) {
        setActionReason('');
        loadReports();
        setSelectedReport(null);
        setMobileView('list');
      } else {
        alert(res.error || 'Failed to update report ticket status.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during report resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveAppeal = async (action: 'approve' | 'reject') => {
    if (!selectedReport) return;
    setSubmitting(true);

    try {
      let res;
      if (selectedReport.type === 'account_appeal') {
        res = await resolveAppealAction(selectedReport.id, action);
      } else {
        res = await resolvePromptAppealAction(selectedReport.id, action);
      }

      if (res.success) {
        setActionReason('');
        loadReports();
        setSelectedReport(null);
        setMobileView('list');
      } else {
        alert(res.error || 'Failed to resolve appeal ticket.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during appeal resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPromptText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptText(true);
    setTimeout(() => setCopiedPromptText(false), 2000);
  };

  // Determine active dataset
  const getActiveDataset = () => {
    switch(activeTab) {
      case 'prompt': return promptReports;
      case 'user': return userReports;
      case 'account_appeal': return accountAppeals;
      case 'prompt_appeal': return promptAppeals;
    }
  };

  const activeDataset = getActiveDataset();

  // Filter queues
  const filteredTickets = activeDataset.filter(r => {
    const matchesStatus = r.status === statusFilter;
    const matchesSearch = 
      r.targetTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.details && r.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Global pending counts
  const pendingPromptsCount = promptReports.filter(r => r.status === 'pending').length;
  const pendingUsersCount = userReports.filter(r => r.status === 'pending').length;
  const pendingAccountAppealsCount = accountAppeals.filter(r => r.status === 'pending').length;
  const pendingPromptAppealsCount = promptAppeals.filter(r => r.status === 'pending').length;

  // Selected Creator violations history details
  const getCreatorViolationsStats = () => {
    if (!selectedReport) return { violations: 0, pending: 0, logs: [] };
    const creatorId = selectedReport.ownerId || selectedReport.targetId;
    
    const creatorReports = [...promptReports, ...userReports].filter(r => 
      (r.ownerId === creatorId || r.targetId === creatorId) && r.id !== selectedReport.id
    );
    const violations = creatorReports.filter(r => r.status === 'resolved').length;
    const pending = creatorReports.filter(r => r.status === 'pending').length;

    const logs = moderationLogs.filter(log => 
      log.targetId === selectedReport.targetId || 
      log.targetId === creatorId
    );

    return { violations, pending, logs };
  };

  const creatorStats = getCreatorViolationsStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-indigo-500 animate-pulse" />
            Safety Review Center
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Platform moderation queues, safety tickets, and policy audits</p>
        </div>

        {/* Global Pending Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 bg-amber-950/20 border border-amber-900/30 rounded-2xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></div>
            <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider">
              {pendingPromptsCount} Prompt Reports
            </span>
          </div>
          <div className="px-3.5 py-1.5 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></div>
            <span className="text-[9px] text-red-400 font-black uppercase tracking-wider">
              {pendingUsersCount} User Reports
            </span>
          </div>
          <div className="px-3.5 py-1.5 bg-cyan-950/20 border border-cyan-900/30 rounded-2xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></div>
            <span className="text-[9px] text-cyan-400 font-black uppercase tracking-wider">
              {pendingAccountAppealsCount + pendingPromptAppealsCount} Appeals
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {loading && promptReports.length === 0 ? (
        <div className="min-h-[50vh] flex items-center justify-center text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <span className="text-xs font-black uppercase tracking-widest">Synchronizing Safety Queues...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/30 p-12 rounded-[2.5rem] text-center max-w-2xl mx-auto my-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-black text-red-400 uppercase">Database Sync Error</h3>
          <p className="text-zinc-400 text-xs font-semibold mt-2 leading-relaxed">{error}</p>
          <button 
            onClick={() => loadReports()}
            className="mt-6 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-100 rounded-full text-xs font-black uppercase tracking-wider transition-all"
          >
            Retry Sync
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Queue & Tickets List */}
          <div className={`lg:col-span-5 space-y-5 bg-[#121215]/60 border border-zinc-800/80 rounded-[2.2rem] p-5 shadow-2xl ${mobileView === 'inspector' ? 'hidden lg:block' : 'block'}`}>
            
            {/* 4-Tab Queue Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-950/60 p-2 rounded-2xl border border-zinc-900">
              <button
                onClick={() => setActiveTab('prompt')}
                className={`text-center py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'prompt'
                    ? 'bg-zinc-900 text-white shadow border border-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Prompts ({pendingPromptsCount})
              </button>
              <button
                onClick={() => setActiveTab('user')}
                className={`text-center py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'user'
                    ? 'bg-zinc-900 text-white shadow border border-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Users ({pendingUsersCount})
              </button>
              <button
                onClick={() => setActiveTab('account_appeal')}
                className={`text-center py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'account_appeal'
                    ? 'bg-zinc-900 text-white shadow border border-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                User Appeals ({pendingAccountAppealsCount})
              </button>
              <button
                onClick={() => setActiveTab('prompt_appeal')}
                className={`text-center py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'prompt_appeal'
                    ? 'bg-zinc-900 text-white shadow border border-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Prompt Appeals ({pendingPromptAppealsCount})
              </button>
            </div>

            {/* Filter Pills based on status */}
            <div className="flex flex-wrap gap-1.5 pb-1 border-b border-zinc-800/40">
              {activeTab === 'prompt' || activeTab === 'user' ? (
                // Reports statuses
                (['pending', 'under_review', 'escalated', 'resolved', 'dismissed'] as const).map((status) => {
                  const labelMap: Record<string, string> = {
                    pending: 'Pending',
                    under_review: 'In Audit',
                    escalated: 'Escalated',
                    resolved: 'Violation',
                    dismissed: 'Dismissed'
                  };
                  const colorMap: Record<string, string> = {
                    pending: statusFilter === 'pending' ? 'bg-amber-550/15 text-amber-400 border-amber-900/30' : 'text-zinc-500 hover:text-zinc-300 border-transparent',
                    under_review: statusFilter === 'under_review' ? 'bg-cyan-550/15 text-cyan-400 border-cyan-900/30' : 'text-zinc-500 hover:text-zinc-300 border-transparent',
                    escalated: statusFilter === 'escalated' ? 'bg-orange-500/15 text-orange-400 border-orange-900/30' : 'text-zinc-500 hover:text-zinc-300 border-transparent',
                    resolved: statusFilter === 'resolved' ? 'bg-emerald-550/15 text-emerald-400 border-emerald-900/30' : 'text-zinc-500 hover:text-zinc-300 border-transparent',
                    dismissed: statusFilter === 'dismissed' ? 'bg-zinc-900 text-zinc-300 border-zinc-800' : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                  };
                  const count = activeDataset.filter(r => r.status === status).length;

                  return (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setSelectedReport(null);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${colorMap[status]}`}
                    >
                      <span>{labelMap[status]}</span>
                      <span className="opacity-60 bg-black/35 px-1.5 py-0.5 rounded-full font-bold">{count}</span>
                    </button>
                  );
                })
              ) : (
                // Appeals statuses
                (['pending', 'approved', 'rejected'] as const).map((status) => {
                  const labelMap = {
                    pending: 'Pending Appeal',
                    approved: 'Approved',
                    rejected: 'Rejected'
                  };
                  const colorMap = {
                    pending: statusFilter === 'pending' ? 'bg-amber-550/15 text-amber-400 border-amber-900/30' : 'text-zinc-500 hover:text-zinc-300 border-transparent',
                    approved: statusFilter === 'approved' ? 'bg-emerald-550/15 text-emerald-400 border-emerald-900/30' : 'text-zinc-500 hover:text-zinc-300 border-transparent',
                    rejected: statusFilter === 'rejected' ? 'bg-red-550/15 text-red-400 border-red-900/30' : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                  };
                  const count = activeDataset.filter(r => r.status === status).length;

                  return (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setSelectedReport(null);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${colorMap[status]}`}
                    >
                      <span>{labelMap[status]}</span>
                      <span className="opacity-60 bg-black/35 px-1.5 py-0.5 rounded-full font-bold">{count}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Search Ticket Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/40 text-xs font-semibold text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* Queue List Cards */}
            <div className="max-h-[60vh] overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
              {filteredTickets.length === 0 ? (
                <div className="py-20 text-center bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                  <CheckCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500 text-xs font-black uppercase tracking-wider">No tickets matched</p>
                  <p className="text-zinc-600 text-[10px] mt-0.5">Queue is completely clean for this filter.</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = selectedReport?.id === ticket.id;
                  
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => {
                        setSelectedReport(ticket);
                        setMobileView('inspector');
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-3.5 items-start ${
                        isSelected 
                          ? 'bg-indigo-950/10 border-indigo-500/80 shadow-lg shadow-indigo-950/15'
                          : ticket.status === 'pending'
                            ? 'bg-amber-950/5 border-amber-900/10 hover:border-zinc-850 hover:bg-zinc-900/10'
                            : 'bg-zinc-900/5 border-zinc-800/50 hover:border-zinc-750 hover:bg-zinc-900/10'
                      }`}
                    >
                      {/* Thumbnail */}
                      {ticket.targetImageUrl ? (
                        <img 
                          src={ticket.targetImageUrl} 
                          alt="" 
                          className="w-12 h-12 object-cover rounded-xl border border-zinc-800 shrink-0 bg-zinc-900"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center shrink-0 text-zinc-600">
                          {ticket.type.includes('prompt') ? <FileText className="w-6 h-6" /> : <User className="w-6 h-6" />}
                        </div>
                      )}

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            ticket.type.includes('prompt') ? 'bg-indigo-500/10 text-indigo-400' : 'bg-pink-500/10 text-pink-400'
                          }`}>
                            {ticket.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-bold shrink-0">
                            {new Date(ticket.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </span>
                        </div>

                        <h4 className="text-zinc-200 text-xs font-black truncate">{ticket.targetTitle}</h4>
                        
                        <p className="text-[10px] text-amber-500/90 font-black truncate flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {ticket.reason}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500 font-semibold border-t border-zinc-900/40">
                          <span>By: <strong className="text-indigo-400">@{ticket.reporterName}</strong></span>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Active Inspector Panel */}
          <div className={`lg:col-span-7 xl:col-span-7 space-y-6 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
            
            {selectedReport === null ? (
              /* Empty Placeholder State */
              <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-[2.2rem] p-16 text-center shadow-2xl flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 blur-3xl rounded-full"></div>
                <div className="w-20 h-20 bg-zinc-950/60 border border-zinc-850 rounded-[1.8rem] flex items-center justify-center text-zinc-600 mb-6 shadow-inner relative z-10 animate-bounce">
                  <ShieldCheck className="w-10 h-10 text-zinc-500" />
                </div>
                <h3 className="text-xl font-black text-zinc-300 uppercase tracking-wide relative z-10">Select Moderation Ticket</h3>
                <p className="text-zinc-500 text-xs font-semibold max-w-sm mt-2 leading-relaxed relative z-10">
                  Choose an item from the category queues to load details, evidence logs, creator history, and policy resolution buttons.
                </p>
              </div>
            ) : (
              /* Active Inspector Panel View */
              <div className="bg-[#121215]/60 border border-zinc-800/80 rounded-[2.2rem] p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Mobile Back Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileView('list')}
                      className="p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 lg:hidden transition-all shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Policy Inspector</span>
                        <span className={`inline-flex px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-wider ${
                          selectedReport.status === 'pending'
                            ? 'text-amber-400 bg-amber-950/20 border-amber-900/20'
                            : selectedReport.status === 'under_review'
                              ? 'text-cyan-400 bg-cyan-950/20 border-cyan-900/20'
                              : selectedReport.status === 'resolved' || selectedReport.status === 'approved'
                                ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/20'
                                : 'text-zinc-500 bg-zinc-900/50 border-zinc-800'
                        }`}>
                          {selectedReport.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white leading-tight truncate max-w-[280px] sm:max-w-md">
                        {selectedReport.targetTitle}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500 font-bold hidden sm:inline">
                    Ticket Ref ID: {selectedReport.id.substring(0, 8)}...
                  </span>
                </div>

                {/* 1. Evidence Box */}
                <div className="bg-zinc-950/50 border border-zinc-850/80 rounded-2.5xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Auditable Content Evidence
                    </h4>
                    {selectedReport.type.includes('prompt') && (
                      <Link
                        href={`/prompt/${selectedReport.targetId}`}
                        target="_blank"
                        className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 flex items-center gap-1 tracking-wider"
                      >
                        Visit Page
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {selectedReport.targetImageUrl ? (
                      <img 
                        src={selectedReport.targetImageUrl} 
                        alt="Evidence" 
                        className="w-full sm:w-28 sm:h-28 object-cover rounded-2xl border border-zinc-800 bg-zinc-900 shrink-0 aspect-video sm:aspect-square"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center shrink-0 text-zinc-700">
                        {selectedReport.type.includes('prompt') ? <FileText className="w-8 h-8" /> : <User className="w-8 h-8" />}
                      </div>
                    )}

                    <div className="space-y-2 min-w-0 flex-1 w-full">
                      <h4 className="text-zinc-200 text-sm font-black tracking-tight">{selectedReport.targetTitle}</h4>
                      
                      {selectedReport.type.includes('prompt') ? (
                        <>
                          {selectedReport.promptDescription && (
                            <p className="text-zinc-500 text-xs font-semibold leading-relaxed line-clamp-2">
                              {selectedReport.promptDescription}
                            </p>
                          )}
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] text-zinc-400 font-bold">Creator:</span>
                            <span className="text-[10px] text-indigo-400 font-bold">@{selectedReport.creatorUsername}</span>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold block">Creator Account Username</span>
                          <span className="text-[10px] text-indigo-400 font-bold block">@{selectedReport.creatorUsername}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Copyable Prompt text for Prompts / Prompt Appeals */}
                  {selectedReport.type.includes('prompt') && (selectedReport.promptText || selectedReport.promptSnapshot) && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">
                            Prompt Template
                          </span>
                          <button
                            onClick={() => handleCopyPromptText(selectedReport.promptText)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-[9px] font-black uppercase text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1.5"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedPromptText ? 'Copied!' : 'Copy Prompt'}
                          </button>
                        </div>
                        <pre className="p-3.5 bg-zinc-900/60 border border-zinc-900 rounded-xl text-[11px] font-mono text-zinc-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto leading-relaxed select-text shadow-inner">
                          {selectedReport.promptText}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Reporter & Claim details */}
                <div className="bg-zinc-950/20 border border-zinc-850/60 rounded-2.5xl p-5 space-y-3.5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-900/60 pb-3">
                    {selectedReport.type.includes('appeal') ? 'Appeal Statement & Details' : 'Filer Claims & Filing Information'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-wider">
                        {selectedReport.type.includes('appeal') ? 'Filer Account' : 'Reporter User'}
                      </span>
                      <span className="block text-xs font-bold text-indigo-400 mt-0.5">@{selectedReport.reporterName}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-wider">
                        {selectedReport.type.includes('appeal') ? 'Type' : 'Safety Policy Category'}
                      </span>
                      <span className="block text-xs font-bold text-amber-500 mt-0.5">
                        {selectedReport.type.includes('appeal') ? 'Content Appeal' : selectedReport.reason}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-wider">
                      {selectedReport.type.includes('appeal') ? 'User Supporting Statement' : 'Custom Review Notes / Details'}
                    </span>
                    <p className="text-zinc-300 text-xs font-semibold leading-relaxed mt-1.5 p-3 bg-zinc-950/30 border border-zinc-900 rounded-xl shadow-inner italic">
                      &quot;{selectedReport.type.includes('appeal') ? selectedReport.reason : selectedReport.details || 'No additional details provided.'}&quot;
                    </p>
                  </div>

                  {selectedReport.type === 'account_appeal' && selectedReport.details && (
                    <div>
                      <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-wider">Additional Supporting Info</span>
                      <p className="text-zinc-300 text-xs font-semibold leading-relaxed mt-1.5 p-3 bg-zinc-950/30 border border-zinc-900 rounded-xl shadow-inner select-text">
                        {selectedReport.details}
                      </p>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 font-semibold pt-1 text-right">
                    Opened: {new Date(selectedReport.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* 3. Creator Profile Policy Stats */}
                <div className="bg-zinc-950/20 border border-zinc-850/60 rounded-2.5xl p-5 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-900/60 pb-3 flex items-center justify-between">
                    <span>Creator Policy Profile & Logs</span>
                    <span className="text-[9px] text-zinc-500">ID: {selectedReport.ownerId?.substring(0, 10) || 'None'}</span>
                  </h4>

                  {/* Violation Counters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl text-center">
                      <span className="block text-[8px] text-zinc-500 font-black uppercase tracking-wider">Active Violations</span>
                      <span className={`block text-xl font-black mt-1 ${creatorStats.violations > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                        {creatorStats.violations}
                      </span>
                    </div>
                    <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl text-center">
                      <span className="block text-[8px] text-zinc-500 font-black uppercase tracking-wider">Pending Claims</span>
                      <span className={`block text-xl font-black mt-1 ${creatorStats.pending > 0 ? 'text-amber-500' : 'text-zinc-400'}`}>
                        {creatorStats.pending}
                      </span>
                    </div>
                  </div>

                  {/* Audit Logs Timeline */}
                  <div className="space-y-2">
                    <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-wider">Moderation Action Timeline Logs</span>
                    {creatorStats.logs.length === 0 ? (
                      <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wide py-2 bg-zinc-950/20 text-center rounded-xl">
                        No previous policy actions recorded for this creator
                      </p>
                    ) : (
                      <div className="relative pl-4 border-l border-zinc-800 space-y-4 pt-2">
                        {creatorStats.logs.map((log: any) => (
                          <div key={log.id} className="relative text-xs">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-zinc-900 shadow"></div>
                            
                            <div className="flex items-center justify-between text-[9px] text-zinc-500 font-bold uppercase">
                              <span>Action: <strong className="text-zinc-300">{log.action.replace('_', ' ')}</strong></span>
                              <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                            </div>
                            
                            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                              {log.reason || 'No detailed reason logged.'}
                            </p>
                            
                            <span className="block text-[8px] text-zinc-600 font-bold mt-0.5">
                              Admin: {log.adminEmail}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Action & Resolution Station */}
                <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2.5xl p-5 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-900/60 pb-3">
                    Action & Resolution Station
                  </h4>

                  {selectedReport.status === 'pending' || selectedReport.status === 'under_review' ? (
                    <div className="space-y-4">
                      
                      {/* Notes Area for Reports */}
                      {!selectedReport.type.includes('appeal') && (
                        <div className="space-y-2">
                          <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500">
                            Resolution Explanation / Internal Policy Notes
                          </label>
                          <textarea
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            rows={3}
                            className="block w-full px-4 py-3 border border-zinc-800 bg-zinc-950/50 text-white placeholder-zinc-700 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                            placeholder="Explain why this content violated or satisfied guidelines..."
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        {/* 1. Prompt Reports resolving */}
                        {selectedReport.type === 'prompt' && (
                          <>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleUpdateStatus('dismissed')}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                              >
                                Dismiss Claim
                              </button>

                              {selectedReport.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus('under_review', 'Assigning report to review team under active audit.')}
                                  disabled={submitting}
                                  className="flex-1 px-4 py-3 bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-cyan-400 hover:text-cyan-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                  Assign to Audit
                                </button>
                              )}
                              {selectedReport.status === 'under_review' && (
                                <button
                                  onClick={() => handleUpdateStatus('escalated', 'Escalated to senior admin for high-priority review.')}
                                  disabled={submitting}
                                  className="flex-1 px-4 py-3 bg-orange-950/30 hover:bg-orange-950/50 border border-orange-900/30 text-orange-400 hover:text-orange-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                  ⚡ Escalate
                                </button>
                              )}
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-zinc-900/60">
                              <button
                                onClick={() => handleUpdateStatus('resolved', undefined, 'warn')}
                                disabled={submitting || !actionReason.trim()}
                                className="flex-1 px-4 py-3 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/30 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-45"
                              >
                                Warn Creator
                              </button>

                              <button
                                onClick={() => handleUpdateStatus('resolved', undefined, 'hide')}
                                disabled={submitting || !actionReason.trim()}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-650 to-indigo-650 hover:from-red-600 hover:to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all disabled:opacity-40"
                              >
                                Hide & Resolve
                              </button>
                            </div>
                          </>
                        )}

                        {/* 2. User Reports resolving */}
                        {selectedReport.type === 'user' && (
                          <>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleUpdateStatus('dismissed')}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                              >
                                Dismiss Claim
                              </button>

                              {selectedReport.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus('under_review', 'Assigning report to review team under active audit.')}
                                  disabled={submitting}
                                  className="flex-1 px-4 py-3 bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-cyan-400 hover:text-cyan-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                  Assign to Audit
                                </button>
                              )}
                            </div>

                            <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-900/60">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleUpdateStatus('resolved', undefined, 'warn')}
                                  disabled={submitting || !actionReason.trim()}
                                  className="flex-1 px-4 py-3 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/30 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-45"
                                >
                                  Warn User
                                </button>

                                <button
                                  onClick={() => handleUpdateStatus('resolved', undefined, 'suspend')}
                                  disabled={submitting || !actionReason.trim()}
                                  className="flex-1 px-4 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-45"
                                >
                                  Suspend User
                                </button>
                              </div>

                              <button
                                onClick={() => handleUpdateStatus('resolved', undefined, 'permanent_ban')}
                                disabled={submitting || !actionReason.trim()}
                                className="w-full py-3 bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all disabled:opacity-40"
                              >
                                Permanently Ban User
                              </button>
                            </div>
                          </>
                        )}

                        {/* 3. Appeals resolving (Account & Prompt Appeals) */}
                        {selectedReport.type.includes('appeal') && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleResolveAppeal('reject')}
                              disabled={submitting}
                              className="flex-1 py-3 px-4 bg-red-950/25 hover:bg-red-950/45 border border-red-900/30 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              Reject Appeal
                            </button>

                            <button
                              onClick={() => handleResolveAppeal('approve')}
                              disabled={submitting}
                              className="flex-1 py-3 px-4 bg-emerald-950/25 hover:bg-emerald-950/45 border border-emerald-900/30 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              Approve & Restore
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl text-center flex items-center justify-center gap-2 text-zinc-500">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        This safety ticket has been permanently closed ({selectedReport.status})
                      </span>
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
