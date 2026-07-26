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
  Calendar,
  Bookmark,
  Heart,
  Copy,
  Zap,
  Activity,
  HelpCircle,
  Eye,
  ExternalLink
} from 'lucide-react';
import { 
  getAdminUsersList, 
  toggleUserBan, 
  toggleUserVerification, 
  getCreatorVerificationDetails 
} from '@/app/actions/adminActions';
import { calculateVerificationEligibility } from '@/lib/verification';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminDataTable, { Column } from '@/components/admin/ui/AdminDataTable';
import AdminStatusBadge from '@/components/admin/ui/AdminStatusBadge';
import AdminSlideOver from '@/components/admin/ui/AdminSlideOver';
import AdminConfirmDialog from '@/components/admin/ui/AdminConfirmDialog';

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
  const [targetUserForBan, setTargetUserForBan] = useState<any>(null);

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
    loadUsers();
  }, []);

  // Fetch detailed verification criteria asynchronously when a creator is selected
  useEffect(() => {
    if (selectedUser && isReviewOpen) {
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

  const openBanModalForUser = (user: any) => {
    setTargetUserForBan(user);
    setBanReason('');
    setShowBanModal(true);
  };

  const handleToggleBan = async () => {
    const targetUser = targetUserForBan || selectedUser;
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
      setTargetUserForBan(null);
      loadUsers(searchQuery);
    } else {
      alert(res.error || 'Failed to toggle account ban status.');
    }
  };

  const handleToggleVerify = async (userId: string) => {
    setSubmitting(true);
    const res = await toggleUserVerification(userId);
    if (res.success) {
      if (isReviewOpen && reviewDetails && reviewDetails.id === userId) {
        const hasVerified = reviewDetails.badges?.includes('verified');
        const updatedBadges = hasVerified
          ? reviewDetails.badges.filter((b: string) => b !== 'verified')
          : [...(reviewDetails.badges || []), 'verified'];
        setReviewDetails({ ...reviewDetails, badges: updatedBadges });
      }
      loadUsers(searchQuery);
    } else {
      alert(res.error || 'Failed to update creator verification standing.');
    }
    setSubmitting(false);
  };

  const isSelectedSuspended = selectedUser?.isBanned || selectedUser?.isSuspended || selectedUser?.role === 'suspended' || selectedUser?.role === 'permanently_banned';

  // Table Columns Setup
  const columns: Column<any>[] = [
    {
      key: 'username',
      header: 'Creator Profile',
      render: (u) => (
        <div className="flex items-center gap-3">
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-lg object-cover bg-zinc-100" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              {u.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-zinc-900 truncate flex items-center gap-1.5">
              <span>{u.fullName || u.username}</span>
              {u.isVerified && <CheckCircle className="w-3.5 h-3.5 text-indigo-600 fill-indigo-50 shrink-0" />}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">@{u.username}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role Clearance',
      render: (u) => <AdminStatusBadge status={u.role || 'user'} />
    },
    {
      key: 'promptsCount',
      header: 'Prompts',
      render: (u) => <span className="font-mono font-semibold text-zinc-900">{u.promptsCount || 0}</span>
    },
    {
      key: 'followersCount',
      header: 'Followers',
      render: (u) => <span className="font-mono text-zinc-600">{u.followersCount || 0}</span>
    },
    {
      key: 'joinedAt',
      header: 'Joined Date',
      render: (u) => <span className="text-zinc-500 font-medium">{new Date(u.joinedAt).toLocaleDateString()}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => {
        const isBanned = u.isBanned || u.isSuspended || u.role === 'suspended' || u.role === 'permanently_banned';
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setSelectedUser(u);
                setIsReviewOpen(true);
              }}
              title="Inspect Creator"
              className="p-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleVerify(u.id)}
              disabled={submitting}
              title={u.isVerified ? 'Revoke Verification' : 'Grant Verification'}
              className={`p-1.5 rounded-lg border transition-colors ${
                u.isVerified 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
                  : 'border-zinc-200 hover:border-zinc-300 text-zinc-400 hover:text-indigo-600'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
            </button>
            {u.role !== 'super_admin' && (
              <button
                type="button"
                onClick={() => {
                  if (isBanned) {
                    setTargetUserForBan(u);
                    handleToggleBan();
                  } else {
                    openBanModalForUser(u);
                  }
                }}
                title={isBanned ? 'Reinstate User' : 'Suspend / Ban User'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isBanned 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                    : 'border-zinc-200 hover:border-rose-200 text-zinc-400 hover:text-rose-600'
                }`}
              >
                {isBanned ? <UserCheck className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        );
      }
    }
  ];

  const eligibility = reviewDetails ? calculateVerificationEligibility(reviewDetails) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <AdminPageHeader
        title="User & Creator Directory"
        description="Inspect creator metrics, manage verification standing, and enforce platform role clearance."
        icon={Users}
        badge={{ text: `${users.length} Registered Nodes`, variant: 'indigo' }}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]}
      >
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or name..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-zinc-200/80 text-xs font-medium placeholder-zinc-400 focus:outline-none focus:border-indigo-500 w-64 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            Search
          </button>
        </form>
      </AdminPageHeader>

      {/* Main Data Grid */}
      <AdminDataTable
        columns={columns}
        data={users}
        loading={loading}
        keyExtractor={(u) => u.id}
        emptyTitle="No creators found"
        emptyDescription="Try adjusting your search query or clear filters to view all user profiles."
        onRowClick={(u) => {
          setSelectedUser(u);
          setIsReviewOpen(true);
        }}
      />

      {/* Slide-Over Side Drawer for User Inspection */}
      <AdminSlideOver
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={selectedUser ? `@${selectedUser.username}` : 'Creator Details'}
        description="Comprehensive account metrics, standing analysis, and moderation history."
      >
        {selectedUser && (
          <div className="space-y-6 text-xs text-zinc-700">
            {/* User Profile Header */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                    {selectedUser.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">{selectedUser.fullName || selectedUser.username}</h3>
                  <p className="text-zinc-500 font-mono">@{selectedUser.username}</p>
                </div>
              </div>
              <AdminStatusBadge status={selectedUser.role || 'user'} />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Prompts</span>
                <p className="text-lg font-bold text-zinc-900 mt-0.5">{selectedUser.promptsCount || 0}</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Followers</span>
                <p className="text-lg font-bold text-zinc-900 mt-0.5">{selectedUser.followersCount || 0}</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Standing</span>
                <p className={`text-xs font-bold mt-1.5 ${isSelectedSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isSelectedSuspended ? 'Restricted' : 'Good'}
                </p>
              </div>
            </div>

            {/* Verification Analysis Panel */}
            {detailsLoading ? (
              <div className="py-8 flex items-center justify-center text-zinc-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Computing verification eligibility...</span>
              </div>
            ) : reviewDetails && eligibility && (
              <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider">Verification Audit Criteria</h4>
                  <AdminStatusBadge 
                    status={eligibility.isEligible ? 'approved' : 'rejected'} 
                    label={eligibility.isEligible ? 'Eligible' : 'Ineligible'}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-zinc-200/60">
                    <span>Published Templates ({reviewDetails.activePromptsCount})</span>
                    <span className={reviewDetails.activePromptsCount >= 3 ? 'text-emerald-600 font-bold' : 'text-zinc-500'}>
                      {reviewDetails.activePromptsCount >= 3 ? '✓ Target Met' : '3 Required'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-200/60">
                    <span>Total Community Likes ({reviewDetails.totalLikesCount})</span>
                    <span className={reviewDetails.totalLikesCount >= 10 ? 'text-emerald-600 font-bold' : 'text-zinc-500'}>
                      {reviewDetails.totalLikesCount >= 10 ? '✓ Target Met' : '10 Required'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-200/60">
                    <span>Remixes Crafted ({reviewDetails.remixesCreatedCount})</span>
                    <span className={reviewDetails.remixesCreatedCount >= 1 ? 'text-emerald-600 font-bold' : 'text-zinc-500'}>
                      {reviewDetails.remixesCreatedCount >= 1 ? '✓ Target Met' : '1 Required'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Reports Received ({reviewDetails.reportsAgainstCount})</span>
                    <span className={reviewDetails.reportsAgainstCount === 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {reviewDetails.reportsAgainstCount === 0 ? '✓ 0 Reports' : `${reviewDetails.reportsAgainstCount} Complaints`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Footer inside Drawer */}
            <div className="space-y-2 pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => handleToggleVerify(selectedUser.id)}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                {selectedUser.isVerified ? 'Revoke Creator Badge' : 'Grant Verified Creator Badge'}
              </button>

              {selectedUser.role !== 'super_admin' && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSelectedSuspended) {
                      handleToggleBan();
                    } else {
                      openBanModalForUser(selectedUser);
                    }
                  }}
                  disabled={submitting}
                  className={`w-full py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isSelectedSuspended
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  {isSelectedSuspended ? <UserCheck className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                  {isSelectedSuspended ? 'Reinstate Account' : 'Suspend / Ban Creator'}
                </button>
              )}

              <Link
                href={`/creator/${selectedUser.username}`}
                target="_blank"
                className="w-full py-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Profile
              </Link>
            </div>
          </div>
        )}
      </AdminSlideOver>

      {/* Confirm Dialog for Account Ban / Suspension */}
      <AdminConfirmDialog
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        onConfirm={handleToggleBan}
        title={banType === 'suspended' ? 'Suspend Creator Account' : 'Permanently Ban Creator'}
        description={`Specify a policy reason for updating standing of creator @${targetUserForBan?.username}.`}
        confirmText={banType === 'suspended' ? 'Suspend Account' : 'Permanently Ban'}
        variant="danger"
        isSubmitting={submitting}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Enforcement Action Type</label>
            <select
              value={banType}
              onChange={(e) => setBanType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none"
            >
              <option value="suspended">Temporary Account Suspension (15 Days)</option>
              <option value="permanently_banned">Permanent Account Ban</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Violation Reason</label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter policy guidelines reason..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none"
            />
          </div>
        </div>
      </AdminConfirmDialog>

    </div>
  );
}
