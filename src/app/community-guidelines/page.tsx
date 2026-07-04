'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, ArrowLeft, ArrowUpRight, ShieldAlert, Sparkles, Scale, Info } from 'lucide-react';

export default function CommunityGuidelines() {
  const lastUpdated = 'June 26, 2026';

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-800 pt-28 pb-6 md:pb-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-[1600px] mx-auto">
        {/* Breadcrumbs & Title */}
        <div className="max-w-5xl mx-auto mb-10">
          <nav className="flex items-center space-x-2 text-[10px] font-black text-zinc-400 mb-6 uppercase tracking-widest">
            <Link href="/" className="hover:text-[var(--color-electric-blue)] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-zinc-600">Community Guidelines</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200/60 pb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight flex items-center">
                <ShieldCheck className="w-8 h-8 mr-3 text-indigo-600 shrink-0" />
                Community Guidelines
              </h1>
              <p className="text-zinc-500 font-semibold text-xs mt-2">
                Operational safety, moderation frameworks, and generative AI standards
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
              Prizom is an open collaborative registry for generative AI prompt engineers. To maintain a safe, welcoming, and inspirational environment for digital creators, all platform participants must adhere to these Community Guidelines.
            </div>

            {/* Section 1 */}
            <section className="border-b border-zinc-200/60 pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center">
                <Sparkles className="w-4.5 h-4.5 mr-2 text-indigo-500" />
                1. Respect Artistic Expression & Attribution
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  Prizom operates on an open **Remix Culture**. Prompt parameters (weights, negative keywords, seeds) published to public feeds are open source templates. However:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Preserve Lineage:</strong> Any prompt created by copying, modifying, or branching a pre-existing prompt on Prizom must maintain its parent-creator attribution database indexes.</li>
                  <li><strong>No Image Theft:</strong> You are strictly forbidden from downloading other creators&apos; output images and publishing them as your own original generated work.</li>
                  <li><strong>Impersonation:</strong> Do not register handles or usernames pretending to be other notable digital artists or prompt engineers.</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section className="border-b border-zinc-200/60 pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center">
                <ShieldAlert className="w-4.5 h-4.5 mr-2 text-red-500" />
                2. Prohibited Content and Visuals
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  We enforce zero tolerance for content that includes, promotes, or facilitates:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Harassment & Hate Speech:</strong> Bullying, defamation, slurs, or threats directed at individual creators or groups based on race, gender, sexual orientation, or disability.</li>
                  <li><strong>Explicit Pornography:</strong> Generation or sharing of explicit adult materials, non-consensual sexual content, or sexualization of minors.</li>
                  <li><strong>Violence & Self-Harm:</strong> Graphic representations of real-world violence, self-injury instructions, or terrorist recruitment materials.</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="border-b border-zinc-200/60 pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center">
                <Scale className="w-4.5 h-4.5 mr-2 text-indigo-500" />
                3. Model Integrity & Safety Bypasses (Jailbreaking)
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  Prompt design is an empirical science, but it must be practiced ethically.
                </p>
                <p>
                  You are strictly prohibited from publishing prompts engineered to intentionally bypass, crack, or jailbreak the safety guardrails, content filters, or terms of service of external generative models (e.g. Midjourney, ChatGPT, DALL-E, Stable Diffusion). This includes sharing instructions designed to force models to output toxic, illegal, or trademark-infringing content.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="border-b border-zinc-200/60 pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center">
                <Info className="w-4.5 h-4.5 mr-2 text-indigo-500" />
                4. Moderation & Enforcement Procedures
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  To keep the registry clean, Prizom reserves the right to:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Scan prompt text and upload assets to verify file safety.</li>
                  <li>Hide, lock, or permanently delete prompt submissions that violate these guidelines.</li>
                  <li>Suspend or permanently ban accounts of repeat offenders. Banned accounts are subject to permanent deletion after a 15-day appeal window.</li>
                </ul>
                <p>
                  If your content is flagged, you will receive a notification. You can submit an appeal through the support desk within 14 days of the moderation action.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4">
                5. Reporting Guidelines
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  If you spot prompts or images that violate these rules, please click the &quot;Report&quot; button on the prompt details page, or report them directly by emailing:
                </p>
                <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm text-xs font-bold space-y-1.5 w-fit">
                  <p className="text-zinc-900">Prizom Safety Desk</p>
                  <p>Email: <a href="mailto:safety@prizom.in" className="text-indigo-600 hover:underline">safety@prizom.in</a></p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
