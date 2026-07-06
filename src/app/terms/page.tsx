'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, Clock, ArrowLeft, ArrowUpRight, ShieldAlert } from 'lucide-react';

const sections = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'eligibility', label: '2. Eligibility & Accounts' },
  { id: 'ownership', label: '3. User Content & Prompt Licensing' },
  { id: 'publications', label: '4. Prompt Publishing Policies' },
  { id: 'remix', label: '5. Remix & Attribution Rules' },
  { id: 'ip', label: '6. Intellectual Property & Trademarks' },
  { id: 'standards', label: '7. Community Standards' },
  { id: 'ai-responsibility', label: '8. AI Content Responsibility' },
  { id: 'dmca', label: '9. Copyright & DMCA Policy' },
  { id: 'prohibited', label: '10. Prohibited Activities' },
  { id: 'moderation', label: '11. Moderation Rights' },
  { id: 'termination', label: '12. Account Suspension' },
  { id: 'third-party', label: '13. Third-Party Services' },
  { id: 'disclaimer', label: '14. Disclaimer of Warranties' },
  { id: 'liability', label: '15. Limitation of Liability' },
  { id: 'indemnity', label: '16. Indemnification' },
  { id: 'governing-law', label: '17. Governing Law & Dispute Resolution' },
  { id: 'changes', label: '18. Changes to Terms' },
  { id: 'contact', label: '19. Contact Information' },
];

