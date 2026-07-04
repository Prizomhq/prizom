'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ShieldCheck, 
  UserMinus, 
  UserCheck, 
  Award,
  Sparkles,
  X,
  Calendar,
  Bookmark,
  Heart,
  Copy,
  Zap,
  Activity,
  HelpCircle,
  Eye
} from 'lucide-react';
import { 
  getAdminUsersList, 
  toggleUserBan, 
  toggleUserVerification, 
  getCreatorVerificationDetails 
} from '@/app/actions/adminActions';
import { calculateVerificationEligibility } from '@/lib/verification';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inspection side-drawer states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewDetails, setReviewDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Suspension modal states
  const [banReason, setBanReason] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banType, setBanType] = useState<'suspended' | 'permanently_banned'>('suspended');

  const loadUsers = (query: string = '') => {
    setLoading(true);
    getAdminUsersList(query).then(res => {
      if (res.success && res.users) {
        setUsers(res.users);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  // Fetch detailed verification criteria asynchronously when a creator is selected
  useEffect(() => {
    if (selectedUser && isReviewOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetailsLoading(true);
      getCreatorVerificationDetails(selectedUser.id).then(res => {
        if (res.success && res.stats) {
          setReviewDetails(res.stats);
        } else {
          alert(res.error || 'Failed to fetch creator statistics.');
          setIsReviewOpen(false);
        }
        setDetailsLoading(false);
      });
    } else {
      setReviewDetails(null);
    }
  }, [selectedUser, isReviewOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(searchQuery);
  };

  const handleToggleBan = async (userToBan?: any) => {
    const targetUser = userToBan || selectedUser;
    if (!targetUser) return;

    const isSuspendedOrBanned = targetUser.isBanned || targetUser.isSuspended || targetUser.role === 'suspended' || targetUser.role === 'permanently_banned';

    setSubmitting(true);
    const res = await toggleUserBan(
      targetUser.id, 
      isSuspendedOrBanned ? '' : banReason, 
      isSuspendedOrBanned ? 'active' : banType
    );
    setSubmitting(false);

    if (res.success) {
      setShowBanModal(false);
      setBanReason('');
      
      loadUsers(searchQuery);
    } else {
      alert(res.error || 'Failed to toggle account ban status.');
    }
    setSubmitting(false);
  };

  const handleToggleVerify = async (userId: string) => {
    setSubmitting(true);
    const res = await toggleUserVerification(userId);
    if (res.success) {
      // Update local review state if drawer is open
      if (isReviewOpen && reviewDetails && reviewDetails.id === userId) {
        const detailsRes = await getCreatorVerificationDetails(userId);
        if (detailsRes.success) {
          setReviewDetails(detailsRes.stats);
        }
      }
      loadUsers(searchQuery);
    } else {
      alert(res.error || 'Failed to toggle verified status.');
    }
    setSubmitting(false);
  };

  const reviewStats = reviewDetails ? calculateVerificationEligibility(reviewDetails) : null;

  return (
    <div className="space-y-10 animate-in fade-in duration-300 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            Creators Catalog
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Manage user profiles, safety bans, and creator verifications</p>
        </div>
      </div>

      {/* Search Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-4 max-w-xl">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-zinc-600" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white placeholder-zinc-600 focus:outline-none focus:bg-[#0c0c0e] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs font-bold shadow-inner"
            placeholder="Search creator by username..."
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
        >
          Filter
        </button>
      </form>

      {/* Users List Table */}
      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs font-black uppercase tracking-widest">Loading Catalog...</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#121215]/60 border border-zinc-800 p-16 rounded-[2.5rem] text-center max-w-2xl mx-auto">
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-black text-zinc-300 uppercase">No Creators Found</h3>
          <p className="text-zinc-500 text-xs font-semibold mt-1">Try adjusting your filters or query strings.</p>
        </div>
      ) : (
        <div className="bg-[#121215]/60 border border-zinc-800 rounded-[2.5rem] shadow-xl overflow-hidden">
          <div className="overflow-x-auto animate-in fade-in duration-200">
            <table className="w-full text-xs text-left text-zinc-400 font-semibold border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 text-[10px] font-black uppercase text-zinc-500 tracking-wider bg-zinc-950/20">
                  <th className="px-6 py-4.5">Creator Info</th>
                  <th className="px-6 py-4.5">Platform Clearance</th>
                  <th className="px-6 py-4.5">Social Metrics</th>
                  <th className="px-6 py-4.5">Safety Record</th>
                  <th className="px-6 py-4.5 text-right">Moderator Control Panel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {users.map((user) => (
                  <tr key={user.id} className={`hover:bg-zinc-850/5 transition-colors ${user.isBanned || user.isSuspended ? 'bg-red-950/5' : ''}`}>
                    
                    {/* User Avatar + Username */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={user.username}
                            className="w-10 h-10 object-cover rounded-xl bg-zinc-800 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black uppercase text-zinc-400 shrink-0">
                            {user.username?.[0] || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-zinc-200">{user.username}</span>
                            {user.badges?.includes('verified') && (
                              <span className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Verified Creator Badge">
                                <Award className="w-3.5 h-3.5 stroke-[2.5]" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-550 font-bold block">{user.fullName || 'No display name'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Platform Role */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 border rounded-md text-[9px] font-black uppercase tracking-wider ${
                        user.isBanned 
                          ? 'text-red-400 bg-red-950/20 border-red-900/20' 
                          : user.isSuspended
                            ? 'text-yellow-500 bg-yellow-950/20 border-yellow-900/20 animate-pulse'
                            : user.role === 'super_admin' 
                              ? 'text-pink-400 bg-pink-950/20 border-pink-900/20' 
                              : user.role === 'admin'
                                ? 'text-indigo-400 bg-indigo-950/20 border-indigo-900/20'
                                : 'text-zinc-550 bg-zinc-900/50 border-zinc-800'
                      }`}>
                        {user.isBanned 
                          ? 'BANNED' 
                          : user.isSuspended
                            ? 'SUSPENDED'
                            : user.role === 'super_admin' 
                              ? 'Super Admin' 
                              : user.role === 'admin'
                                ? 'Admin'
                                : user.role === 'moderator'
                                  ? 'Moderator'
                                  : 'Creator'}
                      </span>
                    </td>

                    {/* Social Metrics */}
                    <td className="px-6 py-4 text-zinc-550">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-zinc-300 font-mono text-xs">{user.followerCount} <span className="text-[9px] text-zinc-550 uppercase tracking-widest font-black">followers</span></span>
                        <span className="text-[10px] font-bold">{user.followingCount} following</span>
                      </div>
                    </td>

                    {/* Reports count */}
                    <td className="px-6 py-4">
                      {user.reportCount > 0 ? (
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-black">{user.reportCount} Flagged Reports</span>
                        </div>
                      ) : (
                        <span className="text-zinc-650 font-bold">Clean Record</span>
                      )}
                    </td>

                    {/* Actions Panel */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Dynamic Inspection Review system */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsReviewOpen(true);
                          }}
                          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border border-indigo-500/30 text-xs font-black uppercase tracking-wider transition-all shadow-md"
                          title="Review Creator Eligibility & Stats"
                        >
                          <Sparkles className="w-4 h-4 shrink-0" />
                        </button>

                        {/* Ban/Unban Trigger */}
                        {user.role !== 'super_admin' ? (
                          <button
                            onClick={() => {
                              const isSuspendedOrBanned = user.isBanned || user.isSuspended;
                              if (isSuspendedOrBanned) {
                                handleToggleBan(user);
                              } else {
                                setSelectedUser(user);
                                setShowBanModal(true);
                              }
                            }}
                            className={`
                              p-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer
                              ${(user.isBanned || user.isSuspended)
                                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/50'
                                : 'bg-red-950/30 text-red-400 border-red-900/40 hover:bg-red-950/50'}
                            `}
                            title={(user.isBanned || user.isSuspended) ? 'Reinstate Account' : 'Suspend Creator'}
                          >
                            {(user.isBanned || user.isSuspended) ? <UserCheck className="w-4.5 h-4.5" /> : <UserMinus className="w-4.5 h-4.5" />}
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-650 font-bold uppercase tracking-widest select-none">Protected Node</span>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creator Profile & Verification Eligibility Review Side-Drawer */}
      {isReviewOpen && selectedUser && (
        <>
          {/* Overlay Background */}
          <div 
            onClick={() => setIsReviewOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm pointer-events-auto transition-all animate-fade-in"
          />

          {/* Sliding Side-Drawer Panel */}
          <aside className="fixed top-0 right-0 h-full w-full sm:w-[520px] md:w-[600px] bg-[#0e0e11]/95 border-l border-zinc-800/80 shadow-2xl p-8 z-50 flex flex-col justify-between overflow-y-auto no-scrollbar pointer-events-auto transition-transform duration-300 transform animate-slide-in-right">
            
            <div>
              {/* Drawer Close Button & Title */}
              <div className="flex items-center justify-between border-b border-zinc-850 pb-5 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                  <h2 className="text-sm font-black uppercase text-white tracking-widest">Creator Studio Inspector</h2>
                </div>
                <button 
                  onClick={() => setIsReviewOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-850 text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {detailsLoading || !reviewDetails ? (
                <div className="py-24 flex flex-col items-center justify-center text-zinc-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-550">Retrieving Creator Telemetry...</span>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-200">
                  
                  {/* Creator Inspector Header */}
                  <div className="p-5 rounded-3xl bg-zinc-950/40 border border-zinc-850/60 flex items-center gap-4.5">
                    {reviewDetails.avatarUrl ? (
                      <img 
                        src={reviewDetails.avatarUrl} 
                        alt={reviewDetails.username}
                        className="w-14 h-14 object-cover rounded-2xl border border-zinc-800"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-zinc-850 flex items-center justify-center text-lg font-black uppercase text-zinc-400 border border-zinc-800">
                        {reviewDetails.username?.[0] || 'U'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-lg font-black text-white">{reviewDetails.username}</span>
                        {reviewDetails.isVerified ? (
                          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase">
                            Standard User
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 text-xs font-bold uppercase mt-0.5 truncate">{reviewDetails.fullName || 'No display name'}</p>
                      
                      {/* Bio preview */}
                      {reviewDetails.bio && (
                        <p className="text-[10px] text-zinc-400 font-semibold mt-2.5 italic line-clamp-2">
                          &quot;{reviewDetails.bio}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Core Platform Metrics Grid */}
                  <div>
                    <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Creator Platform Metrics</span>
                    <div className="grid grid-cols-3 gap-3.5 mt-3">
                      
                      <div className="p-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Followers</span>
                        <span className="text-lg font-black text-white font-mono mt-1 block">{reviewDetails.followerCount}</span>
                        <span className="text-[8px] font-bold text-zinc-650 block mt-0.5">{reviewDetails.followingCount} following</span>
                      </div>

                      <div className="p-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Published Prompts</span>
                        <span className="text-lg font-black text-white font-mono mt-1 block">{reviewDetails.totalPrompts}</span>
                        <span className="text-[8px] font-bold text-zinc-650 block mt-0.5">Community recipes</span>
                      </div>

                      <div className="p-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Prompt Copies</span>
                        <span className="text-lg font-black text-white font-mono mt-1 block">{reviewDetails.totalCopies.toLocaleString()}</span>
                        <span className="text-[8px] font-bold text-zinc-650 block mt-0.5">Prompt actions</span>
                      </div>

                      <div className="p-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Collection Saves</span>
                        <span className="text-lg font-black text-white font-mono mt-1 block">{reviewDetails.totalSaves.toLocaleString()}</span>
                        <span className="text-[8px] font-bold text-zinc-650 block mt-0.5">Saves index</span>
                      </div>

                      <div className="p-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Total Likes</span>
                        <span className="text-lg font-black text-white font-mono mt-1 block">{reviewDetails.totalLikes.toLocaleString()}</span>
                        <span className="text-[8px] font-bold text-zinc-650 block mt-0.5">Appreciation ticks</span>
                      </div>

                      <div className="p-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Prompt Remixes</span>
                        <span className="text-lg font-black text-white font-mono mt-1 block">{reviewDetails.totalRemixes}</span>
                        <span className="text-[8px] font-bold text-zinc-650 block mt-0.5">Prompt remixes</span>
                      </div>

                    </div>
                  </div>

                  {/* Verification Progress Circular Indicator */}
                  <div>
                    <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Verification Eligibility & Score</span>
                    <div className="p-5.5 bg-zinc-950/30 border border-zinc-850 rounded-[2rem] mt-3 flex items-center justify-between gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full"></div>
                      
                      <div className="flex-1 space-y-2">
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Verification Progress</span>
                        <h4 className="text-3xl font-black text-white tracking-tight">{reviewStats?.progressPercent}%</h4>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          {reviewStats?.completedCount} of 6 checklist requirements satisfied
                        </p>
                        
                        {/* Linear Progress bar */}
                        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden mt-3">
                          <div 
                            style={{ width: `${reviewStats?.progressPercent}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              reviewStats?.isEligible 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                                : 'bg-gradient-to-r from-indigo-500 to-cyan-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Custom Circular SVG Indicator */}
                      <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          {/* Track */}
                          <circle cx="40" cy="40" r="32" stroke="#1f1f2e" strokeWidth="6" fill="transparent" />
                          {/* Progress Arc */}
                          <circle 
                            cx="40" 
                            cy="40" 
                            r="32" 
                            stroke={reviewStats?.isEligible ? '#10b981' : '#6366f1'} 
                            strokeWidth="6" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 32}
                            strokeDashoffset={2 * Math.PI * 32 * (1 - (reviewStats?.progressPercent || 0) / 100)}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <span className="absolute text-xs font-black text-white">{reviewStats?.progressPercent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Checklist */}
                  <div>
                    <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Requirement Checklist Details</span>
                    <div className="mt-3 bg-[#121215]/50 border border-zinc-850 rounded-[2rem] overflow-hidden divide-y divide-zinc-900">
                      {reviewStats?.criteria.map((c) => (
                        <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-extrabold text-xs text-zinc-200">{c.name}</p>
                            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block mt-0.5">
                              {c.label}
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {c.status === 'completed' && (
                              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                                Completed
                              </span>
                            )}
                            {c.status === 'near' && (
                              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                                Near Target
                              </span>
                            )}
                            {c.status === 'not' && (
                              <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                                Unmet
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Creator Decision Area */}
                  <div>
                    <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Moderation Decision Desk</span>
                    <div className={`p-6 rounded-[2rem] border mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md relative overflow-hidden ${
                      reviewStats?.isEligible
                        ? 'bg-emerald-950/20 border-emerald-900/35 shadow-emerald-500/[0.02]'
                        : 'bg-zinc-950/50 border-zinc-850 shadow-inner'
                    }`}>
                      <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-500/5 blur-2xl rounded-full"></div>
                      
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <span className="text-[8px] font-black uppercase text-zinc-550 tracking-widest">Eligibility Assessment</span>
                        <h4 className={`text-xl font-black uppercase tracking-wide flex items-center gap-1.5 ${
                          reviewStats?.isEligible ? 'text-emerald-400' : 'text-zinc-400'
                        }`}>
                          {reviewStats?.isEligible ? (
                            <>
                              <CheckCircle className="w-5 h-5 shrink-0" />
                              Eligible for Verification
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-5 h-5 shrink-0 text-zinc-500" />
                              Not Yet Eligible
                            </>
                          )}
                        </h4>
                        
                        {/* Missing Requirements List */}
                        {!reviewStats?.isEligible && (
                          <div className="text-[9px] font-semibold text-zinc-500 uppercase mt-2.5 space-y-1 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                            <span className="font-black text-[8px] text-zinc-400 block mb-1">Missing Requirements Checklist:</span>
                            {reviewStats?.criteria.filter(c => !c.unlocked).map(c => {
                              const diff = c.target - c.current;
                              let desc = '';
                              if (c.id === 'prompts') desc = `Needs ${diff} more published prompt${diff > 1 ? 's' : ''}`;
                              else if (c.id === 'copies') desc = `Needs ${diff.toLocaleString()} more prompt copies`;
                              else if (c.id === 'profile') desc = `Profile must be complete (Bio, Avatar, Name)`;
                              else if (c.id === 'age') desc = `Needs ${diff} more day${diff > 1 ? 's' : ''} active`;
                              else if (c.id === 'standing') desc = `Clean active report record and no suspension required`;
                              return (
                                <div key={c.id} className="flex items-center gap-1 text-red-400 font-bold">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                                  {desc}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Verify Button Decision */}
                      <div className="shrink-0 self-start sm:self-center">
                        {reviewDetails.isVerified ? (
                          <button
                            onClick={() => handleToggleVerify(reviewDetails.id)}
                            disabled={submitting}
                            className="px-6 py-3.5 bg-zinc-900 hover:bg-red-950/20 border border-zinc-800 hover:border-red-900/30 text-zinc-400 hover:text-red-400 text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center gap-2"
                          >
                            <UserMinus className="w-4.5 h-4.5" />
                            Revoke Status
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleVerify(reviewDetails.id)}
                            disabled={submitting}
                            className={`px-6 py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center gap-2 ${
                              reviewStats?.isEligible
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-emerald-950/20'
                                : 'bg-zinc-900 text-zinc-550 border border-zinc-800 hover:text-zinc-300'
                            }`}
                          >
                            <ShieldCheck className="w-4.5 h-4.5" />
                            Verify Creator
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connected Creator Analytics Access Check */}
                  <div>
                    <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Analytics Studio Access Status</span>
                    <div className="mt-3 p-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl flex items-center justify-between text-xs font-bold text-zinc-400">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase text-zinc-550 tracking-wider">Verified Creator</span>
                        <p className={`text-sm font-black ${reviewDetails.isVerified ? 'text-emerald-400' : 'text-red-500'}`}>
                          {reviewDetails.isVerified ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              ✓ Verified
                              <span className="text-[10px] text-zinc-500 font-normal">
                                {reviewDetails.verificationSource === 'manual' ? ' • Manual Verification' : ' • Automatic Verification'}
                              </span>
                            </span>
                          ) : 'NO'}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <span className="text-[8px] font-black uppercase text-zinc-550 tracking-wider">Analytics Access Link</span>
                        <p className={`text-sm font-black ${reviewDetails.isVerified ? 'text-emerald-400' : 'text-red-500'}`}>
                          {reviewDetails.isVerified ? 'ACCESS GRANTED' : 'ACCESS BLOCKED'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inspector Moderation Actions */}
                  <div className="pt-6 border-t border-zinc-850">
                    <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider block mb-3">Moderator Fast Audit Actions</span>
                    <div className="flex gap-4">
                      {reviewDetails.role !== 'super_admin' ? (
                        <button
                          onClick={() => {
                            if (reviewDetails.isSuspended) {
                              handleToggleBan(reviewDetails);
                            } else {
                              setShowBanModal(true);
                            }
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-3.5 border rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                            reviewDetails.isSuspended
                              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/50'
                              : 'bg-red-950/30 text-red-400 border-red-900/40 hover:bg-red-950/50'
                          }`}
                        >
                          {reviewDetails.isSuspended ? (
                            <>
                              <UserCheck className="w-4.5 h-4.5" />
                              Unsuspend Account
                            </>
                          ) : (
                            <>
                              <UserMinus className="w-4.5 h-4.5" />
                              Suspend Account
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex-1 text-center py-3.5 bg-zinc-950 border border-zinc-900 text-zinc-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                          Protected Administrative Account
                        </div>
                      )}
                      
                      <Link 
                        href={`/creator/${reviewDetails.username}`}
                        target="_blank"
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-300 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                      >
                        <Eye className="w-4.5 h-4.5" />
                        Inspect Portfolio
                      </Link>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Side-Drawer Footer */}
            <div className="pt-6 border-t border-zinc-850 text-center text-[9px] font-black uppercase tracking-wider text-zinc-600">
              Creator Inspector Node • Sync Synchronous
            </div>

          </aside>
        </>
      )}

      {/* Ban Safety Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-md bg-[#121215] border border-zinc-800 rounded-[2rem] p-8 shadow-2xl animate-scale-up z-60">
            <div className="flex items-center gap-3.5 mb-6 text-red-400">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-white tracking-wide">Suspend Creator Account</h3>
                <p className="text-[10px] text-red-400 font-bold uppercase">Confirm Action on @{selectedUser.username}</p>
              </div>
            </div>

            <p className="text-zinc-500 font-semibold text-xs leading-relaxed mb-6">
              Suspended users are immediately logged out, restricted from publishing new prompts or remixes, and locked from accessing their portfolios.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Action Type</label>
                <div className="flex bg-zinc-950/50 p-1 rounded-xl border border-zinc-800/50 mb-4">
                  <button
                    type="button"
                    onClick={() => setBanType('suspended')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      banType === 'suspended'
                        ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    15-Day Suspension
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanType('permanently_banned')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      banType === 'permanently_banned'
                        ? 'bg-red-950 text-red-400 shadow-sm border border-red-900/40'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Permanent Ban
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">Audit Action Reason</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  required
                  rows={3}
                  className="block w-full px-4 py-3 border border-zinc-800 rounded-2xl bg-zinc-950/30 text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all text-xs font-bold shadow-inner"
                  placeholder="Explain guidelines violation (will be visible to the user)..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setBanReason('');
                  }}
                  className="flex-1 px-6 py-3.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleToggleBan()}
                  disabled={submitting || !banReason.trim()}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/20 hover:shadow-red-950/40 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? 'Enforcing...' : 'Confirm Ban'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
