'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Clock, ArrowLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';

const sections = [
  { id: 'collect', label: '1. Information We Collect' },
  { id: 'auth-data', label: '2. Account & Auth Data' },
  { id: 'analytics', label: '3. Usage Analytics' },
  { id: 'cookies', label: '4. Cookies & Sessions' },
  { id: 'content', label: '5. Uploaded Content Handling' },
  { id: 'visibility', label: '6. Profile Visibility' },
  { id: 'collections', label: '7. Saved Collections' },
  { id: 'remix-social', label: '8. Remix & Interaction Data' },
  { id: 'usage', label: '9. How Data Is Used' },
  { id: 'lawful-basis', label: '10. Lawful Bases for Processing' },
  { id: 'sharing', label: '11. Data Sharing' },
  { id: 'third-party', label: '12. Third-Party Integrations' },
  { id: 'security', label: '13. Security Practices' },
  { id: 'retention', label: '14. Data Retention' },
  { id: 'international', label: '15. International & DPDP Compliance' },
  { id: 'children', label: '16. Children’s Privacy' },
  { id: 'rights', label: '17. User Rights & Controls' },
  { id: 'deletion', label: '18. Account Deletions' },
  { id: 'updates', label: '19. Policy Updates' },
  { id: 'contact', label: '20. Contact & Grievance Desk' },
];

