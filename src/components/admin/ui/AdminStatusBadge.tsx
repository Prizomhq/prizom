'use client';

import React from 'react';

export type StatusVariant = 
  | 'super_admin' | 'admin' | 'moderator' | 'user'
  | 'active' | 'suspended' | 'banned' | 'permanently_banned'
  | 'pending' | 'approved' | 'rejected' | 'warned'
  | 'under_review' | 'resolved' | 'dismissed' | 'escalated';

interface AdminStatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; styles: string }> = {
  // Roles
  super_admin: { label: 'Super Admin', styles: 'bg-rose-50 text-rose-700 border-rose-200' },
  admin: { label: 'Admin', styles: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  moderator: { label: 'Moderator', styles: 'bg-teal-50 text-teal-700 border-teal-200' },
  user: { label: 'Creator', styles: 'bg-zinc-100 text-zinc-700 border-zinc-200' },

  // User & Prompt States
  active: { label: 'Active', styles: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  suspended: { label: 'Suspended', styles: 'bg-amber-50 text-amber-700 border-amber-200' },
  banned: { label: 'Banned', styles: 'bg-rose-50 text-rose-700 border-rose-200' },
  permanently_banned: { label: 'Permanently Banned', styles: 'bg-rose-50 text-rose-700 border-rose-200' },
  pending_deletion: { label: 'Hidden / Moderated', styles: 'bg-rose-50 text-rose-700 border-rose-200' },

  // Appeal & Report Statuses
  pending: { label: 'Pending Review', styles: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_review: { label: 'Under Review', styles: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  approved: { label: 'Approved', styles: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', styles: 'bg-rose-50 text-rose-700 border-rose-200' },
  resolved: { label: 'Resolved', styles: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  dismissed: { label: 'Dismissed', styles: 'bg-zinc-100 text-zinc-650 border-zinc-200' },
  escalated: { label: 'Escalated', styles: 'bg-purple-50 text-purple-700 border-purple-200' },
  warned: { label: 'Warned', styles: 'bg-amber-50 text-amber-700 border-amber-200' }
};

export default function AdminStatusBadge({ status, label, className = '' }: AdminStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    styles: 'bg-zinc-100 text-zinc-700 border-zinc-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${config.styles} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {label || config.label}
    </span>
  );
}
