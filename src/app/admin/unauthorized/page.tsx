'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut, ArrowLeft, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function UnauthorizedPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fcfcfc] text-zinc-800 relative overflow-hidden">
      {/* Sleek Light Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />
      
      {/* Glowing red hazard halo blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="inline-flex p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-600 mb-8 animate-pulse">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-4 uppercase">
          Access Blocked
        </h1>
        
        <p className="text-zinc-500 font-semibold text-xs leading-relaxed max-w-sm mx-auto mb-10">
          This sector is reserved exclusively for whitelisted Prizom platform administrators. Your profile role does not hold the required authorization clearance.
        </p>

        <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-xl max-w-sm mx-auto mb-10 flex flex-col gap-4 text-xs font-bold text-zinc-700">
          <span className="uppercase text-[9px] text-zinc-500 tracking-wider">Audit Report Details</span>
          <div className="flex justify-between border-b border-zinc-100 pb-2.5">
            <span>Security Layer:</span>
            <span className="text-red-600">Edge Middleware Gate</span>
          </div>
          <div className="flex justify-between">
            <span>Result:</span>
            <span className="text-zinc-800">403 Unauthorized Access</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
          <Link 
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-full text-xs font-black uppercase tracking-wider text-zinc-700 transition-all hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home Registry
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-100/50 transition-all hover:-translate-y-0.5"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out & Swap
          </button>
        </div>
      </div>
    </div>
  );
}
