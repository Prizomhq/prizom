import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20 px-6 relative overflow-hidden bg-[#fafafa]">
      {/* Glow Blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-electric-blue)]/10 via-[var(--color-neon-purple)]/10 to-transparent rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-zinc-200/60 rounded-[3rem] p-10 text-center shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Glow Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--color-electric-blue)] via-[var(--color-neon-purple)] to-[var(--color-accent-pink)] rounded-t-[3rem]"></div>

        <div className="w-20 h-20 bg-purple-50 rounded-[2rem] border border-purple-100 flex items-center justify-center mx-auto mb-8 shadow-sm">
          <HelpCircle className="w-10 h-10 text-[var(--color-neon-purple)] animate-pulse" />
        </div>

        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 to-zinc-950 tracking-tighter mb-4 leading-none select-none">
          404
        </h1>

        <span className="inline-block text-[10px] font-black text-zinc-900 uppercase tracking-widest bg-zinc-100 border border-zinc-200/50 px-4 py-1.5 rounded-full mb-6">
          Page Not Found
        </span>

        <h2 className="text-xl font-black text-zinc-900 mb-3 leading-snug">Lost in Latent Space?</h2>
        <p className="text-zinc-500 font-semibold text-xs leading-relaxed mb-10 max-w-xs mx-auto">
          The prompt template or creative workspace you are searching for does not exist, or has been relocated by safety moderators.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.3)] text-white rounded-full text-xs font-black uppercase tracking-wider hover:-translate-y-0.5 transition-all transform active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Link>
          <Link
            href="/discover"
            className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 text-zinc-700 rounded-full text-xs font-black uppercase tracking-wider transition-all transform active:scale-98"
          >
            Discover Prompts
          </Link>
        </div>
      </div>
    </div>
  );
}
