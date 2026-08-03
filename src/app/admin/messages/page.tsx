'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  MailOpen, 
  Archive, 
  Trash2, 
  Search, 
  Inbox, 
  Clock, 
  User, 
  ChevronRight, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  CornerUpLeft,
  ShieldAlert,
  FileText,
  XCircle,
  Eye,
  Send,
  MessageSquare,
  AlertCircle,
  Filter
} from 'lucide-react';

import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminStatCard from '@/components/admin/ui/AdminStatCard';
import AdminDataTable, { Column } from '@/components/admin/ui/AdminDataTable';
import AdminStatusBadge from '@/components/admin/ui/AdminStatusBadge';
import AdminConfirmDialog from '@/components/admin/ui/AdminConfirmDialog';
import AdminSlideOver from '@/components/admin/ui/AdminSlideOver';

import { 
  getContactMessagesAdmin, 
  updateContactMessageStatusAdmin, 
  deleteContactMessageAdmin,
  replyToContactMessageAdmin,
  getAppealsAdmin,
  resolveAppealAction,
  getPromptAppealsAdmin,
  resolvePromptAppealAction
} from '@/app/actions/adminActions';

export default function ContactMessagesPage() {
  // Main Data States
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  
  // Page Navigation State
  const [viewMode, setViewMode] = useState<'messages' | 'appeals' | 'prompt_appeals'>('messages');
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;

  // Compose Reply & SlideOver Drawer State
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replyStatus, setReplyStatus] = useState<string | null>(null);
  const [emailDeliveryInfo, setEmailDeliveryInfo] = useState<string | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Account Appeals States
  const [appeals, setAppeals] = useState<any[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [appealSearchQuery, setAppealSearchQuery] = useState('');

  // Prompt Appeals States
  const [promptAppeals, setPromptAppeals] = useState<any[]>([]);
  const [selectedPromptAppeal, setSelectedPromptAppeal] = useState<any>(null);
  const [promptAppealsLoading, setPromptAppealsLoading] = useState(false);
  const [promptAppealSearchQuery, setPromptAppealSearchQuery] = useState('');

  // Confirmation Dialog States
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete_message' | 'resolve_appeal' | 'resolve_prompt_appeal';
    targetId: string;
    title: string;
    description: string;
    action?: 'approve' | 'reject';
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    type: 'delete_message',
    targetId: '',
    title: '',
    description: ''
  });
  const [resolutionReason, setResolutionReason] = useState('');
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  // Load Messages
  const loadMessages = async () => {
    setLoading(true);
    const res = await getContactMessagesAdmin();
    if (res.success && res.messages) {
      setMessages(res.messages);
    }
    setLoading(false);
  };

  // Load User Appeals
  const loadAppeals = async () => {
    setAppealsLoading(true);
    const res = await getAppealsAdmin();
    if (res.success && res.appeals) {
      setAppeals(res.appeals);
    }
    setAppealsLoading(false);
  };

  // Load Prompt Appeals
  const loadPromptAppeals = async () => {
    setPromptAppealsLoading(true);
    const res = await getPromptAppealsAdmin();
    if (res.success && res.appeals) {
      setPromptAppeals(res.appeals);
    }
    setPromptAppealsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages();
    loadAppeals();
    loadPromptAppeals();
  }, []);

  // Stats Calculations
  const stats = useMemo(() => {
    const unreadCount = messages.filter(m => m.status === 'unread').length;
    const pendingAppeals = appeals.filter(a => a.status === 'pending').length;
    const pendingPromptAppeals = promptAppeals.filter(pa => pa.status === 'pending').length;
    return {
      totalMessages: messages.length,
      unreadCount,
      pendingAppeals,
      pendingPromptAppeals
    };
  }, [messages, appeals, promptAppeals]);

  // Handle Opening Message Details in SlideOver Drawer
  const handleOpenMessageDetail = (msg: any) => {
    setSelectedMessage(msg);
    setReplyBody('');
    setReplyStatus(null);
    setEmailDeliveryInfo(null);
    setSlideOverOpen(true);

    // Auto-mark unread message as read WITHOUT triggering full-screen loading spinner
    if (msg.status === 'unread') {
      // Optimistic state update
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
      setSelectedMessage((prev: any) => prev ? { ...prev, status: 'read' } : null);
      // Background action
      updateContactMessageStatusAdmin(msg.id, 'read').catch(err => {
        console.error('Failed to update message status:', err);
      });
    }
  };

  // Handle Status Update (Read / Unread / Archived)
  const handleStatusChange = async (id: string, status: 'read' | 'unread' | 'archived') => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    if (selectedMessage?.id === id) {
      setSelectedMessage((prev: any) => prev ? { ...prev, status } : null);
    }
    await updateContactMessageStatusAdmin(id, status);
  };

  // Handle Send Reply Action
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !selectedMessage) return;

    setIsSendingReply(true);
    setReplyStatus(null);
    setEmailDeliveryInfo(null);

    try {
      const res = await replyToContactMessageAdmin(selectedMessage.id, replyBody.trim());
      if (res.success && res.message) {
        const updatedMsg = res.message;
        setReplyStatus('success');
        setEmailDeliveryInfo(res.emailDelivery?.success ? 'Email dispatched successfully via support mailer.' : 'Inquiry history saved (Email delivery log updated).');
        setSelectedMessage(updatedMsg);
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        setReplyBody('');
      } else {
        setReplyStatus('error');
      }
    } catch (err) {
      console.error(err);
      setReplyStatus('error');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Confirm Actions Handler
  const handleExecuteConfirmedAction = async () => {
    setIsSubmittingConfirm(true);
    try {
      if (confirmDialog.type === 'delete_message') {
        const res = await deleteContactMessageAdmin(confirmDialog.targetId);
        if (res.success) {
          setMessages(prev => prev.filter(m => m.id !== confirmDialog.targetId));
          if (selectedMessage?.id === confirmDialog.targetId) {
            setSelectedMessage(null);
            setSlideOverOpen(false);
          }
        }
      } else if (confirmDialog.type === 'resolve_appeal') {
        const action = confirmDialog.action || 'approve';
        const res = await resolveAppealAction(confirmDialog.targetId, action);
        if (res.success) {
          setAppeals(prev => prev.map(a => a.id === confirmDialog.targetId ? { ...a, status: action === 'approve' ? 'approved' : 'rejected' } : a));
          if (selectedAppeal?.id === confirmDialog.targetId) {
            setSelectedAppeal((prev: any) => prev ? { ...prev, status: action === 'approve' ? 'approved' : 'rejected' } : null);
          }
        }
      } else if (confirmDialog.type === 'resolve_prompt_appeal') {
        const action = confirmDialog.action || 'approve';
        const res = await resolvePromptAppealAction(confirmDialog.targetId, action);
        if (res.success) {
          setPromptAppeals(prev => prev.map(pa => pa.id === confirmDialog.targetId ? { ...pa, status: action === 'approve' ? 'approved' : 'rejected' } : pa));
          if (selectedPromptAppeal?.id === confirmDialog.targetId) {
            setSelectedPromptAppeal((prev: any) => prev ? { ...prev, status: action === 'approve' ? 'approved' : 'rejected' } : null);
          }
        }
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setIsSubmittingConfirm(false);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      setResolutionReason('');
    }
  };

  // Filtered Messages
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const matchesSearch = (m.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (m.message || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === 'unread') return m.status === 'unread';
      if (activeTab === 'archived') return m.status === 'archived';
      return m.status !== 'archived';
    });
  }, [messages, searchQuery, activeTab]);

  // Filtered Appeals
  const filteredAppeals = useMemo(() => {
    return appeals.filter(a => {
      const search = appealSearchQuery.toLowerCase();
      return (a.email || '').toLowerCase().includes(search) ||
             (a.reason || '').toLowerCase().includes(search) ||
             (a.id || '').toLowerCase().includes(search);
    });
  }, [appeals, appealSearchQuery]);

  // Filtered Prompt Appeals
  const filteredPromptAppeals = useMemo(() => {
    return promptAppeals.filter(pa => {
      const search = promptAppealSearchQuery.toLowerCase();
      return (pa.promptTitle || '').toLowerCase().includes(search) ||
             (pa.reason || '').toLowerCase().includes(search) ||
             (pa.id || '').toLowerCase().includes(search);
    });
  }, [promptAppeals, promptAppealSearchQuery]);

  // Columns for Support Messages Table
  const messageColumns: Column<any>[] = [
    {
      key: 'sender',
      header: 'Sender Email',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900">{item.email}</span>
          <span className="text-[10px] text-zinc-400 font-mono">ID: {item.id.substring(0, 8)}...</span>
        </div>
      )
    },
    {
      key: 'subject',
      header: 'Subject / Preview',
      render: (item) => (
        <div className="flex flex-col max-w-md">
          <span className="font-semibold text-zinc-800 truncate">{item.subject || 'Support Inquiry'}</span>
          <span className="text-xs text-zinc-500 truncate leading-relaxed">{item.message}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <AdminStatusBadge 
          status={item.status} 
          label={item.status === 'unread' ? 'Unread' : item.status === 'read' ? 'Read' : 'Archived'} 
        />
      )
    },
    {
      key: 'date',
      header: 'Received Date',
      render: (item) => (
        <span className="text-xs text-zinc-500 font-medium">
          {item.created_at || item.timestamp ? new Date(item.created_at || item.timestamp).toLocaleDateString() : 'Recent'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenMessageDetail(item)}
            className="p-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="View & Reply"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Open</span>
          </button>
          
          <button
            onClick={() => handleStatusChange(item.id, item.status === 'archived' ? 'read' : 'archived')}
            className="p-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
            title={item.status === 'archived' ? 'Unarchive' : 'Archive'}
          >
            <Archive className="w-3.5 h-3.5 text-amber-600" />
          </button>

          <button
            onClick={() => setConfirmDialog({
              isOpen: true,
              type: 'delete_message',
              targetId: item.id,
              title: 'Delete Contact Inquiry',
              description: `Are you sure you want to permanently delete the inquiry from ${item.email}? This action cannot be undone.`,
              variant: 'danger'
            })}
            className="p-1.5 rounded-lg border border-zinc-200 hover:border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
            title="Delete Message"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  // Columns for User Appeals Table
  const appealColumns: Column<any>[] = [
    {
      key: 'user',
      header: 'User Account',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900">{item.email}</span>
          <span className="text-[10px] font-mono text-zinc-400">User ID: {item.user_id?.substring(0, 10)}...</span>
        </div>
      )
    },
    {
      key: 'reason',
      header: 'Appeal Reason / Explanation',
      render: (item) => (
        <div className="max-w-md">
          <p className="text-xs text-zinc-700 font-medium line-clamp-2 leading-relaxed">{item.reason}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <AdminStatusBadge status={item.status} />
    },
    {
      key: 'date',
      header: 'Submitted',
      render: (item) => (
        <span className="text-xs text-zinc-500 font-medium">
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {item.status === 'pending' ? (
            <>
              <button
                onClick={() => setConfirmDialog({
                  isOpen: true,
                  type: 'resolve_appeal',
                  targetId: item.id,
                  action: 'approve',
                  title: 'Approve Account Appeal',
                  description: `Reactivate account for ${item.email}? Specify an optional resolution note.`,
                  variant: 'info'
                })}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={() => setConfirmDialog({
                  isOpen: true,
                  type: 'resolve_appeal',
                  targetId: item.id,
                  action: 'reject',
                  title: 'Reject Account Appeal',
                  description: `Reject account appeal for ${item.email}? Provide rejection details if needed.`,
                  variant: 'danger'
                })}
                className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          ) : (
            <span className="text-xs font-semibold text-zinc-400 capitalize">{item.status}</span>
          )}
        </div>
      )
    }
  ];

  // Columns for Prompt Appeals Table
  const promptAppealColumns: Column<any>[] = [
    {
      key: 'prompt',
      header: 'Prompt Info',
      render: (item) => (
        <div className="flex flex-col max-w-xs">
          <span className="font-semibold text-zinc-900 truncate">{item.promptTitle || 'Prompt Moderation Appeal'}</span>
          <span className="text-[10px] font-mono text-zinc-400">Prompt ID: {item.prompt_id?.substring(0, 10)}...</span>
        </div>
      )
    },
    {
      key: 'notes',
      header: 'Appeal Statement',
      render: (item) => (
        <div className="max-w-md">
          <p className="text-xs text-zinc-700 font-medium line-clamp-2 leading-relaxed">{item.reason || item.notes}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <AdminStatusBadge status={item.status} />
    },
    {
      key: 'date',
      header: 'Submitted',
      render: (item) => (
        <span className="text-xs text-zinc-500 font-medium">
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {item.status === 'pending' ? (
            <>
              <button
                onClick={() => setConfirmDialog({
                  isOpen: true,
                  type: 'resolve_prompt_appeal',
                  targetId: item.id,
                  action: 'approve',
                  title: 'Approve Prompt Appeal',
                  description: `Restore prompt "${item.promptTitle || 'Prompt'}" to public catalog?`,
                  variant: 'info'
                })}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={() => setConfirmDialog({
                  isOpen: true,
                  type: 'resolve_prompt_appeal',
                  targetId: item.id,
                  action: 'reject',
                  title: 'Reject Prompt Appeal',
                  description: `Reject moderation appeal for prompt "${item.promptTitle || 'Prompt'}"?`,
                  variant: 'danger'
                })}
                className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          ) : (
            <span className="text-xs font-semibold text-zinc-400 capitalize">{item.status}</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <AdminPageHeader
        title="Messages & Mail Support"
        description="Review user contact inquiries, support emails, account moderation appeals, and prompt restore requests."
        icon={Mail}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Messages & Mail' }
        ]}
      >
        {/* View Mode Toggle Buttons */}
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          <button
            onClick={() => { setViewMode('messages'); setPageIndex(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'messages'
                ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-indigo-600" />
            <span>Support Inquiries</span>
            {stats.unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                {stats.unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setViewMode('appeals'); setPageIndex(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'appeals'
                ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>User Appeals</span>
            {stats.pendingAppeals > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {stats.pendingAppeals}
              </span>
            )}
          </button>

          <button
            onClick={() => { setViewMode('prompt_appeals'); setPageIndex(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'prompt_appeals'
                ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>Prompt Appeals</span>
            {stats.pendingPromptAppeals > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                {stats.pendingPromptAppeals}
              </span>
            )}
          </button>
        </div>
      </AdminPageHeader>

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Inquiries"
          value={stats.totalMessages}
          subtitle="All platform support messages"
          icon={Mail}
          variant="indigo"
        />
        <AdminStatCard
          title="Unread Messages"
          value={stats.unreadCount}
          subtitle="Pending support response"
          icon={Inbox}
          variant={stats.unreadCount > 0 ? "rose" : "emerald"}
        />
        <AdminStatCard
          title="Account Appeals"
          value={stats.pendingAppeals}
          subtitle="Pending user review"
          icon={ShieldAlert}
          variant={stats.pendingAppeals > 0 ? "amber" : "zinc"}
        />
        <AdminStatCard
          title="Prompt Appeals"
          value={stats.pendingPromptAppeals}
          subtitle="Pending content review"
          icon={FileText}
          variant={stats.pendingPromptAppeals > 0 ? "indigo" : "zinc"}
        />
      </div>

      {/* 3. Main Data Views */}
      {viewMode === 'messages' && (
        <div className="space-y-4">
          {/* Controls Bar: Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-zinc-200/80 p-4 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => { setActiveTab('all'); setPageIndex(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                All Messages ({messages.filter(m => m.status !== 'archived').length})
              </button>
              <button
                onClick={() => { setActiveTab('unread'); setPageIndex(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'unread' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Unread ({stats.unreadCount})
              </button>
              <button
                onClick={() => { setActiveTab('archived'); setPageIndex(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'archived' ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Archived ({messages.filter(m => m.status === 'archived').length})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search email, subject, body..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPageIndex(1); }}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-zinc-50/50"
              />
            </div>
          </div>

          {/* Messages Table */}
          <AdminDataTable
            columns={messageColumns}
            data={filteredMessages.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)}
            loading={loading}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => handleOpenMessageDetail(item)}
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalItems={filteredMessages.length}
            onPageChange={(p) => setPageIndex(p)}
            emptyTitle="No support inquiries found"
            emptyDescription="There are no contact messages matching the active filter criteria."
          />
        </div>
      )}

      {viewMode === 'appeals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-zinc-200/80 p-4 rounded-2xl shadow-xs">
            <div className="text-xs font-semibold text-zinc-500">
              Showing <strong className="text-zinc-900">{filteredAppeals.length}</strong> account suspension appeals
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search user email or reason..."
                value={appealSearchQuery}
                onChange={(e) => { setAppealSearchQuery(e.target.value); setPageIndex(1); }}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-zinc-50/50"
              />
            </div>
          </div>

          <AdminDataTable
            columns={appealColumns}
            data={filteredAppeals.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)}
            loading={appealsLoading}
            keyExtractor={(item) => item.id}
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalItems={filteredAppeals.length}
            onPageChange={(p) => setPageIndex(p)}
            emptyTitle="No account appeals"
            emptyDescription="No user account appeals have been submitted or match your search."
          />
        </div>
      )}

      {viewMode === 'prompt_appeals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-zinc-200/80 p-4 rounded-2xl shadow-xs">
            <div className="text-xs font-semibold text-zinc-500">
              Showing <strong className="text-zinc-900">{filteredPromptAppeals.length}</strong> prompt moderation appeals
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search prompt title or reason..."
                value={promptAppealSearchQuery}
                onChange={(e) => { setPromptAppealSearchQuery(e.target.value); setPageIndex(1); }}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-zinc-50/50"
              />
            </div>
          </div>

          <AdminDataTable
            columns={promptAppealColumns}
            data={filteredPromptAppeals.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)}
            loading={promptAppealsLoading}
            keyExtractor={(item) => item.id}
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalItems={filteredPromptAppeals.length}
            onPageChange={(p) => setPageIndex(p)}
            emptyTitle="No prompt appeals"
            emptyDescription="There are no prompt moderation restore appeals requiring review."
          />
        </div>
      )}

      {/* 4. SlideOver Drawer: Support Inquiry Details & Email Composer */}
      <AdminSlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="Inquiry Details & Support Composer"
        description={selectedMessage ? `Inquiry from ${selectedMessage.email}` : ''}
      >
        {selectedMessage && (
          <div className="space-y-6">
            
            {/* Header info card */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-zinc-900">{selectedMessage.email}</span>
                </div>
                <AdminStatusBadge status={selectedMessage.status} />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Subject</span>
                <p className="text-xs font-bold text-zinc-800">{selectedMessage.subject || 'Support Inquiry'}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Received Timestamp</span>
                <span className="text-xs text-zinc-500 font-medium">
                  {selectedMessage.created_at || selectedMessage.timestamp ? new Date(selectedMessage.created_at || selectedMessage.timestamp).toLocaleString() : 'Recent'}
                </span>
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">Original User Message</span>
              <div className="p-4 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-800 leading-relaxed font-normal whitespace-pre-wrap shadow-2xs">
                {selectedMessage.message}
              </div>
            </div>

            {/* Conversation / Reply History */}
            {selectedMessage.replies && selectedMessage.replies.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-200">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Reply History ({selectedMessage.replies.length})
                </span>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {selectedMessage.replies.map((r: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-1.5">
                      <div className="flex justify-between text-[10px] font-semibold text-indigo-900">
                        <span>Replied by: {r.adminEmail || 'Support Admin'}</span>
                        <span className="text-zinc-500">{new Date(r.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-zinc-800 font-medium leading-relaxed">{r.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compose Email Reply Section */}
            <div className="space-y-3 pt-4 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <CornerUpLeft className="w-4 h-4 text-indigo-600" />
                  Compose Support Email Reply
                </span>

                <a 
                  href={`mailto:${selectedMessage.email}?subject=Reply from Prizom Support: ${encodeURIComponent(selectedMessage.subject || '')}`}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  External Client <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {replyStatus === 'success' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">Reply Submitted & Saved to Inquiry History!</p>
                    {emailDeliveryInfo && <p className="text-[11px] font-normal text-emerald-600 mt-0.5">{emailDeliveryInfo}</p>}
                  </div>
                </div>
              )}

              {replyStatus === 'error' && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Failed to submit support reply. Please check connection and try again.</span>
                </div>
              )}

              <form onSubmit={handleSendReply} className="space-y-3">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type your official support response to send via email..."
                  rows={5}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none bg-white"
                  required
                />

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyBody.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending Email Reply...
                      </>
                    ) : (
                      <>
                        Send Email Reply
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}
      </AdminSlideOver>

      {/* 5. Admin Confirm Dialog */}
      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteConfirmedAction}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        isSubmitting={isSubmittingConfirm}
      >
        {confirmDialog.type !== 'delete_message' && (
          <div className="space-y-2 mt-2">
            <label className="block text-xs font-semibold text-zinc-700">
              Resolution Note / Explanation (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Account reinstated after policy review"
              value={resolutionReason}
              onChange={(e) => setResolutionReason(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        )}
      </AdminConfirmDialog>

    </div>
  );
}