export default function PrivacyPolicy() {
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
            <span className="text-zinc-600">Privacy Policy</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200/60 pb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight flex items-center">
                <Lock className="w-8 h-8 mr-3 text-indigo-600 shrink-0" />
                Privacy Policy
              </h1>
              <p className="text-zinc-500 font-semibold text-xs mt-2">
                Prizom Generative Prompt Engineering Registry Data Auditing & Compliance
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
                Prizom (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is dedicated to protecting the privacy, identity, and personal records of our prompt creators. This Privacy Policy details how we collect, process, index, and safeguard your account parameters, cloud metadata, files, and interactions across our Supabase servers and cloud integrations.
              </div>

              {/* 1 */}
              <section id="collect" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4 flex items-center">
                  1. Information We Collect
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    To run our open prompt registry and dynamic remix engine, we process various data types depending on your platform activities. We collect both information you directly provide and analytics triggered during usage.
                  </p>
                  <p>
                    This includes registration inputs, prompt text structures, image files, social telemetry, saved collections configuration, and device diagnostic records necessary for platform stability.
                  </p>
                </div>
              </section>

              {/* 2 */}
              <section id="auth-data" className="scroll-mt-24 border-b border-zinc-200/60 pb-8 bg-gradient-to-br from-indigo-50/20 to-transparent p-6 rounded-2xl border border-indigo-100/50">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  2. Account & Authentication Data (Supabase Auth)
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    All creator accounts are registered and secured using **Supabase Authentication** pipelines.
                  </p>
                  <p>
                    When establishing a profile, we collect your verified email address, chosen username, display name, and avatar image. Passwords are encrypted instantly on Supabase&apos;s secure infrastructure. Prizom engineers never store, see, or transmit plain-text passwords or hashes on external nodes. Secure access tokens (JWT) are dispatched to verify your identity on subsequent refreshes.
                  </p>
                </div>
              </section>

              {/* 3 */}
              <section id="analytics" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  3. Usage Analytics
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    To optimize searching and highlight trending workflows, Prizom logs user interactions. 
                  </p>
                  <p>
                    We track specific metrics including prompt page views, copy actions (when you click the clipboard copy button on a prompt text block), prompt star ratings, and following events. This analytics data is stored securely in our databases to control feed ordering algorithms. We do not drop analytics tracking cookies on guests without active opt-in consent.
                  </p>
                </div>
              </section>

              {/* 4 */}
              <section id="cookies" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  4. Cookies & Session Tracking
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    We use standard browser cookies, LocalStorage objects, and secure session identifiers.
                  </p>
                  <p>
                    These trackers are used strictly to retain your session state (preventing continuous logouts) and store minor UI preferences (like sidebar collapse states). You can configure your browser to reject cookies, though doing so will restrict Supabase from logging you into active creator dashboards. For more details, see our dedicated <Link href="/cookie-policy" className="text-indigo-600 hover:underline">Cookie Policy</Link>.
                  </p>
                </div>
              </section>

              {/* 5 */}
              <section id="content" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  5. Uploaded Content Handling (Cloud Storage)
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    When you upload an AI prompt template, the textual structures (the prompt text, negative variables, settings) are written to our relational databases.
                  </p>
                  <p>
                    Any output images or illustrative assets you submit are securely transmitted and stored inside dedicated public **Supabase Storage Buckets**. By publishing content to public tables, you acknowledge that all associated prompt texts and output files are accessible to global web crawlers and public search queries.
                  </p>
                </div>
              </section>

              {/* 6 */}
              <section id="visibility" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  6. Profile Visibility
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    By design, Prizom creator profiles are public index pages.
                  </p>
                  <p>
                    Any details you fill out in your settings (including your display name, creator username, avatar graphic, personal bio description, and social profile links) are visible to all visitors. We advise against placing private, identifying contact numbers inside public biography fields.
                  </p>
                </div>
              </section>

              {/* 7 */}
              <section id="collections" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  7. Saved Collections Data
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    When you bookmark prompts into aesthetic folders, this metadata is written to Prizom database associations.
                  </p>
                  <p>
                    Saved collections catalog prompt linkages and are stored within your profile. By default, these collection lists are configured according to your chosen settings, allowing you to organize AI workflows cleanly.
                  </p>
                </div>
              </section>

              {/* 8 */}
              <section id="remix-social" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  8. Remix & Interaction Data
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Prizom&apos;s signature remix engine logs parent prompt relationships.
                  </p>
                  <p>
                    When you click the &quot;Remix&quot; button, our database tracks the origin prompt ID to establish the genetic lineage. This relationship, including your creator username and the linked parent profile avatar, is published to the public prompt details page to acknowledge dual attribution.
                  </p>
                </div>
              </section>

              {/* 9 */}
              <section id="usage" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  9. How Data Is Used
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    We process gathered parameters to: (i) administer and secure your creator profile; (ii) index prompts to facilitate fast search results; (iii) deliver trending analytics; (iv) verify system safety and block injection payloads; and (v) resolve user support requests submitted via our contact forms.
                  </p>
                </div>
              </section>

              {/* 10 */}
              <section id="lawful-basis" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  10. Lawful Bases for Processing (GDPR Compliance)
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    If you reside within the European Economic Area (EEA) or the United Kingdom, we process your personal data under the following lawful bases:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Contractual Necessity:</strong> To create your account, manage your profile, and host your prompt registries.</li>
                    <li><strong>Consent:</strong> For non-essential tracking cookies and marketing analytics, which you can withdraw at any time.</li>
                    <li><strong>Legitimate Interests:</strong> To optimize feed ordering, secure the platform, prevent spam, and enforce RLS controls.</li>
                    <li><strong>Legal Obligation:</strong> To satisfy corporate records audits or answer lawful subpoenas.</li>
                  </ul>
                </div>
              </section>

              {/* 11 */}
              <section id="sharing" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  11. Data Sharing Practices
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    **Prizom does not sell, rent, or trade your personal information or prompt metadata to third-party brokers.**
                  </p>
                  <p>
                    We share data exclusively with trusted third-party cloud infrastructure vendors (such as Supabase for core databases and storage buckets) to host our digital platform, and under statutory obligations if requested by law enforcement to address fraud or safety issues.
                  </p>
                </div>
              </section>

              {/* 12 */}
              <section id="third-party" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  12. Third-Party Integrations
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Prizom&apos;s search canvas integrates multiple cloud modules, including:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-zinc-700">Supabase:</strong> For relational tables, file storage nodes, and auth handlers.</li>
                    <li><strong className="text-zinc-700">Cloudinary:</strong> For responsive profile avatar storage.</li>
                  </ul>
                </div>
              </section>

              {/* 13 */}
              <section id="security" className="scroll-mt-24 border-b border-zinc-200/60 pb-8 bg-zinc-50 p-6 rounded-2xl border border-zinc-200/60">
                <h3 className="text-xl font-black text-zinc-900 mb-4 flex items-center text-zinc-950">
                  <ShieldCheck className="w-5.5 h-5.5 mr-2 text-indigo-600" />
                  13. Security Practices
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    We prioritize data safety. Prizom enforces standard enterprise security rules, including:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Enforced SSL/TLS 1.3 encryption protocols for all data in transit.</li>
                    <li>Strict Supabase Row-Level Security (RLS) filters preventing creators from modifying or editing other engineers&apos; prompt entries.</li>
                    <li>AES-256 cloud encryption parameters for data at rest.</li>
                  </ul>
                </div>
              </section>

              {/* 14 */}
              <section id="retention" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  14. Data Retention
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    We retain your profile data, database entries, and saved collections for as long as your account remains active.
                  </p>
                  <p>
                    If you submit a formal account erasure trigger, your database entries, files, and credentials enter a 15-day recovery window. After this cooling-off period, data is deleted from active tables. Backup archives are overwritten naturally within a 90-day retention cycle.
                  </p>
                </div>
              </section>

              {/* 15 */}
              <section id="international" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  15. International & DPDP Compliance
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Prizom operates globally. For residents of India, we process your personal data in accordance with the **Digital Personal Data Protection (DPDP) Act, 2023**.
                  </p>
                  <p>
                    Under the DPDP Act, you possess the Right to correction, right to erasure, and right to grievance redressal. You can appoint a **Consent Manager** to manage or withdraw your consent. If you wish to withdraw consent or exercise your rights under the DPDP Act or GDPR, please contact our Grievance Officer detailed in Section 20.
                  </p>
                </div>
              </section>

              {/* 16 */}
              <section id="children" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  16. Children’s Privacy
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    Prizom is not intended for minors. 
                  </p>
                  <p>
                    In accordance with the India DPDP Act 2023 (Section 9), we do not knowingly process personal data of children under **18 years of age** in India without verifiable parental consent. For US and global residents under COPPA, we do not knowingly collect records of children under 13. If we learn that we have inadvertently collected data of a minor without appropriate consent, we will delete the account immediately.
                  </p>
                </div>
              </section>

              {/* 17 */}
              <section id="rights" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  17. User Rights & Controls
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    You retain extensive rights over your information, including the ability to: (i) access and export your profile and prompt database entries; (ii) edit or update your display parameters; and (iii) configure active visibility settings for folder collections.
                  </p>
                  <p>
                    For California residents, under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), your rights also include the Right to Know what personal information we collect, the Right to Delete that information, the Right to Opt-Out of the sale or sharing of personal information, and the Right to Non-Discrimination for exercising your privacy rights.
                  </p>
                </div>
              </section>

              {/* 18 */}
              <section id="deletion" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  18. Account Deletion Requests
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    You can trigger an account deletion request inside your user settings portal.
                  </p>
                  <p>
                    This will schedule your account for permanent deletion after 15 days, after which a SQL delete trigger cleanly wipes your profile rows, followers, saved folders, and public prompt template associations from our active tables.
                  </p>
                </div>
              </section>

              {/* 19 */}
              <section id="updates" className="scroll-mt-24 border-b border-zinc-200/60 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  19. Updates to Policy
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    We may update this Privacy Policy from time to time. When modifications are performed, we will publish the adjusted policy here and revise the &quot;Last Updated&quot; metric at the top of the portal.
                  </p>
                </div>
              </section>

              {/* 20 */}
              <section id="contact" className="scroll-mt-24 pb-8">
                <h3 className="text-xl font-black text-zinc-900 mb-4">
                  20. Contact & Grievance Desk
                </h3>
                <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                  <p>
                    If you have inquiries, complaints, seek to withdraw consent, or wish to exercise your data subject rights, please email our privacy Operations desk or file a ticket with our Grievance Redressal Desk. Under the Indian IT Rules, we will acknowledge any complaint within 24 hours and resolve it within 15 days of receipt.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="p-6 bg-white border border-zinc-200/60 rounded-2xl shadow-sm space-y-2">
                      <p className="font-bold text-zinc-900">Privacy & Data Protection Desk</p>
                      <p>Email: <a href="mailto:privacy@prizom.in" className="text-indigo-600 font-bold hover:underline">privacy@prizom.in</a></p>
                      <p>Address: Prizom operates remotely from India. The registered office address will be updated after company incorporation.</p>
                    </div>

                    <div className="p-6 bg-white border border-indigo-100/50 rounded-2xl shadow-sm space-y-2 border-l-4 border-l-indigo-650">
                      <p className="font-bold text-zinc-900">Grievance Redressal Desk (India)</p>
                      <p className="font-bold text-xs text-zinc-650">Grievance Officer: Darshan Vaghela, Founder</p>
                      <p>Email: <a href="mailto:grievance@prizom.in" className="text-indigo-600 font-bold hover:underline">grievance@prizom.in</a></p>
                      <p>Address: Prizom operates remotely from India. The registered office address will be updated after company incorporation.</p>
                    </div>
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
