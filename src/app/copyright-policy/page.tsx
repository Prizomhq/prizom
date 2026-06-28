'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, Clock, ArrowLeft, ShieldAlert, Mail } from 'lucide-react';

export default function CopyrightPolicy() {
  const lastUpdated = 'June 26, 2026';

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-800 pt-28 pb-6 md:pb-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-[1600px] mx-auto">
        {/* Breadcrumbs & Title */}
        <div className="max-w-5xl mx-auto mb-10">
          <nav className="flex items-center space-x-2 text-[10px] font-black text-zinc-400 mb-6 uppercase tracking-widest">
            <Link href="/" className="hover:text-[var(--color-electric-blue)] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-zinc-600">Copyright Policy</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200/60 pb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight flex items-center">
                <Scale className="w-8 h-8 mr-3 text-indigo-600 shrink-0" />
                Copyright & DMCA Policy
              </h1>
              <p className="text-zinc-500 font-semibold text-xs mt-2">
                DMCA takedowns, creator protection, and prompt template copyright procedures
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
              Prizom respects the intellectual property rights of digital artists and prompt engineers. In accordance with the Digital Millennium Copyright Act ("DMCA") and international IP frameworks, we respond expeditiously to clear notices of alleged copyright infringement.
            </div>

            {/* Section 1 */}
            <section className="border-b border-zinc-200/60 pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center">
                <ShieldAlert className="w-4.5 h-4.5 mr-2 text-indigo-500" />
                1. How to File an Infringement Claim (Takedown Notice)
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  If you are a copyright owner or authorized representative, and believe that content hosted on Prizom (such as prompt texts or output images) infringes your rights, you may submit a formal notification by emailing our Designated Copyright Agent at <a href="mailto:copyright@prizom.in" className="text-indigo-600 font-bold hover:underline">copyright@prizom.in</a>.
                </p>
                <p>
                  Your notification must include the following information:
                </p>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>A physical or electronic signature of a person authorized to act on behalf of the owner of the copyright that is allegedly infringed.</li>
                  <li>Identification of the copyrighted work claimed to have been infringed (e.g., links to your original artwork, registration codes).</li>
                  <li>Identification of the material on Prizom that is claimed to be infringing, including the specific page URLs so we can locate the material.</li>
                  <li>Your contact information, including physical mailing address, telephone number, and email address.</li>
                  <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
                  <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner.</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section className="border-b border-zinc-200/60 pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4">
                2. Counter-Notification Procedure
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  If your content has been removed or disabled due to a copyright infringement claim, and you believe this action was taken in error or that you hold appropriate licensing rights, you may submit a Counter-Notification to our agent containing:
                </p>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Your physical or electronic signature.</li>
                  <li>Identification of the material that has been removed or to which access has been disabled and the location (URLs) at which the material appeared before removal.</li>
                  <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification.</li>
                  <li>Your name, address, telephone number, and email, along with a statement that you consent to the jurisdiction of the federal court district in which your address is located (or Delaware/California for international creators), and that you will accept service of process from the person who provided the original infringement notification.</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="border-b border-zinc-200/60 pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4">
                3. Repeat Infringer Policy
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  To protect creators, Prizom enforces a strict repeat infringer policy. Accounts that receive three (3) or more valid copyright infringement notices will be permanently deactivated. All prompt templates, followers, and public catalog entries of banned repeat infringers will be scrubbed from active Supabase nodes.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="pb-8">
              <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center">
                <Mail className="w-4.5 h-4.5 mr-2 text-indigo-500" />
                4. Copyright Desk Contact
              </h3>
              <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-semibold space-y-4">
                <p>
                  Please address all copyright notices and counter-notifications to:
                </p>
                <div className="p-6 bg-white border border-zinc-200/60 rounded-2xl shadow-sm space-y-2 w-fit">
                  <p className="font-bold text-zinc-900">Prizom Designated Copyright Desk</p>
                  <p>Email: <a href="mailto:copyright@prizom.in" className="text-indigo-600 font-bold hover:underline">copyright@prizom.in</a></p>
                  <p>Address: Prizom operates remotely from India. The registered office address will be updated after company incorporation.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
