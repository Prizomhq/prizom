'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  Trash2, 
  RefreshCw, 
  Download, 
  Calendar, 
  Clock, 
  UserCheck, 
  UserX, 
  Info,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { 
  getLifecycleUsersAction, 
  adminCancelDeletionAction, 
  adminForceDeletionAction 
} from '@/app/actions/adminActions';

export default function AdminLifecyclePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'deactivated' | 'pending_deletion'>('pending_deletion');
  
  // Confirmation states
  const [confirmingCancelUser, setConfirmingCancelUser] = useState<any>(null);
  const [confirmingForceUser, setConfirmingForceUser] = useState<any>(null);
  const [typedConfirmUsername, setTypedConfirmUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    getLifecycleUsersAction().then(res => {
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        console.error('Failed to load lifecycle users:', res.error);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const handleCancelDeletion = async () => {
    if (!confirmingCancelUser) return;
    setSubmitting(true);
    const res = await adminCancelDeletionAction(confirmingCancelUser.id);
    setSubmitting(false);
    if (res.success) {
      setConfirmingCancelUser(null);
      loadUsers();
    } else {
      alert(res.error || 'Failed to cancel account deletion.');
    }
  };

  const handleForceDeletion = async () => {
    if (!confirmingForceUser) return;
    if (typedConfirmUsername.trim().toLowerCase() !== confirmingForceUser.username.trim().toLowerCase()) {
      alert('Username confirmation does not match.');
      return;
    }
    setSubmitting(true);
    const res = await adminForceDeletionAction(confirmingForceUser.id);
    setSubmitting(false);
    if (res.success) {
      setConfirmingForceUser(null);
      setTypedConfirmUsername('');
      loadUsers();
    } else {
      alert(res.error || 'Failed to force delete account.');
    }
  };

  const exportLifecycleMetrics = () => {
    const deactivationReasons: Record<string, number> = {};
    const deletionReasons: Record<string, number> = {};
    let deactivatedCount = 0;
    let pendingDeletionCount = 0;

    users.forEach(u => {
      if (u.isDeactivated && !u.pendingDeletion) {
        deactivatedCount++;
        if (u.deactivationReason) {
          deactivationReasons[u.deactivationReason] = (deactivationReasons[u.deactivationReason] || 0) + 1;
        }
      }
      if (u.pendingDeletion) {
        pendingDeletionCount++;
        if (u.deletionReason) {
          deletionReasons[u.deletionReason] = (deletionReasons[u.deletionReason] || 0) + 1;
        }
      }
    });

    const data = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalTracked: users.length,
        deactivatedCount,
        pendingDeletionCount
      },
      analytics: {
        deactivationReasons,
        deletionReasons
      },
      deactivatedUsers: users
        .filter(u => u.isDeactivated && !u.pendingDeletion)
        .map(u => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          deactivatedAt: u.deactivatedAt,
          deactivationReason: u.deactivationReason,
          deactivationFeedback: u.deactivationFeedback
        })),
      pendingDeletionUsers: users
        .filter(u => u.pendingDeletion)
        .map(u => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          deletionRequestedAt: u.deletionRequestedAt,
          scheduledDeletionAt: u.scheduledDeletionAt,
          deletionReason: u.deletionReason
        }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prizom_lifecycle_metrics_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtering
  const filteredUsers = users.filter(user => {
    // 1. Tab filter
    if (activeTab === 'active') {
      if (user.isDeactivated || user.pendingDeletion) return false;
    } else if (activeTab === 'deactivated') {
      if (!user.isDeactivated || user.pendingDeletion) return false;
    } else if (activeTab === 'pending_deletion') {
      if (!user.pendingDeletion) return false;
    }

    // 2. Query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      return (
        user.username?.toLowerCase().includes(query) ||
        user.fullName?.toLowerCase().includes(query) ||
        user.id?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Aggregated Counts
  const counts = {
    active: users.filter(u => !u.isDeactivated && !u.pendingDeletion).length,
    deactivated: users.filter(u => u.isDeactivated && !u.pendingDeletion).length,
    pending_deletion: users.filter(u => u.pendingDeletion).length
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-indigo-500" />
            Account Lifecycle Management
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
            Audit deactivation requests, pending deletions, and execute permanent cascade purges
          </p>
        </div>
        <button
          onClick={exportLifecycleMetrics}
          className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all self-start sm:self-center shadow-lg"
        >
          <Download className="w-4 h-4" />
          Export JSON Metrics
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121215]/60 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-md">
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Active Accounts</p>
            <h3 className="text-3xl font-black text-white mt-1">{counts.active}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#121215]/60 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-md">
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Deactivated Accounts</p>
            <h3 className="text-3xl font-black text-white mt-1">{counts.deactivated}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#121215]/60 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-md">
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Pending Deletion</p>
            <h3 className="text-3xl font-black text-white mt-1">{counts.pending_deletion}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Trash2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Tabs */}
        <div className="flex bg-zinc-950 p-1.5 border border-zinc-800/80 rounded-2xl">
          <button
            onClick={() => setActiveTab('pending_deletion')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'pending_deletion'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pending Deletion ({counts.pending_deletion})
          </button>
          <button
            onClick={() => setActiveTab('deactivated')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'deactivated'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Deactivated ({counts.deactivated})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Active ({counts.active})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-650" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white placeholder-zinc-650 focus:outline-none focus:bg-[#0c0c0e] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs font-semibold shadow-inner"
            placeholder="Search by username, full name, or ID..."
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs font-black uppercase tracking-widest">Loading Records...</span>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-[#121215]/60 border border-zinc-800 p-16 rounded-[2rem] text-center max-w-lg mx-auto">
          <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider">No Records Found</h3>
          <p className="text-zinc-550 text-xs font-medium mt-1.5">
            There are no users matching this filter category or query filter.
          </p>
        </div>
      ) : (
        <div className="bg-[#121215]/60 border border-zinc-800 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-400 font-semibold border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 text-[10px] font-black uppercase text-zinc-500 tracking-wider bg-zinc-950/20">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status & Details</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Reason / Feedback</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-850/5 transition-colors">
                    
                    {/* User Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={user.username}
                            className="w-9 h-9 object-cover rounded-xl bg-zinc-800 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black uppercase text-zinc-400 shrink-0">
                            {user.username?.[0] || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-black text-zinc-200 block">{user.username}</span>
                          <span className="text-[10px] text-zinc-550 block truncate max-w-[150px]">{user.fullName || 'No name'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status details */}
                    <td className="px-6 py-4">
                      {user.pendingDeletion ? (
                        <div className="space-y-1">
                          <span className="inline-flex px-2 py-0.5 border rounded-md text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-950/20 border-red-900/20">
                            Pending Deletion
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            <span>15-day recovery sandbox</span>
                          </div>
                        </div>
                      ) : user.isDeactivated ? (
                        <div className="space-y-1">
                          <span className="inline-flex px-2 py-0.5 border rounded-md text-[9px] font-black uppercase tracking-wider text-yellow-500 bg-yellow-950/20 border-yellow-900/20">
                            Deactivated
                          </span>
                          <span className="text-[10px] text-zinc-500 block font-bold">Auto-reactivates on login</span>
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 border rounded-md text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border-emerald-900/20">
                          Active Account
                        </span>
                      )}
                    </td>

                    {/* Timeline */}
                    <td className="px-6 py-4 text-zinc-300">
                      {user.pendingDeletion ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span>Req: {new Date(user.deletionRequestedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-black">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>Purge: {new Date(user.scheduledDeletionAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ) : user.isDeactivated ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>Since: {user.deactivatedAt ? new Date(user.deactivatedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-550">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4">
                      {user.pendingDeletion ? (
                        <div className="max-w-[220px]">
                          <p className="text-[11px] text-zinc-350 font-bold truncate" title={user.deletionReason}>
                            Reason: {user.deletionReason || 'Not provided'}
                          </p>
                        </div>
                      ) : user.isDeactivated ? (
                        <div className="max-w-[220px] space-y-0.5">
                          <p className="text-[11px] text-zinc-350 font-bold truncate" title={user.deactivationReason}>
                            Reason: {user.deactivationReason || 'Not provided'}
                          </p>
                          {user.deactivationFeedback && (
                            <p className="text-[10px] text-zinc-500 italic truncate" title={user.deactivationFeedback}>
                              &ldquo;{user.deactivationFeedback}&rdquo;
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {user.pendingDeletion ? (
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => setConfirmingCancelUser(user)}
                            className="px-3.5 py-2 bg-indigo-950/40 hover:bg-indigo-900/30 text-indigo-400 hover:text-indigo-300 border border-indigo-900/40 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Cancel Deletion
                          </button>
                          <button
                            onClick={() => setConfirmingForceUser(user)}
                            className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/40 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Purge Now
                          </button>
                        </div>
                      ) : user.isDeactivated ? (
                        <button
                          onClick={() => setConfirmingForceUser(user)}
                          className="px-3.5 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-500/80 hover:text-red-400 border border-red-900/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Force Delete
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-650 font-bold">No lifecycle actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Deletion Modal */}
      {confirmingCancelUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-205">
          <div className="bg-[#121215] border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-8 relative overflow-hidden shadow-2xl">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
              Cancel Deletion
            </h3>
            <p className="text-zinc-400 text-xs font-semibold mt-4 leading-relaxed">
              Are you sure you want to cancel the deletion request for user <strong className="text-zinc-200">@{confirmingCancelUser.username}</strong>?
            </p>
            <p className="text-zinc-500 text-[10px] font-bold mt-2 leading-relaxed">
              This will restore their profile status to active and reactivate their prompts immediately.
            </p>
            
            <div className="mt-8 flex justify-end gap-3.5">
              <button
                disabled={submitting}
                onClick={() => setConfirmingCancelUser(null)}
                className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Close
              </button>
              <button
                disabled={submitting}
                onClick={handleCancelDeletion}
                className="px-5 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Permanent Cascade Delete Modal */}
      {confirmingForceUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-205">
          <div className="bg-[#121215] border border-red-950/40 rounded-[2.5rem] w-full max-w-lg p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-650 via-amber-500 to-red-650" />
            
            <h3 className="text-xl font-black text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 animate-bounce text-red-500" />
              CRITICAL: Permanent Cascade Purge
            </h3>
            
            <div className="mt-4 bg-red-950/20 border border-red-900/30 rounded-2xl p-4 flex gap-3 text-red-400 text-xs font-semibold leading-relaxed">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <div>
                This action runs a permanent physical deletion of <strong className="text-white">@{confirmingForceUser.username}</strong> and all related assets:
                <ul className="list-disc pl-4 mt-2 space-y-1 text-red-500/90 text-[10px] font-bold">
                  <li>Deletes all prompts & comments cascade</li>
                  <li>Purges all media images permanently from Cloudinary CDN</li>
                  <li>Deletes profile data, follows, saves, and likes</li>
                  <li>Permanently destroys the user credential object from Supabase Auth</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 space-y-3.5">
              <label className="text-zinc-400 text-[10px] font-black uppercase tracking-widest block">
                Type the username <strong className="text-white">@{confirmingForceUser.username}</strong> to authorize:
              </label>
              <input
                type="text"
                value={typedConfirmUsername}
                onChange={(e) => setTypedConfirmUsername(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 rounded-xl text-white text-xs font-bold focus:outline-none"
                placeholder={confirmingForceUser.username}
                disabled={submitting}
              />
            </div>

            <div className="mt-8 flex justify-end gap-3.5">
              <button
                disabled={submitting}
                onClick={() => {
                  setConfirmingForceUser(null);
                  setTypedConfirmUsername('');
                }}
                className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                disabled={submitting || typedConfirmUsername.trim().toLowerCase() !== confirmingForceUser.username.trim().toLowerCase()}
                onClick={handleForceDeletion}
                className="px-5 py-3 bg-red-650 hover:bg-red-600 disabled:opacity-40 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Purge Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
