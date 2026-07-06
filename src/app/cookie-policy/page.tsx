'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, ArrowLeft, Info, HelpCircle } from 'lucide-react';

export default function CookiePolicy() {
  const lastUpdated = 'June 26, 2026';

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-800 pt-28 pb-6 md:pb-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-[1600px] mx-auto">
        {/* Breadcrumbs & Title */}
        <div className="max-w-5xl mx-auto mb-10">
          <nav className="flex items-center space-x-2 text-[10px] font-black text-zinc-400 mb-6 uppercase tracking-widest">
            <Link href="/" className="hover:text-[var(--color-electric-blue)] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-zinc-600">Cookie Policy</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200/60 pb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight flex items-center">
                <ShieldCheck className="w-8 h-8 mr-3 text-indigo-600 shrink-0" />
                Cookie Policy
              </h1>
              <p className="text-zinc-500 font-semibold text-xs mt-2">
                Transparency, local storage variables, and tracking opt-in controls
              </p>
            </div>
            <p className="text-zinc-400 font-bold text-xs flex items-center shrink-0">
              <Clock className="w-4 h-4 mr-1.5" />
              Last Updated: {lastUpdated}
            </p>
          </div>
        </div>

        {/* Content Panel */}
        <div className="max-w-3xl mx-auto prose prose-zinc prose-sm">
          <div className="space-y-12">
            <div className="bg-white/45 border border-zinc-200/50 p-6 rounded-2xl text-xs sm:text-sm text-zinc-500 font-semibold leading-relaxed shadow-sm">
              This Cookie Policy details how Prizom uses browser cookies, LocalStorage keys, and session tracking identifiers across our website portals and API endpoints to comply with PECR and GDPR requirements.
            </div>

            {/* Section 1 */}
            <section className="border-b border-zinc-200/60 pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center">
                <Info className="w-4.5 h-4.5 mr-2 text-indigo-500" />
                1. What Are Cookies and Local Storage?
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  Cookies are small text files stored on your computer by your web browser when visiting websites. LocalStorage is a standard browser mechanism that lets web applications store client-side parameters persistently across page refreshes. We use both technologies to secure user sessions and remember UI layout configurations.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="border-b border-zinc-200/60 pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4">
                2. Categories of Cookies We Use
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-6">
                
                {/* Type 1 */}
                <div>
                  <h4 className="font-extrabold text-xs text-zinc-900 uppercase tracking-wide">A. Essential Cookies (Strictly Necessary)</h4>
                  <p className="mt-1">
                    These cookies are necessary for Prizom&apos;s core operations. We use them strictly to log you in, secure databases access via JWT tokens, authenticate calls to Supabase databases, and keep track of account deactivation/deletion requests. Because the site cannot function without these trackers, you cannot disable them.
                  </p>
                </div>

                {/* Type 2 */}
                <div>
                  <h4 className="font-extrabold text-xs text-zinc-900 uppercase tracking-wide">B. Preference Cookies</h4>
                  <p className="mt-1">
                    We use LocalStorage items to save minor preferences (such as your chosen UI sidebar collapse states and dark/light mode templates). These do not track personal identifying data and are stored locally in your browser.
                  </p>
                </div>

                {/* Type 3 */}
                <div>
                  <h4 className="font-extrabold text-xs text-zinc-900 uppercase tracking-wide">C. Analytics & Search Telemetry</h4>
                  <p className="mt-1">
                    Under the EU Privacy and Electronic Communications Directive (PECR), analytics cookies require active opt-in. We track guest page views and search parameters to order feed algorithms and recommend trending prompts. We do not trigger guest event trackers unless you explicitly click &quot;Accept All&quot; or opt-in to Analytics inside our Cookie Banner.
                  </p>
                </div>

              </div>
            </section>

            {/* Section 3 */}
            <section className="border-b border-zinc-200/60 pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center">
                <HelpCircle className="w-4.5 h-4.5 mr-2 text-indigo-500" />
                3. How to Manage and Delete Cookies
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  You hold full statutory authority to control cookies. You can manage your preferences on Prizom at any time by:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Browser Settings:</strong> Adjusting browser configurations to block cookies entirely or notify you before they are saved.</li>
                  <li><strong>Opting Out:</strong> Rejecting analytics consent when prompted by the cookie consent banner.</li>
                  <li><strong>Wiping Storage:</strong> Clearing your browser history and cache, which wipes all local storage and session variables.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4">
                4. Policy Updates
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  We may adjust our cookie tracking protocols from time to time. When we make updates, we will adjust the &quot;Last Updated&quot; metric at the top of this page. If you have questions regarding our cookie practices, please contact us at <a href="mailto:privacy@prizom.in" className="text-indigo-600 hover:underline">privacy@prizom.in</a>.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