export default function TermsOfService() {
  const lastUpdated = 'June 26, 2026';

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 90; // Navbar height offset
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-800 pt-28 pb-6 md:pb-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Breadcrumbs & Title Grid */}
        <div className="max-w-5xl mx-auto mb-10">
          <nav className="flex items-center space-x-2 text-[10px] font-black text-zinc-400 mb-6 uppercase tracking-widest">
            <Link href="/" className="hover:text-[var(--color-electric-blue)] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-zinc-600">Terms of Service</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200/60 pb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight flex items-center">
                <Scale className="w-8 h-8 mr-3 text-indigo-600 shrink-0" />
                Terms of Service
              </h1>
              <p className="text-zinc-500 font-semibold text-xs mt-2">
                Prizom Generative Prompt Engineering Registry Agreement
              </p>
            </div>
            <p className="text-zinc-400 font-bold text-xs flex items-center shrink-0">
              <Clock className="w-4 h-4 mr-1.5" />
              Last Updated: {lastUpdated}
            </p>
          </div>
        </div>

        {/* 2-Column layout for desktop, collapsible on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto">
          
          {/* Mobile navigation ribbon */}
          <div className="lg:hidden sticky top-[64px] bg-white/95 border-b border-zinc-200/80 backdrop-blur-md z-20 py-3.5 -mx-6 sm:-mx-8 px-6 sm:px-8 overflow-x-auto max-w-[100vw] flex items-center space-x-3.5 no-scrollbar shadow-sm">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">Sections:</span>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => handleScroll(sec.id)}
                className="text-[10px] font-bold text-zinc-600 hover:text-indigo-600 bg-zinc-50 hover:bg-indigo-50/50 border border-zinc-200/50 px-3.5 py-1.5 rounded-full shrink-0 transition-all"
              >
                {sec.label.split('. ')[1]}
              </button>
            ))}
          </div>

          {/* Left Column: Table of Contents */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28 space-y-6">
              <div className="p-5 bg-white/40 border border-zinc-200/40 rounded-2xl backdrop-blur-sm shadow-sm">
                <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-4 pb-2 border-b border-zinc-200/50">
                  Table of Contents
                </h4>
                <nav className="flex flex-col space-y-2">
                  {sections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => handleScroll(sec.id)}
                      className="text-left text-[11px] font-bold text-zinc-500 hover:text-indigo-600 transition-colors py-1 pl-2 border-l border-zinc-200 hover:border-indigo-500 hover:bg-zinc-50/50 rounded-r-md"
                    >
                      {sec.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Right Column: Content */}
          <main className="lg:col-span-9 max-w-3xl prose prose-zinc prose-sm">
            <div className="space-y-12">
              
              <div className="bg-white/40 border border-zinc-200/50 p-6 rounded-2xl text-xs sm:text-sm text-zinc-500 font-semibold leading-relaxed shadow-sm">
                These Terms of Service (&quot;Terms&quot;) represent a legally binding electronic contract between you (&quot;User&quot;, &quot;Creator&quot;, or &quot;you&quot;) and Prizom (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) governing your access to, integration with, and general use of our generative prompt registries, software applications, APIs, database tables, and website domains. By accessing our services, you accept and agree to be fully bound by these Terms.
              </div>

              {/* 1 */}
              <section id="acceptance" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4 flex items-center">
                  1. Acceptance of Terms
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    By registering an account with Prizom, utilizing our web portals, retrieving prompt templates via our APIs, or interacting with our Supabase services, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy.
                  </p>
                  <p>
                    If you are agreeing to these Terms on behalf of an enterprise or legal entity, you represent and warrant that you hold full organizational authority to bind such entity. If you lack this authority or do not agree to every clause within these Terms, you must immediately cease utilizing Prizom&apos;s systems.
                  </p>
                </div>
              </section>

              {/* 2 */}
              <section id="eligibility" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  2. Eligibility & Account Requirements
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    You must be at least eighteen (18) years of age to register a personal creator profile on Prizom if residing in India, or at least thirteen (13) years of age in other global jurisdictions requiring parental consent for data processing. If you do not meet these age thresholds, you are strictly prohibited from establishing an account.
                  </p>
                  <p>
                    All registered accounts are processed via secure Supabase identity portals. You must provide complete, accurate, and up-to-date registration records (email, username, avatar). You are strictly prohibited from impersonating other prompt engineers or choosing usernames that violate intellectual property rights. You are solely responsible for maintaining credentials security.
                  </p>
                </div>
              </section>

              {/* 3 */}
              <section id="ownership" className="scroll-mt-24 border-b border-zinc-200/60 pb-8 bg-gradient-to-br from-indigo-50/20 to-transparent p-6 rounded-2xl border border-indigo-100/50">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  3. User Content & Prompt Licensing
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Prizom celebrates creator ownership. You retain complete, absolute title, ownership, and intellectual property rights over any original visual output images you generate and publish on Prizom (&quot;User Content&quot;).
                  </p>
                  <p className="font-bold text-zinc-800">
                    Prompt Text Licensing (CC0 Dedication):
                  </p>
                  <p>
                    Because prompt formats are structured inputs designed for third-party machine learning models and to encourage open collaboration, all textual structures, parameters, seed values, weights, and negative prompt keywords you publish to the public feed are dedicated to the public domain under the Creative Commons Zero (CC0 1.0 Universal) license. By publishing prompt text on Prizom, you waive all copyright and related rights globally, allowing anyone to copy, modify, distribute, or run the prompt for any commercial or non-commercial purpose without further permission or royalty requirements.
                  </p>
                  <p>
                    For your output illustrations, you grant Prizom a worldwide, non-exclusive, royalty-free, perpetual, irrevocable, fully paid-up, and sublicensable license to host, parse, cache, index, query, distribute, modify (for formatting purposes), publicly display, and promote your shared prompt templates to facilitate platform discovery operations.
                  </p>
                </div>
              </section>

              {/* 4 */}
              <section id="publications" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  4. Prompt Publishing Policies
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    When submitting prompts to Prizom, you represent and warrant that: (i) you own or hold appropriate licenses to publish all submitted text and images; (ii) your prompt lines do not infringe the intellectual property, copyright, patent, trademark, or privacy rights of any third party; and (iii) your publications do not contain viruses, hidden execution payloads, or malicious scripts.
                  </p>
                  <p>
                    You agree that Prizom may parse and check published files to verify file safety. All image assets published are processed through secure Supabase Storage buckets, and prompt variables are cataloged in our cloud database tables.
                  </p>
                </div>
              </section>

              {/* 5 */}
              <section id="remix" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  5. Remix & Attribution Rules
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Prizom&apos;s primary creative core is built upon an open **Remix Culture**. Prompt templates published to public registries are shared with the community, allowing creators to dynamically remix existing instructions to test new style parameters.
                  </p>
                  <p className="font-extrabold text-zinc-800">
                    To maintain community integrity, any prompt created by copying, modifying, or remixing a pre-existing prompt on Prizom must maintain its parent-creator lineage.
                  </p>
                  <p>
                    Our system automatically records the parent prompt references (`remix_of` variables) and increment counts. You agree not to: (i) bypass, corrupt, or alter these automatic database lineage trackers; (ii) manually copy prompt sequences to re-publish them as completely original works without parent references; or (iii) strip away original creator avatar links to falsely represent ownership. Violation of this remix policy represents grounds for instant account suspension.
                  </p>
                </div>
              </section>

              {/* 6 */}
              <section id="ip" className="scroll-mt-24 border-b border-zinc-200/60 pb-8 bg-zinc-50 p-6 rounded-2xl border border-zinc-200/60">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  6. Intellectual Property & Trademarks
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Excluding User Content, all content, design elements, layouts, logos, brand markers (Prizom logo, typography, icons), proprietary software engines, compilation grid systems, database schemas, and source code on Prizom represent the exclusive intellectual property of Prizom and are protected under international copyright, trademark, and trade secret laws.
                  </p>
                  <p className="font-bold text-zinc-800 uppercase tracking-wide text-xs">
                    Third-Party Trademark Disclaimer:
                  </p>
                  <p className="text-[11px] text-zinc-500 bg-white p-4 border border-zinc-200 rounded-xl leading-relaxed">
                    Midjourney, Stable Diffusion, Flux, DALL-E, ChatGPT, and other generative AI models and platforms referenced on Prizom are the registered trademarks of their respective owners. Prizom is an independent open prompt registry and search index, and is not affiliated with, endorsed by, sponsored by, or associated with these third-party trademark holders.
                  </p>
                </div>
              </section>

              {/* 7 */}
              <section id="standards" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  7. Community Standards
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Prizom is committed to providing a secure, creative, and respectful environment for digital artists. You agree not to publish prompts or generate illustration outputs that contain:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Hate speech, extreme harassment, malicious defamation, or threat payloads.</li>
                    <li>Explicit pornographic materials, non-consensual sexual imagery, or violence.</li>
                    <li>Prompts intentionally engineered to bypass safety filters of generative systems (&quot;jailbreak scripts&quot; designed to generate illegal or toxic materials on external models).</li>
                  </ul>
                  <p>
                    For detailed rules, read our dedicated <Link href="/community-guidelines" className="text-indigo-600 hover:underline">Community Guidelines</Link>.
                  </p>
                </div>
              </section>

              {/* 8 */}
              <section id="ai-responsibility" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  8. AI-Generated Content Responsibility
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Prizom is a search registry and social sharing canvas; we do not own, operate, or directly run the underlying neural networks (such as Midjourney, Flux, Stable Diffusion, ChatGPT, or DALL-E) that process prompt instructions.
                  </p>
                  <p>
                    You acknowledge and agree that: (i) prompt engineering is an empirical, non-deterministic science and prompt templates may yield varying outputs; (ii) you are solely liable for complying with acceptable use policies of external AI models; and (iii) Prizom is not liable for output content or violations committed when feeding Prizom prompt templates to external services.
                  </p>
                </div>
              </section>

              {/* 9 */}
              <section id="dmca" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4 flex items-center text-zinc-950">
                  <ShieldAlert className="w-5.5 h-5.5 mr-2 text-red-500" />
                  9. Copyright & DMCA Policy
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Prizom respects intellectual property. Under the Digital Millennium Copyright Act (&quot;DMCA&quot;), we will immediately process valid copyright infringement notifications. If you believe your original content is hosted on Prizom without permission, please email our Designated Agent at <a href="mailto:copyright@prizom.in" className="text-indigo-600 font-bold hover:underline">copyright@prizom.in</a> in accordance with our complete <Link href="/copyright-policy" className="text-indigo-600 hover:underline">Copyright Policy</Link>.
                  </p>
                </div>
              </section>

              {/* 10 */}
              <section id="prohibited" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  10. Prohibited Activities
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    You represent and covenant that you will not: (i) engage in screen-scraping, automated database harvesting, or script querying of our public feeds without express API integration licenses; (ii) overload, stress-test, or conduct denial-of-service (DoS) attempts against our Supabase clusters; (iii) reverse-engineer Prizom&apos;s layout architectures; or (iv) bypass authentication states to gain access to private prompt collections.
                  </p>
                </div>
              </section>

              {/* 11 */}
              <section id="moderation" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  11. Platform Moderation Rights
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    To safeguard our community, Prizom reserves the absolute right, but does not assume the obligation, to: (i) monitor, audit, flag, or inspect all public published content; (ii) remove, hide, or alter prompt text, descriptions, or images that violate these Terms or are deemed harmful; and (iii) configure indexing configurations (such as blocking specific search keywords).
                  </p>
                </div>
              </section>

              {/* 12 */}
              <section id="termination" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  12. Account Suspension & Termination
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    We reserve the right to suspend, restrict, or completely terminate your profile access and delete your database collections at our sole discretion, without notice or liability, if we determine you have violated these Terms, engaged in copyright infringement, or engaged in fraudulent behaviors.
                  </p>
                  <p>
                    You may delete your account and profile data at any time via your account settings panel, which will trigger the erasure of your profiles and prompt collections from our active Supabase tables.
                  </p>
                </div>
              </section>

              {/* 13 */}
              <section id="third-party" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  13. Third-Party Services
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Our services integrate with various third-party architectures, notably **Supabase** for database hosting, cloud storage, and authentication protocols. 
                  </p>
                  <p>
                    By utilizing Prizom, you acknowledge that your usage is also subject to the operational guidelines and policies of our third-party infrastructure partners. Prizom is not responsible for any downtime, data loss, or service changes committed by third-party service providers.
                  </p>
                </div>
              </section>

              {/* 14 */}
              <section id="disclaimer" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  14. Disclaimer of Warranties
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold uppercase tracking-wide bg-zinc-50 p-6 rounded-2xl border border-zinc-200/50 space-y-4">
                  <p>
                    PRIZOM&apos;S SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. PRIZOM EXPRESSLY DISCLAIMS ALL WARRANTIES, GUARANTEES, OR REPRESENTATIONS OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OPERATIONAL UP-TIME, PROMPT SUCCESS RATES, AND NON-INFRINGEMENT.
                  </p>
                  <p>
                    WE DO NOT WARRANT THAT OUR DATABASES WILL OPERATE SECURELY WITHOUT DOWNTIME, OR THAT INDEXED PROMPTS WILL RENDER IDENTICALLY ACROSS THIRD-PARTY AI NEURAL NETWORKS.
                  </p>
                </div>
              </section>

              {/* 15 */}
              <section id="liability" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  15. Limitation of Liability
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold uppercase tracking-wide bg-zinc-50 p-6 rounded-2xl border border-zinc-200/50 space-y-4">
                  <p>
                    IN NO EVENT SHALL PRIZOM, ITS CORE OPERATORS, PARTNERS, OR SUPABASE AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA LOSS, LOSS OF CREATOR FOLLOWINGS, OR PROMPT TEMPLATE ACCIDENTALLY DELETED, RESULTING FROM (I) YOUR USE OF OR INABILITY TO ACCESS THE PLATFORM; (II) ANY UNAUTHORIZED ACCESS TO OUR CLOUD DATABASES; OR (III) THE OUTPUT RENDER COMPLIANCE OF WORKFLOWS.
                  </p>
                </div>
              </section>

              {/* 16 */}
              <section id="indemnity" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  16. Indemnification
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    You agree to defend, indemnify, and hold harmless Prizom and its affiliates, core operators, and suppliers from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney&apos;s fees) arising from: (i) your access to the platform; (ii) your violation of these Terms; or (iii) any copyright or privacy infringement caused by your published prompt scripts.
                  </p>
                </div>
              </section>

              {/* 17 */}
              <section id="governing-law" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  17. Governing Law & Dispute Resolution
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    These Terms of Service and any disputes arising out of or related to your use of Prizom shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles. 
                  </p>
                  <p>
                    If you are a resident of India, you agree that any disputes arising out of these Terms shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996, in New Delhi. In other global jurisdictions, any legal action arising from these Terms shall be filed exclusively in the federal or state courts located in Delaware.
                  </p>
                </div>
              </section>

              {/* 18 */}
              <section id="changes" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  18. Changes to Terms
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Prizom reserves the right to modify or replace these Terms at any time. When material adjustments are made, we will notify creators by updating the &quot;Last Updated&quot; date at the top of this page.
                  </p>
                  <p>
                    By continuing to access Prizom or publish prompt parameters following the execution of changes, you declare your active consent to the revised terms.
                  </p>
                </div>
              </section>

              {/* 19 */}
              <section id="contact" className="scroll-mt-24 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  19. Contact Information
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    If you have questions, inquiries, or feedback regarding these Terms, please contact our legal office:
                  </p>
                  <div className="p-6 bg-white border border-zinc-200/60 rounded-2xl shadow-sm space-y-2">
                    <p className="font-bold text-zinc-900">Prizom Legal & Compliance Operations</p>
                    <p>Email: <a href="mailto:legal@prizom.in" className="text-indigo-600 font-bold hover:underline">legal@prizom.in</a></p>
                    <p>Address: Prizom operates remotely from India. The registered office address will be updated after company incorporation.</p>
                  </div>
                </div>
              </section>

            </div>
          </main>

        </div>

      </div>
    </div>
  );
}
