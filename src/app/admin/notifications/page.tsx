'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Trophy, 
  Users, 
  User, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert,
  Clock,
  Volume2
} from 'lucide-react';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import { 
  broadcastAdminNotificationAction,
  getAdminUsersList,
  getAuditLogs
} from '@/app/actions/adminActions';

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Broadcast Form State
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState<'all' | 'single'>('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [notificationType, setNotificationType] = useState<'achievement'>('achievement');

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        getAdminUsersList(''),
        getAuditLogs()
      ]);
      if (usersRes.success && usersRes.users) {
        setUsers(usersRes.users);
      }
      if (logsRes.success && logsRes.logs) {
        // Filter for broadcast-related logs
        const broadcastLogs = logsRes.logs.filter(
          log => log.action === 'broadcast_notification' || log.action === 'broadcast_notification_all'
        );
        setLogs(broadcastLogs);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!message.trim()) return;
    if (recipient === 'single' && !targetUserId) {
      setErrorMsg('Please select a target recipient user.');
      return;
    }

    setBroadcasting(true);
    setSuccess(false);

    try {
      const res = await broadcastAdminNotificationAction(
        notificationType,
        message,
        recipient === 'all' ? 'all' : targetUserId
      );

      if (res.success) {
        setSuccess(true);
        setMessage('');
        setTargetUserId('');
        // Re-load audit logs to show the new broadcast entry
        await loadData();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to dispatch notifications.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Loading Announcement System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Admin Design System Page Header */}
      <AdminPageHeader
        title="Announcement Broadcasting"
        description="Dispatch platform alerts, milestones, and direct messages straight to creator feeds."
        icon={Bell}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Broadcasting' }
        ]}
      >
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Alert Broadcast Complete
          </div>
        )}
      </AdminPageHeader>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Broadcast Form (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200/80 p-6 sm:p-8 rounded-2xl shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Volume2 className="w-4.5 h-4.5 text-indigo-600" />
            Create Alert Announcement
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-6">
            
            {/* Recipient scope selection */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Recipient Target</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRecipient('all')}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    recipient === 'all'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs font-bold'
                      : 'bg-zinc-50/80 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  All Creators (Global)
                </button>
                
                <button
                  type="button"
                  onClick={() => setRecipient('single')}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    recipient === 'single'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs font-bold'
                      : 'bg-zinc-50/80 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Single User Alert
                </button>
              </div>
            </div>

            {/* User Dropdown Selector (if recipient is single) */}
            {recipient === 'single' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Target User</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="block w-full px-4 py-3 border border-zinc-200 rounded-xl bg-white text-zinc-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                >
                  <option value="">-- Choose User Profile --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.fullName || 'No display name'}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notification Type */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Notification Badge Style</label>
              <div className="flex bg-zinc-50 p-1.5 rounded-xl border border-zinc-200 w-fit">
                <span className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider rounded-lg">
                  <Trophy className="w-4 h-4 text-indigo-600" />
                  Achievement / Milestone Alert
                </span>
              </div>
            </div>

            {/* Notification Message Textarea */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Broadcast Alert Text</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your official announcement details here (e.g. 'Prizom v2.0 is live! Explore new branching prompt mechanics.')"
                rows={4}
                className="block w-full px-4 py-3 border border-zinc-200 rounded-xl bg-white text-zinc-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                required
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={broadcasting || !message.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {broadcasting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Broadcasting Alert...
                </>
              ) : (
                <>
                  Broadcast Announcement
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        </div>

        {/* Right Column: Dispatch History (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-zinc-200/80 p-6 sm:p-8 rounded-2xl shadow-xs space-y-6 flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Broadcast History</h3>
            <p className="text-xs text-zinc-500 font-normal mt-0.5">Audit log of recently transmitted announcements</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-3">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                <ShieldAlert className="w-10 h-10 mb-3 text-zinc-300" />
                <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">No Broadcasts Registered</p>
                <p className="text-xs font-normal text-zinc-500 mt-1">No global alerts have been sent in this session.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80 flex flex-col space-y-2"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-zinc-500 truncate max-w-[140px]">{log.adminEmail}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${
                      log.action === 'broadcast_notification_all'
                        ? 'text-purple-700 bg-purple-50 border-purple-200'
                        : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                    }`}>
                      {log.action === 'broadcast_notification_all' ? 'global' : 'direct'}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-zinc-800 leading-normal">
                    {log.reason}
                  </p>

                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

