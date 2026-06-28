'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [consentAnalytics, setConsentAnalytics] = useState(true);

  useEffect(() => {
    // Check if user has already made a selection
    const localConsent = localStorage.getItem('prizom-cookie-consent');
    if (!localConsent) {
      // Show banner after a slight delay for aesthetic transition
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('prizom-cookie-consent', 'granted');
    localStorage.setItem('prizom-cookie-consent-analytics', 'true');
    setShowBanner(false);
    // Reload guest tracker state
    window.dispatchEvent(new Event('cookie-consent-updated'));
  };

  const handleDeclineAll = () => {
    localStorage.setItem('prizom-cookie-consent', 'declined');
    localStorage.setItem('prizom-cookie-consent-analytics', 'false');
    setShowBanner(false);
    window.dispatchEvent(new Event('cookie-consent-updated'));
  };

  const handleSavePreferences = () => {
    const consent = consentAnalytics ? 'granted' : 'declined';
    localStorage.setItem('prizom-cookie-consent', consent);
    localStorage.setItem('prizom-cookie-consent-analytics', consentAnalytics ? 'true' : 'false');
    setShowBanner(false);
    window.dispatchEvent(new Event('cookie-consent-updated'));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-zinc-950/95 border border-zinc-800 text-white rounded-[2rem] p-6 shadow-2xl backdrop-blur-md z-[99999] animate-in slide-in-from-bottom-8 fade-in duration-300">
      <div className="relative flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider">Cookie Compliance</h4>
          </div>
          <button 
            onClick={handleDeclineAll} 
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            aria-label="Decline cookies"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        {!showPreferences ? (
          <>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              We use essential cookies for authentication and performance. We also use analytics cookies to optimize your search feed. Read our{' '}
              <Link href="/cookie-policy" className="text-indigo-400 hover:underline">
                Cookie Policy
              </Link>{' '}
              for details.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] text-white text-xs font-black uppercase tracking-wider rounded-full hover:shadow-[0_4px_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer text-center"
              >
                Accept All
              </button>
              <button
                onClick={() => setShowPreferences(true)}
                className="py-3 px-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-wider rounded-full transition-all border border-zinc-800 cursor-pointer text-center"
              >
                Preferences
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-3">
              {/* Essential */}
              <div className="flex items-start justify-between p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
                <div>
                  <h5 className="text-[11px] font-black uppercase tracking-wide text-zinc-300">Essential Cookies</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Required for account login, security, and session management.</p>
                </div>
                <span className="text-[9px] font-black text-green-500 uppercase bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Always Active</span>
              </div>

              {/* Analytics */}
              <label className="flex items-start justify-between p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl cursor-pointer select-none hover:border-zinc-800 transition-colors">
                <div>
                  <h5 className="text-[11px] font-black uppercase tracking-wide text-zinc-300">Analytics & Tracking</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Logs anonymous search keywords and page views to tailor recommendations.</p>
                </div>
                <input
                  type="checkbox"
                  checked={consentAnalytics}
                  onChange={(e) => setConsentAnalytics(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-zinc-800 text-indigo-600 bg-zinc-950 focus:ring-indigo-500 focus:ring-offset-zinc-950"
                />
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSavePreferences}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] text-white text-xs font-black uppercase tracking-wider rounded-full hover:shadow-[0_4px_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer text-center"
              >
                Save Choice
              </button>
              <button
                onClick={() => setShowPreferences(false)}
                className="py-3 px-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-wider rounded-full transition-all border border-zinc-800 cursor-pointer text-center"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
