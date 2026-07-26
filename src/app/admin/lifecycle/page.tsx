'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Trash2, 
  RefreshCw, 
  Clock, 
  UserCheck, 
  UserX, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { 
  getLifecycleUsersAction, 
  adminCancelDeletionAction, 
  adminForceDeletionAction 
} from '@/app/actions/adminActions';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminDataTable, { Column } from '@/components/admin/ui/AdminDataTable';
import AdminStatusBadge from '@/components/admin/ui/AdminStatusBadge';
import AdminConfirmDialog from '@/components/admin/ui/AdminConfirmDialog';

export default function AdminLifecyclePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending_deletion' | 'deactivated' | 'active'>('pending_deletion');
  
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
      }
      setLoading(false);
    });
  };

  useEffect(() => {
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
      alert(res.error || 'Failed to execute immediate hard deletion.');
    }
  };

  // Filter list
  const filteredUsers = users.filter(u => {
    const matchesTab = activeTab === 'pending_deletion' ? u.isPendingDeletion : activeTab === 'deactivated' ? u.isDeactivated : !u.isPendingDeletion && !u.isDeactivated;
    const matchesSearch = !searchQuery || 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const columns: Column<any>[] = [
    {
      key: 'username',
      header: 'Account Node',
      render: (u) => (
        <div className="flex items-center gap-3">
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-lg object-cover bg-zinc-100" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 font-bold flex items-center justify-center text-xs">
              {u.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div className="font-bold text-zinc-900">{u.fullName || u.username}</div>
            <div className="text-[11px] text-zinc-400 font-mono">@{u.username}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Lifecycle State',
      render: (u) => (
        <AdminStatusBadge
          status={u.isPendingDeletion ? 'pending_deletion' : u.isDeactivated ? 'suspended' : 'active'}
          label={u.isPendingDeletion ? 'Pending Deletion' : u.isDeactivated ? 'Deactivated' : 'Active'}
        />
      )
    },
    {
      key: 'deletionRequestedAt',
      header: 'Request Date',
      render: (u) => <span className="text-zinc-500 font-medium">{u.deletionRequestedAt ? new Date(u.deletionRequestedAt).toLocaleDateString() : 'N/A'}</span>
    },
    {
      key: 'daysRemaining',
      header: 'Grace Countdown',
      render: (u) => (
        <span className={`font-mono font-bold ${u.daysRemaining <= 5 ? 'text-rose-600' : 'text-amber-600'}`}>
          {u.isPendingDeletion ? `${u.daysRemaining} days left` : 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          {u.isPendingDeletion && (
            <button
              type="button"
              onClick={() => setConfirmingCancelUser(u)}
              title="Cancel Deletion Request"
              className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Cancel Deletion
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setConfirmingForceUser(u);
              setTypedConfirmUsername('');
            }}
            title="Immediate Hard Deletion"
            className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Force Purge
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <AdminPageHeader
        title="Account Lifecycle & Purge Queue"
        description="Monitor grace period account deletion requests, process cancellations, and execute hard purges."
        icon={Clock}
        badge={{ text: `${users.filter(u => u.isPendingDeletion).length} Pending Purges`, variant: 'rose' }}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Account Lifecycle' }]}
      >
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search account username..."
            className="pl-9 pr-4 py-2 rounded-xl bg-white border border-zinc-200/80 text-xs font-medium placeholder-zinc-400 focus:outline-none focus:border-indigo-500 w-60 shadow-2xs"
          />
        </div>
      </AdminPageHeader>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 bg-zinc-100/80 rounded-xl border border-zinc-200/80 w-fit text-xs font-semibold text-zinc-600">
        <button
          onClick={() => setActiveTab('pending_deletion')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'pending_deletion' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-rose-600" />
          Pending Deletion ({users.filter(u => u.isPendingDeletion).length})
        </button>
        <button
          onClick={() => setActiveTab('deactivated')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'deactivated' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <UserX className="w-3.5 h-3.5 text-amber-600" />
          Deactivated Accounts ({users.filter(u => u.isDeactivated).length})
        </button>
      </div>

      {/* Data Grid */}
      <AdminDataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        keyExtractor={(u) => u.id}
        emptyTitle="No lifecycle requests"
        emptyDescription="There are currently no user accounts in this deletion stage."
      />

      {/* Cancel Deletion Confirm Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(confirmingCancelUser)}
        onClose={() => setConfirmingCancelUser(null)}
        onConfirm={handleCancelDeletion}
        title="Cancel Account Deletion"
        description={`Reinstate account @${confirmingCancelUser?.username} and restore active profile access?`}
        confirmText="Cancel Deletion & Restore"
        variant="info"
        isSubmitting={submitting}
      />

      {/* Force Hard Deletion Confirm Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(confirmingForceUser)}
        onClose={() => setConfirmingForceUser(null)}
        onConfirm={handleForceDeletion}
        title="Immediate Permanent Hard Purge"
        description={`Permanently purge account @${confirmingForceUser?.username} and remove all associated Postgres records immediately?`}
        confirmText="Force Purge Account"
        variant="danger"
        isSubmitting={submitting}
      >
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-rose-700">
            Type username <strong className="font-bold">"{confirmingForceUser?.username}"</strong> to confirm permanent deletion:
          </label>
          <input
            type="text"
            value={typedConfirmUsername}
            onChange={(e) => setTypedConfirmUsername(e.target.value)}
            placeholder={confirmingForceUser?.username}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-rose-200 text-xs font-mono text-zinc-900 focus:outline-none"
          />
        </div>
      </AdminConfirmDialog>

    </div>
  );
}
