'use client';

import Link from 'next/link';
import { Globe, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import PrizomLogo, { PrizomWordmark } from '@/components/ui/PrizomLogo';

import { getPublicCMS } from '@/app/actions/adminActions';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    getPublicCMS().then(res => {
      if (res.success && res.footer) {
        setSettings(res.footer);
      }
    });
  }, [pathname]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const aboutText = settings?.about_text || "The creative home for next-generation AI image prompts and collaborative remix culture. Evolve your creative workflows together.";
  const twitterLink = settings?.twitter_link || "https://twitter.com";
  const instagramLink = settings?.instagram_link || "https://instagram.com";
  const youtubeLink = settings?.youtube_link || "https://youtube";
  
  const legalLinks = settings?.legal_links || [
    { label: "Terms of Service", url: "/terms" },
    { label: "Privacy Policy", url: "/privacy" }
  ];

  const supportLinks = settings?.support_links || [
    { label: "Contact Us", url: "/#contact" }
  ];

  return (
    <footer className="relative w-full overflow-hidden border-t border-zinc-200/50 bg-[#fcfcfc]/80 backdrop-blur-md z-30 py-16 px-6 sm:px-8 lg:px-12">
      {/* Background radial soft light for premium depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[150px] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none -z-10" />

      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-12 gap-10 md:gap-8 pb-12 border-b border-zinc-200/30">
          
          {/* Brand Col */}
          <div className="col-span-2 sm:col-span-4 md:col-span-4 flex flex-col space-y-4">
            <Link href="/" className="flex items-center space-x-2.5 w-fit group text-zinc-900 hover:text-[var(--color-neon-purple)] transition-colors">
              <PrizomLogo size={40} className="transition-transform group-hover:scale-105" />
              <PrizomWordmark height={20} className="transition-transform group-hover:scale-102" />
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed font-normal max-w-[380px] mt-2">
              {aboutText}
            </p>
            <div className="flex items-center space-x-3 pt-2">
              {/* Instagram */}
              {instagramLink && (
                <a 
                  href={instagramLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-xl bg-white border border-zinc-200/60 text-zinc-500 hover:text-pink-600 hover:border-pink-200 hover:shadow-[0_4px_15px_rgba(236,72,153,0.1)] transition-all duration-250 flex items-center justify-center"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              )}

              {/* X / Twitter */}
              {twitterLink && (
                <a 
                  href={twitterLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-xl bg-white border border-zinc-200/60 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:shadow-[0_4px_15px_rgba(0,0,0,0.06)] transition-all duration-250 flex items-center justify-center"
                  aria-label="Twitter"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </a>
              )}

              {/* YouTube */}
              {youtubeLink && (
                <a 
                  href={youtubeLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-xl bg-white border border-zinc-200/60 text-zinc-500 hover:text-red-600 hover:border-red-200 hover:shadow-[0_4px_15px_rgba(239,68,68,0.1)] transition-all duration-250 flex items-center justify-center"
                  aria-label="YouTube"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path>
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Links Col 1: Discover */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2 flex flex-col space-y-4">
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Discover</h4>
            <ul className="flex flex-col space-y-2.5">
              <li>
                <Link href="/discover" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Discover Image Prompts
                </Link>
              </li>
              <li>
                <Link href="/discover?sort=popular" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Trending Image Prompts
                </Link>
              </li>
              <li>
                <Link href="/discover?tool=midjourney" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Midjourney Prompts
                </Link>
              </li>
              <li>
                <Link href="/discover?tool=flux" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Flux Prompts
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2: Community */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2 flex flex-col space-y-4">
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Community</h4>
            <ul className="flex flex-col space-y-2.5">
              <li>
                <Link href="/community-guidelines" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/settings?tab=verification-program" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Verification Badge
                </Link>
              </li>
              <li>
                <Link href="/copyright-policy" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Copyright Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 3: Platform */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2 flex flex-col space-y-4">
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Platform</h4>
            <ul className="flex flex-col space-y-2.5">
              <li>
                <Link href="/settings?tab=about" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  About Prizom
                </Link>
              </li>
              <li>
                <Link href="/settings?tab=help" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/settings?tab=contact-support" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 4: Legal */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2 flex flex-col space-y-4">
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Legal</h4>
            <ul className="flex flex-col space-y-2.5">
              <li>
                <Link href="/terms" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy#rights" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Your Privacy Rights
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-xs font-bold text-zinc-500 hover:text-[var(--color-neon-purple)] transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Col */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-[11px] font-bold text-zinc-500 gap-4 border-b border-zinc-200/20 pb-4">
          <p>{settings?.copyright_text || `© ${currentYear} Prizom. Crafted for AI image creators worldwide.`}</p>
          <p className="flex items-center">
            Designed with <span className="text-[var(--color-accent-pink)] mx-1 text-xs">♥</span> by the Prizom community.
          </p>
        </div>

        {/* Trademark Disclaimer */}
        <div className="pt-4 text-[9px] font-semibold text-zinc-400 leading-normal text-left max-w-4xl">
          * Disclaimer: Midjourney, Flux, Stable Diffusion, DALL-E, ChatGPT, and other AI engines referenced on this platform are trademarks of their respective owners. Prizom is an independent community prompt registry and is not endorsed by, sponsored by, or affiliated with any third-party AI developers.
        </div>
      </div>
    </footer>
  );
}
