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
    if (!message.trim()) return;
    if (recipient === 'single' && !targetUserId) {
      alert('Please select a target recipient user.');
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
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(res.error || 'Failed to dispatch notifications.');
      }
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred.');
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-black uppercase tracking-widest">Loading Broadcast Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-500" />
            Announcement Broadcasting
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
            Dispatch platform alerts, milestones, and direct messages straight to creator feeds
          </p>
        </div>
        {success && (
          <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider animate-bounce">
            <CheckCircle2 className="w-4.5 h-4.5" />
            Alert Broadcast Complete
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Broadcast Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl space-y-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Volume2 className="w-4.5 h-4.5 text-indigo-500" />
            Create Alert Announcement
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-6">
            
            {/* Recipient scope selection */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">Recipient Target</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRecipient('all')}
                  className={`py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    recipient === 'all'
                      ? 'bg-indigo-650/10 border-indigo-500/50 text-white shadow-md'
                      : 'bg-zinc-950/20 border-zinc-900 text-zinc-450 hover:bg-zinc-850/10'
                  }`}
                >
                  <Users className="w-4.5 h-4.5" />
                  All Creators (Global)
                </button>
                
                <button
                  type="button"
                  onClick={() => setRecipient('single')}
                  className={`py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    recipient === 'single'
                      ? 'bg-indigo-650/10 border-indigo-500/50 text-white shadow-md'
                      : 'bg-zinc-950/20 border-zinc-900 text-zinc-450 hover:bg-zinc-850/10'
                  }`}
                >
                  <User className="w-4.5 h-4.5" />
                  Single User Alert
                </button>
              </div>
            </div>

            {/* User Dropdown Selector (if recipient is single) */}
            {recipient === 'single' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">Target User</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
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
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">Notification Badge Style</label>
              <div className="flex bg-zinc-950 p-2 rounded-2xl border border-zinc-900 w-fit">
                <span className="flex items-center gap-2 px-4 py-2 bg-indigo-650/25 border border-indigo-500/40 text-indigo-400 text-xs font-black uppercase tracking-wider rounded-xl">
                  <Trophy className="w-4 h-4" />
                  Achievement / Milestone Alert
                </span>
              </div>
            </div>

            {/* Notification Message Textarea */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">Broadcast Alert text</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your official announcement details here (e.g. 'Prizom v2.0 is live! Explore new branching prompt mechanics.')"
                rows={4}
                className="block w-full px-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
                required
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={broadcasting || !message.trim()}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-650 to-[var(--color-neon-purple)] hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 transition-all flex items-center justify-center gap-2"
            >
              {broadcasting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
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
        <div className="lg:col-span-5 bg-[#121215]/60 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl space-y-6 flex flex-col">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Broadcast History</h3>
            <p className="text-[10px] text-zinc-550 font-bold uppercase mt-1">Audit log of recently transmitted announcements</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 space-y-3 no-scrollbar">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center text-zinc-650">
                <ShieldAlert className="w-10 h-10 mb-3 text-zinc-700" />
                <p className="text-xs font-black uppercase tracking-wider">No Broadcasts Registered</p>
                <p className="text-[10px] font-bold text-zinc-500 mt-1">No global alerts have been sent in this session.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-4 rounded-2xl bg-zinc-950/30 border border-zinc-900/60 flex flex-col space-y-2"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-zinc-550 truncate max-w-[120px]">{log.adminEmail}</span>
                    <span className={`inline-flex px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${
                      log.action === 'broadcast_notification_all'
                        ? 'text-purple-400 bg-purple-950/20 border-purple-900/20'
                        : 'text-indigo-400 bg-indigo-950/20 border-indigo-900/20'
                    }`}>
                      {log.action === 'broadcast_notification_all' ? 'global' : 'direct'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-zinc-300 leading-normal">
                    {log.reason}
                  </p>

                  <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-zinc-600">
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
