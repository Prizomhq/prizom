'use client';

import { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
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
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  
  // Compose reply state
  const [replyBody, setReplyBody] = useState('');
  const [replyStatus, setReplyStatus] = useState<string | null>(null);

  // View mode and appeals states
  const [viewMode, setViewMode] = useState<'messages' | 'appeals' | 'prompt_appeals'>('messages');
  const [appeals, setAppeals] = useState<any[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [appealSearchQuery, setAppealSearchQuery] = useState('');

  // Prompt appeals states
  const [promptAppeals, setPromptAppeals] = useState<any[]>([]);
  const [selectedPromptAppeal, setSelectedPromptAppeal] = useState<any>(null);
  const [promptAppealsLoading, setPromptAppealsLoading] = useState(false);
  const [promptAppealSearchQuery, setPromptAppealSearchQuery] = useState('');

  const loadMessages = async (selectId?: string) => {
    setLoading(true);
    const res = await getContactMessagesAdmin();
    if (res.success && res.messages) {
      setMessages(res.messages);
      
      // Auto-select first message or keep current selection updated
      if (res.messages.length > 0) {
        if (selectId) {
          const current = res.messages.find(m => m.id === selectId);
          setSelectedMessage(current || res.messages[0]);
        } else if (!selectedMessage) {
          setSelectedMessage(res.messages[0]);
        } else {
          const current = res.messages.find(m => m.id === selectedMessage.id);
          setSelectedMessage(current || res.messages[0]);
        }
      } else {
        setSelectedMessage(null);
      }
    }
    setLoading(false);
  };

  const loadAppeals = async (selectId?: string) => {
    setAppealsLoading(true);
    const res = await getAppealsAdmin();
    if (res.success && res.appeals) {
      setAppeals(res.appeals);
      if (res.appeals.length > 0) {
        if (selectId) {
          setSelectedAppeal(res.appeals.find((a: any) => a.id === selectId) || res.appeals[0]);
        } else if (!selectedAppeal) {
          setSelectedAppeal(res.appeals[0]);
        } else {
          setSelectedAppeal(res.appeals.find((a: any) => a.id === selectedAppeal.id) || res.appeals[0]);
        }
      } else {
        setSelectedAppeal(null);
      }
    }
    setAppealsLoading(false);
  };

  const loadPromptAppeals = async (selectId?: string) => {
    setPromptAppealsLoading(true);
    const res = await getPromptAppealsAdmin();
    if (res.success && res.appeals) {
      setPromptAppeals(res.appeals);
      if (res.appeals.length > 0) {
        if (selectId) {
          setSelectedPromptAppeal(res.appeals.find((a: any) => a.id === selectId) || res.appeals[0]);
        } else if (!selectedPromptAppeal) {
          setSelectedPromptAppeal(res.appeals[0]);
        } else {
          setSelectedPromptAppeal(res.appeals.find((a: any) => a.id === selectedPromptAppeal.id) || res.appeals[0]);
        }
      } else {
        setSelectedPromptAppeal(null);
      }
    }
    setPromptAppealsLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (viewMode === 'appeals') {
      loadAppeals();
    } else if (viewMode === 'prompt_appeals') {
      loadPromptAppeals();
    }
  }, [viewMode]);

  const handleStatusChange = async (id: string, status: 'unread' | 'read' | 'archived') => {
    setUpdating(true);
    const res = await updateContactMessageStatusAdmin(id, status);
    if (res.success) {
      await loadMessages(id);
    } else {
      alert(res.error || 'Failed to update message status.');
    }
    setUpdating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this contact message?')) return;
    setUpdating(true);
    const res = await deleteContactMessageAdmin(id);
    if (res.success) {
      // Clear selection if deleted
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      await loadMessages();
    } else {
      alert(res.error || 'Failed to delete message.');
    }
    setUpdating(false);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !selectedMessage) return;

    setReplyStatus('sending');
    const res = await replyToContactMessageAdmin(selectedMessage.id, replyBody);
    if (res.success) {
      setReplyStatus('success');
      setReplyBody('');
      setTimeout(() => setReplyStatus(null), 3000);
      await loadMessages(selectedMessage.id);
    } else {
      setReplyStatus(null);
      alert(res.error || 'Failed to submit reply.');
    }
  };

  const handleResolveAppeal = async (appealId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this appeal?`)) return;
    setUpdating(true);
    const res = await resolveAppealAction(appealId, action);
    if (res.success) {
      await loadAppeals();
    } else {
      alert(res.error || `Failed to ${action} appeal.`);
    }
    setUpdating(false);
  };

  const handleResolvePromptAppeal = async (appealId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this prompt appeal?`)) return;
    setUpdating(true);
    const res = await resolvePromptAppealAction(appealId, action);
    if (res.success) {
      await loadPromptAppeals();
    } else {
      alert(res.error || `Failed to ${action} appeal.`);
    }
    setUpdating(false);
  };

  // Filter and search messages
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'unread') {
      return matchesSearch && msg.status === 'unread';
    }
    if (activeTab === 'archived') {
      return matchesSearch && msg.status === 'archived';
    }
    return matchesSearch && msg.status !== 'archived'; // All tab shows unread & read, filters out archived
  });

  const filteredAppeals = appeals.filter(app => {
    const query = appealSearchQuery.toLowerCase();
    return app.username.toLowerCase().includes(query) ||
           app.email.toLowerCase().includes(query) ||
           app.reason.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation Mode Toggle */}
      <div className="flex gap-4 border-b border-zinc-800/80 pb-4">
        <button
          onClick={() => setViewMode('messages')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            viewMode === 'messages'
              ? 'bg-zinc-850 text-white shadow-sm border border-zinc-800'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Mail className="w-4 h-4" />
          Support Inbox
        </button>
        <button
          onClick={() => setViewMode('appeals')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            viewMode === 'appeals'
              ? 'bg-zinc-850 text-white shadow-sm border border-zinc-800'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          User Suspension Appeals
        </button>
        <button
          onClick={() => setViewMode('prompt_appeals')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            viewMode === 'prompt_appeals'
              ? 'bg-zinc-850 text-white shadow-sm border border-zinc-800'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          Prompt Removal Appeals
        </button>
      </div>

      {viewMode === 'messages' ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <Mail className="w-8 h-8 text-indigo-500" />
                Contact Messages
              </h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                Read, moderate, and reply to guest & creator inquiries from the support inbox
              </p>
            </div>
            
            {updating && (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                Syncing Mailbox...
              </div>
            )}
          </div>

          {/* Main Inbox Panel */}
          {loading && messages.length === 0 ? (
            <div className="min-h-[50vh] flex items-center justify-center text-zinc-400">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-widest">Loading Support Mailbox...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#121215]/60 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl p-6 min-h-[70vh]">
              
              {/* Left Column: Inbox List (4 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-4 border-b lg:border-b-0 lg:border-r border-zinc-800/80 pb-6 lg:pb-0 lg:pr-6">
                
                {/* Search and Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search sender email or keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-2xl text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                    />
                  </div>
                  
                  <div className="flex bg-zinc-950/50 p-1 rounded-xl border border-zinc-800/50">
                    {(['all', 'unread', 'archived'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          activeTab === tab 
                            ? 'bg-zinc-850 text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto max-h-[55vh] pr-2 space-y-2 no-scrollbar">
                  {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600">
                      <Inbox className="w-10 h-10 mb-3 text-zinc-700" />
                      <p className="text-xs font-black uppercase tracking-wider">No Inquiries Found</p>
                      <p className="text-[10px] font-bold text-zinc-500 mt-1">There are no messages matching this filter.</p>
                    </div>
                  ) : (
                    filteredMessages.map((msg) => {
                      const isSelected = selectedMessage?.id === msg.id;
                      const isUnread = msg.status === 'unread';
                      return (
                        <button
                          key={msg.id}
                          onClick={() => {
                            setSelectedMessage(msg);
                            // Auto mark as read on click
                            if (msg.status === 'unread') {
                              handleStatusChange(msg.id, 'read');
                            }
                          }}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col justify-between relative group cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-650/15 border-indigo-500/50 shadow-[0_4px_20px_rgba(99,102,241,0.15)] text-white' 
                              : isUnread
                                ? 'bg-zinc-900/60 border-indigo-950/80 hover:bg-zinc-850/40 text-zinc-200' 
                                : 'bg-zinc-950/20 border-zinc-900 hover:bg-zinc-850/20 text-zinc-400'
                          }`}
                        >
                          {/* Unread Ring indicator */}
                          {isUnread && (
                            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse" />
                          )}

                          <div className="flex justify-between items-start w-full pr-4">
                            <span className={`text-[11px] truncate font-black tracking-wide ${isUnread ? 'text-white' : 'text-zinc-300'}`}>
                              {msg.email}
                            </span>
                          </div>

                          <p className="text-[10px] line-clamp-2 mt-2 leading-relaxed text-zinc-400 font-semibold">
                            {msg.message}
                          </p>

                          <div className="flex items-center gap-1.5 mt-3.5 text-[9px] font-black uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Detailed Reader view (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between min-h-[50vh]">
                {selectedMessage ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    
                    {/* Message Header Info */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-black text-white truncate">{selectedMessage.email}</h3>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-zinc-600" />
                              {new Date(selectedMessage.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-widest ${
                            selectedMessage.status === 'unread' 
                              ? 'text-indigo-400 bg-indigo-950/20 border-indigo-900/20' 
                              : selectedMessage.status === 'archived'
                                ? 'text-yellow-500 bg-yellow-950/20 border-yellow-900/20'
                                : 'text-zinc-400 bg-zinc-900 border-zinc-800'
                          }`}>
                            {selectedMessage.status}
                          </span>
                        </div>

                      </div>

                      {/* Actions Bar */}
                      <div className="flex flex-wrap items-center gap-2 bg-zinc-950/40 p-2.5 rounded-2xl border border-zinc-900">
                        {selectedMessage.status !== 'archived' ? (
                          <button
                            onClick={() => handleStatusChange(selectedMessage.id, 'archived')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5 text-zinc-500" />
                            Archive
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(selectedMessage.id, 'read')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-zinc-300 transition-colors cursor-pointer"
                          >
                            <MailOpen className="w-3.5 h-3.5 text-zinc-500" />
                            Un-archive
                          </button>
                        )}

                        {selectedMessage.status === 'unread' ? (
                          <button
                            onClick={() => handleStatusChange(selectedMessage.id, 'read')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-zinc-300 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
                            Mark Read
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(selectedMessage.id, 'unread')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            Mark Unread
                          </button>
                        )}

                        <div className="flex-1" />

                        <button
                          onClick={() => handleDelete(selectedMessage.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Message
                        </button>
                      </div>
                    </div>

                    {/* Message Body & Reply History Content */}
                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[35vh] pr-2 my-4">
                      <div className="bg-zinc-950/20 border border-zinc-900/50 p-6 sm:p-8 rounded-[2rem] shadow-inner">
                        <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-2">Original Inquiry</span>
                        <p className="text-zinc-200 text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                          {selectedMessage.message}
                        </p>
                      </div>

                      {/* Render replies timeline */}
                      {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                            <span>Reply History ({selectedMessage.replies.length})</span>
                          </h4>
                          {selectedMessage.replies.map((reply: any, rIdx: number) => (
                            <div key={rIdx} className="bg-indigo-950/20 border border-indigo-900/20 p-5 rounded-[2rem] shadow-sm ml-6 relative">
                              <div className="absolute top-5 left-[-12px] w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-indigo-900/20 border-b-[8px] border-b-transparent"></div>
                              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-indigo-400 mb-2">
                                <span>From: {reply.adminEmail}</span>
                                <span>{new Date(reply.repliedAt).toLocaleString()}</span>
                              </div>
                              <p className="text-zinc-300 text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                                {reply.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Compose Dynamic Reply */}
                    <div className="border-t border-zinc-800/80 pt-6">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CornerUpLeft className="w-4 h-4 text-indigo-400" />
                          Compose Email Reply
                        </span>
                        <a 
                          href={`mailto:${selectedMessage.email}?subject=Reply from Prizom Support`}
                          className="text-[9px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 hover:underline lowercase"
                        >
                          Open in external client <ExternalLink className="w-3 h-3" />
                        </a>
                      </h4>

                      {replyStatus === 'success' ? (
                        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-3 animate-fade-in">
                          <CheckCircle2 className="w-5 h-5 animate-bounce" />
                          Reply Submitted and Saved to Inquiry History!
                        </div>
                      ) : (
                        <form onSubmit={handleSendReply} className="space-y-4">
                          <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder={`Draft reply to ${selectedMessage.email}...`}
                            rows={3}
                            className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-2xl text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                            required
                          />
                          
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-[9px] font-bold text-zinc-500 italic">
                              Dispatched directly to sender.
                            </span>
                            
                            <button
                              type="submit"
                              disabled={replyStatus === 'sending' || !replyBody.trim()}
                              className="px-6 py-3 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer font-bold"
                            >
                              {replyStatus === 'sending' ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  Send Official Reply
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-zinc-600">
                    <Mail className="w-12 h-12 mb-4 text-zinc-700 animate-pulse" />
                    <h4 className="text-sm font-black uppercase tracking-wider">Support Inbox Empty</h4>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1.5 font-bold leading-normal">
                      Select a message from the column sidebar to examine sender details, status actions, and draft replies.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}
        </>
      ) : viewMode === 'appeals' ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-red-500" />
                User Suspension Appeals
              </h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                Review and resolve user appeals against account suspensions and moderation actions
              </p>
            </div>
            
            {updating && (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                Processing appeal...
              </div>
            )}
          </div>

          {/* Main Appeals Panel */}
          {appealsLoading && appeals.length === 0 ? (
            <div className="min-h-[50vh] flex items-center justify-center text-zinc-400">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <span className="text-xs font-black uppercase tracking-widest">Loading Appeals Inbox...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#121215]/60 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl p-6 min-h-[70vh]">
              
              {/* Left Column: Appeals List (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-4 border-b lg:border-b-0 lg:border-r border-zinc-800/80 pb-6 lg:pb-0 lg:pr-6">
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={appealSearchQuery}
                    onChange={(e) => setAppealSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-2xl text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
                  />
                </div>

                {/* Appeals List */}
                <div className="flex-1 overflow-y-auto max-h-[55vh] pr-2 space-y-2 no-scrollbar">
                  {filteredAppeals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600">
                      <ShieldAlert className="w-10 h-10 mb-3 text-zinc-700" />
                      <p className="text-xs font-black uppercase tracking-wider">No Appeals Found</p>
                      <p className="text-[10px] font-bold text-zinc-500 mt-1">There are no appeals matching this filter.</p>
                    </div>
                  ) : (
                    filteredAppeals.map((app) => {
                      const isSelected = selectedAppeal?.id === app.id;
                      const isPending = app.status === 'pending';
                      return (
                        <button
                          key={app.id}
                          onClick={() => setSelectedAppeal(app)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col justify-between relative group cursor-pointer ${
                            isSelected 
                              ? 'bg-red-950/15 border-red-500/50 shadow-[0_4px_20px_rgba(239,68,68,0.15)] text-white' 
                              : isPending
                                ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850/40 text-zinc-200' 
                                : 'bg-zinc-950/20 border-zinc-900 hover:bg-zinc-850/20 text-zinc-400'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full pr-4">
                            <span className="text-[11px] truncate font-black tracking-wide text-zinc-250">
                              @{app.username}
                            </span>
                            <span className={`px-1.5 py-0.5 border rounded-md text-[7px] font-black uppercase tracking-widest ${
                              app.status === 'pending'
                                ? 'text-yellow-500 bg-yellow-950/20 border-yellow-900/20 animate-pulse'
                                : app.status === 'approved'
                                  ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/20'
                                  : 'text-red-400 bg-red-950/20 border-red-900/20'
                            }`}>
                              {app.status}
                            </span>
                          </div>

                          <p className="text-[10px] line-clamp-2 mt-2 leading-relaxed text-zinc-400 font-semibold">
                            {app.reason}
                          </p>

                          <div className="flex items-center gap-1.5 mt-3.5 text-[9px] font-black uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Detailed Appeal Reader View (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between min-h-[50vh]">
                {selectedAppeal ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    
                    {/* Header Info */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-400 shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-black text-white truncate">@{selectedAppeal.username}</h3>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-zinc-600" />
                              {new Date(selectedAppeal.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-zinc-400 block">{selectedAppeal.email}</span>
                          <span className={`inline-block mt-1 px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-widest ${
                            selectedAppeal.status === 'pending' 
                              ? 'text-yellow-500 bg-yellow-950/20 border-yellow-900/20' 
                              : selectedAppeal.status === 'approved'
                                ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/20'
                                : 'text-red-400 bg-red-950/20 border-red-900/20'
                          }`}>
                            {selectedAppeal.status}
                          </span>
                        </div>

                      </div>

                      {/* Actions Bar (Only for pending appeals) */}
                      {selectedAppeal.status === 'pending' && (
                        <div className="flex items-center gap-3 bg-zinc-950/40 p-2.5 rounded-2xl border border-zinc-900">
                          <button
                            onClick={() => handleResolveAppeal(selectedAppeal.id, 'approve')}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all shadow-md shadow-emerald-950/20 cursor-pointer font-bold animate-fade-in"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve Appeal
                          </button>

                          <button
                            onClick={() => handleResolveAppeal(selectedAppeal.id, 'reject')}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-red-400 transition-colors cursor-pointer font-bold animate-fade-in"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject Appeal
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Appeal details */}
                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[40vh] pr-2 my-4">
                      <div className="bg-zinc-950/20 border border-zinc-900/50 p-6 sm:p-8 rounded-[2rem] shadow-inner">
                        <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-2">Appeal Reason</span>
                        <p className="text-zinc-200 text-xs font-semibold leading-relaxed whitespace-pre-wrap text-zinc-300">
                          {selectedAppeal.reason}
                        </p>
                      </div>

                      {selectedAppeal.supportingInfo && (
                        <div className="bg-zinc-950/25 border border-zinc-900/30 p-6 sm:p-8 rounded-[2rem] shadow-inner">
                          <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-2">Supporting Information</span>
                          <p className="text-zinc-400 text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                            {selectedAppeal.supportingInfo}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-zinc-600">
                    <ShieldAlert className="w-12 h-12 mb-4 text-zinc-700 animate-pulse" />
                    <h4 className="text-sm font-black uppercase tracking-wider">No Appeal Selected</h4>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1.5 font-bold leading-normal">
                      Select an appeal from the sidebar to review creator details, reason, supporting info, and accept/reject decisions.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}
        </>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-500" />
                Prompt Removal Appeals
              </h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                Review and resolve user appeals against moderated or removed prompt templates
              </p>
            </div>
            
            {updating && (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                Processing appeal...
              </div>
            )}
          </div>

          {/* Main Appeals Panel */}
          {promptAppealsLoading && promptAppeals.length === 0 ? (
            <div className="min-h-[50vh] flex items-center justify-center text-zinc-400">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <span className="text-xs font-black uppercase tracking-widest">Loading Appeals Inbox...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#121215]/60 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl p-6 min-h-[70vh]">
              
              {/* Left Column: Appeals List (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-4 border-b lg:border-b-0 lg:border-r border-zinc-800/80 pb-6 lg:pb-0 lg:pr-6">
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by username, title, reason..."
                    value={promptAppealSearchQuery}
                    onChange={(e) => setPromptAppealSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-2xl text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
                  />
                </div>

                {/* Appeals List */}
                <div className="flex-1 overflow-y-auto max-h-[55vh] pr-2 space-y-2 no-scrollbar">
                  {promptAppeals.filter(app => {
                    const query = promptAppealSearchQuery.toLowerCase();
                    return app.username.toLowerCase().includes(query) ||
                           app.promptTitle.toLowerCase().includes(query) ||
                           app.reason.toLowerCase().includes(query);
                  }).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600">
                      <ShieldAlert className="w-10 h-10 mb-3 text-zinc-700" />
                      <p className="text-xs font-black uppercase tracking-wider">No Appeals Found</p>
                      <p className="text-[10px] font-bold text-zinc-500 mt-1">There are no prompt appeals matching this filter.</p>
                    </div>
                  ) : (
                    promptAppeals.filter(app => {
                      const query = promptAppealSearchQuery.toLowerCase();
                      return app.username.toLowerCase().includes(query) ||
                             app.promptTitle.toLowerCase().includes(query) ||
                             app.reason.toLowerCase().includes(query);
                    }).map((app) => {
                      const isSelected = selectedPromptAppeal?.id === app.id;
                      const isPending = app.status === 'pending';
                      return (
                        <button
                          key={app.id}
                          onClick={() => setSelectedPromptAppeal(app)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col justify-between relative group cursor-pointer ${
                            isSelected 
                              ? 'bg-red-950/15 border-red-500/50 shadow-[0_4px_20px_rgba(239,68,68,0.15)] text-white' 
                              : isPending
                                ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850/40 text-zinc-200' 
                                : 'bg-zinc-950/20 border-zinc-900 hover:bg-zinc-850/20 text-zinc-400'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full pr-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] truncate font-black tracking-wide text-zinc-250">
                                {app.promptTitle}
                              </span>
                              <span className="text-[9px] text-zinc-550 font-bold mt-0.5">
                                By: @{app.username}
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 border rounded-md text-[7px] font-black uppercase tracking-widest shrink-0 ${
                              app.status === 'pending'
                                ? 'text-yellow-500 bg-yellow-950/20 border-yellow-900/20 animate-pulse'
                                : app.status === 'approved'
                                  ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/20'
                                  : 'text-red-400 bg-red-950/20 border-red-900/20'
                            }`}>
                              {app.status}
                            </span>
                          </div>

                          <p className="text-[10px] line-clamp-2 mt-2 leading-relaxed text-zinc-400 font-semibold">
                            {app.reason}
                          </p>

                          <div className="flex items-center gap-1.5 mt-3.5 text-[9px] font-black uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Detailed Appeal Reader View (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between min-h-[50vh]">
                {selectedPromptAppeal ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    
                    {/* Header Info */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                        
                        <div className="flex items-center gap-3">
                          {selectedPromptAppeal.promptImageUrl ? (
                            <img 
                              src={selectedPromptAppeal.promptImageUrl} 
                              alt="" 
                              className="w-10 h-10 object-cover rounded-xl border border-zinc-800 shrink-0 bg-zinc-900"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-400 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-xs font-black text-white truncate">{selectedPromptAppeal.promptTitle}</h3>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-zinc-600" />
                              By: @{selectedPromptAppeal.username} • {new Date(selectedPromptAppeal.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-zinc-400 block">{selectedPromptAppeal.email}</span>
                          <span className={`inline-block mt-1 px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-widest ${
                            selectedPromptAppeal.status === 'pending' 
                              ? 'text-yellow-500 bg-yellow-950/20 border-yellow-900/20' 
                              : selectedPromptAppeal.status === 'approved'
                                ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/20'
                                : 'text-red-400 bg-red-950/20 border-red-900/20'
                          }`}>
                            {selectedPromptAppeal.status}
                          </span>
                        </div>

                      </div>

                      {/* Actions Bar (Only for pending appeals) */}
                      {selectedPromptAppeal.status === 'pending' && (
                        <div className="flex items-center gap-3 bg-zinc-950/40 p-2.5 rounded-2xl border border-zinc-900">
                          <button
                            onClick={() => handleResolvePromptAppeal(selectedPromptAppeal.id, 'approve')}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all shadow-md shadow-emerald-950/20 cursor-pointer font-bold animate-fade-in"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve Appeal
                          </button>

                          <button
                            onClick={() => handleResolvePromptAppeal(selectedPromptAppeal.id, 'reject')}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-red-400 transition-colors cursor-pointer font-bold animate-fade-in"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject Appeal
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Appeal details */}
                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[40vh] pr-2 my-4">
                      <div className="bg-zinc-950/20 border border-zinc-900/50 p-6 sm:p-8 rounded-[2rem] shadow-inner">
                        <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-2">Appeal Reason</span>
                        <p className="text-zinc-200 text-xs font-semibold leading-relaxed whitespace-pre-wrap text-zinc-300">
                          {selectedPromptAppeal.reason}
                        </p>
                      </div>

                      <div className="bg-zinc-950/25 border border-zinc-900/30 p-6 sm:p-8 rounded-[2rem] shadow-inner text-zinc-400">
                        <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-2">Moderated Content Context</span>
                        <p className="text-xs font-bold text-zinc-300">Prompt ID: <span className="font-mono text-[10px] text-zinc-500 select-text">{selectedPromptAppeal.promptId}</span></p>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-zinc-600">
                    <FileText className="w-12 h-12 mb-4 text-zinc-700 animate-pulse" />
                    <h4 className="text-sm font-black uppercase tracking-wider">No Appeal Selected</h4>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1.5 font-bold leading-normal">
                      Select an appeal from the sidebar to review prompt details, creator appeal reason, and issue resolution action.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}
