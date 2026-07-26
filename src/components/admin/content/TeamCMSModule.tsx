'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, Edit, Save, Loader2, AlertCircle } from 'lucide-react';
import { getAdminTeamAction, addAdminTeamMemberAction, removeAdminTeamMemberAction } from '@/app/actions/adminActions';
import AdminStatusBadge from '@/components/admin/ui/AdminStatusBadge';

export default function TeamCMSModule() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'super_admin' | 'admin' | 'moderator'>('moderator');

  const loadTeam = () => {
    setLoading(true);
    getAdminTeamAction().then((res: any) => {
      if (res.success && res.team) {
        setTeam(res.team);
      }
      setLoading(false);
    });
  };


  useEffect(() => {
    loadTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setMsg(null);

    const res = await addAdminTeamMemberAction(email.trim(), role);
    setSubmitting(false);

    if (res.success) {
      setEmail('');
      setMsg('Added team member to administrative whitelist.');
      loadTeam();
    } else {
      setMsg(res.error || 'Failed to add team member.');
    }
  };

  const handleRemoveMember = async (emailToRemove: string) => {
    setSubmitting(true);
    const res = await removeAdminTeamMemberAction(emailToRemove);
    setSubmitting(false);
    if (res.success) {
      loadTeam();
    } else {
      alert(res.error || 'Failed to remove team member.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Admin Team Clearance & Whitelist</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Manage operator permissions, moderator access, and super-admin clearance.</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Team Member Form */}
        <form onSubmit={handleAddMember} className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Grant Admin Clearance</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">User Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@prizom.in"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-900 focus:outline-none"
              >
                <option value="moderator">Moderator (Reports & Appeals)</option>
                <option value="admin">Administrator (Users, Prompts & Content)</option>
                <option value="super_admin">Super Admin (Full System Access)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Grant Whitelist Clearance
            </button>
          </div>
        </form>

        {/* Active Team List */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Whitelisted Admin Operators ({team.length})</h3>

          {loading ? (
            <div className="py-8 text-center text-zinc-400 gap-2 flex flex-col items-center">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-xs">Loading team clearance list...</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
              {team.map((member) => (
                <div key={member.id || member.email} className="py-3 flex items-center justify-between gap-4 text-xs font-medium text-zinc-800">
                  <div>
                    <h4 className="font-bold text-zinc-900">{member.email}</h4>
                    <p className="text-zinc-400 font-mono text-[10px] mt-0.5">Granted: {new Date(member.created_at || member.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AdminStatusBadge status={member.role} />
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.email)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
